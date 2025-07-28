'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('../../../../../bundles/fs.js');
const path = require('node:path');
const manualPromise = require('../../utils/isomorphic/manualPromise.js');
const zipBundle = require('../../zipBundle.js');

const existsAsync = (path2) => new Promise((resolve) => fs.default.stat(path2, (err) => resolve(!err)));
async function mkdirIfNeeded(filePath) {
  await fs.default.promises.mkdir(path.dirname(filePath), { recursive: true }).catch(() => {
  });
}
async function removeFolders(dirs) {
  return await Promise.all(dirs.map(
    (dir) => fs.default.promises.rm(dir, { recursive: true, force: true, maxRetries: 10 }).catch((e) => e)
  ));
}
function canAccessFile(file) {
  if (!file)
    return false;
  try {
    fs.default.accessSync(file);
    return true;
  } catch (e) {
    return false;
  }
}
function sanitizeForFilePath(s) {
  return s.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, "-");
}
function toPosixPath(aPath) {
  return aPath.split(path.sep).join(path.posix.sep);
}
class SerializedFS {
  constructor() {
    this._buffers = /* @__PURE__ */ new Map();
    this._operations = [];
    this._operationsDone = new manualPromise.ManualPromise();
    this._operationsDone.resolve();
  }
  mkdir(dir) {
    this._appendOperation({ op: "mkdir", dir });
  }
  writeFile(file, content, skipIfExists) {
    this._buffers.delete(file);
    this._appendOperation({ op: "writeFile", file, content, skipIfExists });
  }
  appendFile(file, text, flush) {
    if (!this._buffers.has(file))
      this._buffers.set(file, []);
    this._buffers.get(file).push(text);
    if (flush)
      this._flushFile(file);
  }
  _flushFile(file) {
    const buffer = this._buffers.get(file);
    if (buffer === void 0)
      return;
    const content = buffer.join("");
    this._buffers.delete(file);
    this._appendOperation({ op: "appendFile", file, content });
  }
  copyFile(from, to) {
    this._flushFile(from);
    this._buffers.delete(to);
    this._appendOperation({ op: "copyFile", from, to });
  }
  async syncAndGetError() {
    for (const file of this._buffers.keys())
      this._flushFile(file);
    await this._operationsDone;
    return this._error;
  }
  zip(entries, zipFileName) {
    for (const file of this._buffers.keys())
      this._flushFile(file);
    this._appendOperation({ op: "zip", entries, zipFileName });
  }
  // This method serializes all writes to the trace.
  _appendOperation(op) {
    const last = this._operations[this._operations.length - 1];
    if (last?.op === "appendFile" && op.op === "appendFile" && last.file === op.file) {
      last.content += op.content;
      return;
    }
    this._operations.push(op);
    if (this._operationsDone.isDone())
      this._performOperations();
  }
  async _performOperations() {
    this._operationsDone = new manualPromise.ManualPromise();
    while (this._operations.length) {
      const op = this._operations.shift();
      if (this._error)
        continue;
      try {
        await this._performOperation(op);
      } catch (e) {
        this._error = e;
      }
    }
    this._operationsDone.resolve();
  }
  async _performOperation(op) {
    switch (op.op) {
      case "mkdir": {
        await fs.default.promises.mkdir(op.dir, { recursive: true });
        return;
      }
      case "writeFile": {
        if (op.skipIfExists)
          await fs.default.promises.writeFile(op.file, op.content, { flag: "wx" }).catch(() => {
          });
        else
          await fs.default.promises.writeFile(op.file, op.content);
        return;
      }
      case "copyFile": {
        await fs.default.promises.copyFile(op.from, op.to);
        return;
      }
      case "appendFile": {
        await fs.default.promises.appendFile(op.file, op.content);
        return;
      }
      case "zip": {
        const zipFile = new zipBundle.yazl.ZipFile();
        const result = new manualPromise.ManualPromise();
        zipFile.on("error", (error) => result.reject(error));
        for (const entry of op.entries)
          zipFile.addFile(entry.value, entry.name);
        zipFile.end();
        zipFile.outputStream.pipe(fs.default.createWriteStream(op.zipFileName)).on("close", () => result.resolve()).on("error", (error) => result.reject(error));
        await result;
        return;
      }
    }
  }
}

exports.SerializedFS = SerializedFS;
exports.canAccessFile = canAccessFile;
exports.existsAsync = existsAsync;
exports.mkdirIfNeeded = mkdirIfNeeded;
exports.removeFolders = removeFolders;
exports.sanitizeForFilePath = sanitizeForFilePath;
exports.toPosixPath = toPosixPath;
