'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('../../../../../bundles/fs.js');
const path = require('node:path');
const artifact = require('../artifact.js');
const harTracer = require('./harTracer.js');
const crypto = require('../utils/crypto.js');
const manualPromise = require('../../utils/isomorphic/manualPromise.js');
const zipBundle = require('../../zipBundle.js');

class HarRecorder {
  constructor(context, page, options) {
    this._isFlushed = false;
    this._entries = [];
    this._zipFile = null;
    this._writtenZipEntries = /* @__PURE__ */ new Set();
    this._artifact = new artifact.Artifact(context, path.join(context._browser.options.artifactsDir, `${crypto.createGuid()}.har`));
    const urlFilterRe = options.urlRegexSource !== void 0 && options.urlRegexFlags !== void 0 ? new RegExp(options.urlRegexSource, options.urlRegexFlags) : void 0;
    const expectsZip = !!options.zip;
    const content = options.content || (expectsZip ? "attach" : "embed");
    this._tracer = new harTracer.HarTracer(context, page, this, {
      content,
      slimMode: options.mode === "minimal",
      includeTraceInfo: false,
      recordRequestOverrides: true,
      waitForContentOnStop: true,
      urlFilter: urlFilterRe ?? options.urlGlob
    });
    this._zipFile = content === "attach" || expectsZip ? new zipBundle.yazl.ZipFile() : null;
    this._tracer.start({ omitScripts: false });
  }
  onEntryStarted(entry) {
    this._entries.push(entry);
  }
  onEntryFinished(entry) {
  }
  onContentBlob(sha1, buffer) {
    if (!this._zipFile || this._writtenZipEntries.has(sha1))
      return;
    this._writtenZipEntries.add(sha1);
    this._zipFile.addBuffer(buffer, sha1);
  }
  async flush() {
    if (this._isFlushed)
      return;
    this._isFlushed = true;
    await this._tracer.flush();
    const log = this._tracer.stop();
    log.entries = this._entries;
    const harFileContent = jsonStringify({ log });
    if (this._zipFile) {
      const result = new manualPromise.ManualPromise();
      this._zipFile.on("error", (error) => result.reject(error));
      this._zipFile.addBuffer(Buffer.from(harFileContent, "utf-8"), "har.har");
      this._zipFile.end();
      this._zipFile.outputStream.pipe(fs.default.createWriteStream(this._artifact.localPath())).on("close", () => {
        result.resolve();
      });
      await result;
    } else {
      await fs.default.promises.writeFile(this._artifact.localPath(), harFileContent);
    }
  }
  async export() {
    await this.flush();
    this._artifact.reportFinished();
    return this._artifact;
  }
}
function jsonStringify(object) {
  const tokens = [];
  innerJsonStringify(object, tokens, "", false, void 0);
  return tokens.join("");
}
function innerJsonStringify(object, tokens, indent, flat, parentKey) {
  if (typeof object !== "object" || object === null) {
    tokens.push(JSON.stringify(object));
    return;
  }
  const isArray = Array.isArray(object);
  if (!isArray && object.constructor.name !== "Object") {
    tokens.push(JSON.stringify(object));
    return;
  }
  const entries = isArray ? object : Object.entries(object).filter((e) => e[1] !== void 0);
  if (!entries.length) {
    tokens.push(isArray ? `[]` : `{}`);
    return;
  }
  const childIndent = `${indent}  `;
  let brackets;
  if (isArray)
    brackets = flat ? { open: "[", close: "]" } : { open: `[
${childIndent}`, close: `
${indent}]` };
  else
    brackets = flat ? { open: "{ ", close: " }" } : { open: `{
${childIndent}`, close: `
${indent}}` };
  tokens.push(brackets.open);
  for (let i = 0; i < entries.length; ++i) {
    const entry = entries[i];
    if (i)
      tokens.push(flat ? `, ` : `,
${childIndent}`);
    if (!isArray)
      tokens.push(`${JSON.stringify(entry[0])}: `);
    const key = isArray ? void 0 : entry[0];
    const flatten = flat || key === "timings" || parentKey === "headers";
    innerJsonStringify(isArray ? entry : entry[1], tokens, childIndent, flatten, key);
  }
  tokens.push(brackets.close);
}

exports.HarRecorder = HarRecorder;
