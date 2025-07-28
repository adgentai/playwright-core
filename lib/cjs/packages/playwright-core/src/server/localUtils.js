'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('../../../../bundles/fs.js');
const os = require('node:os');
const path = require('node:path');
const crypto = require('./utils/crypto.js');
const harBackend = require('./harBackend.js');
const manualPromise = require('../utils/isomorphic/manualPromise.js');
const zipFile = require('./utils/zipFile.js');
const zipBundle = require('../zipBundle.js');
const traceUtils = require('../utils/isomorphic/traceUtils.js');
const assert = require('../utils/isomorphic/assert.js');
const fileUtils = require('./utils/fileUtils.js');

async function zip(progress, stackSessions, params) {
  const promise = new manualPromise.ManualPromise();
  const zipFile = new zipBundle.yazl.ZipFile();
  zipFile.on("error", (error) => promise.reject(error));
  const addFile = (file, name) => {
    try {
      if (fs.default.statSync(file).isFile())
        zipFile.addFile(file, name);
    } catch (e) {
    }
  };
  for (const entry of params.entries)
    addFile(entry.value, entry.name);
  const stackSession = params.stacksId ? stackSessions.get(params.stacksId) : void 0;
  if (stackSession?.callStacks.length) {
    await progress.race(stackSession.writer);
    if (process.env.PW_LIVE_TRACE_STACKS) {
      zipFile.addFile(stackSession.file, "trace.stacks");
    } else {
      const buffer = Buffer.from(JSON.stringify(traceUtils.serializeClientSideCallMetadata(stackSession.callStacks)));
      zipFile.addBuffer(buffer, "trace.stacks");
    }
  }
  if (params.includeSources) {
    const sourceFiles = /* @__PURE__ */ new Set();
    for (const { stack } of stackSession?.callStacks || []) {
      if (!stack)
        continue;
      for (const { file } of stack)
        sourceFiles.add(file);
    }
    for (const sourceFile of sourceFiles)
      addFile(sourceFile, "resources/src@" + await crypto.calculateSha1(sourceFile) + ".txt");
  }
  if (params.mode === "write") {
    await progress.race(fs.default.promises.mkdir(path.dirname(params.zipFile), { recursive: true }));
    zipFile.end(void 0, () => {
      zipFile.outputStream.pipe(fs.default.createWriteStream(params.zipFile)).on("close", () => promise.resolve()).on("error", (error) => promise.reject(error));
    });
    await progress.race(promise);
    await deleteStackSession(progress, stackSessions, params.stacksId);
    return;
  }
  const tempFile = params.zipFile + ".tmp";
  await progress.race(fs.default.promises.rename(params.zipFile, tempFile));
  zipBundle.yauzl.open(tempFile, (err, inZipFile) => {
    if (err) {
      promise.reject(err);
      return;
    }
    assert.assert(inZipFile);
    let pendingEntries = inZipFile.entryCount;
    inZipFile.on("entry", (entry) => {
      inZipFile.openReadStream(entry, (err2, readStream) => {
        if (err2) {
          promise.reject(err2);
          return;
        }
        zipFile.addReadStream(readStream, entry.fileName);
        if (--pendingEntries === 0) {
          zipFile.end(void 0, () => {
            zipFile.outputStream.pipe(fs.default.createWriteStream(params.zipFile)).on("close", () => {
              fs.default.promises.unlink(tempFile).then(() => {
                promise.resolve();
              }).catch((error) => promise.reject(error));
            });
          });
        }
      });
    });
  });
  await progress.race(promise);
  await deleteStackSession(progress, stackSessions, params.stacksId);
}
async function deleteStackSession(progress, stackSessions, stacksId) {
  const session = stacksId ? stackSessions.get(stacksId) : void 0;
  if (!session)
    return;
  stackSessions.delete(stacksId);
  if (session.tmpDir)
    await progress.race(fileUtils.removeFolders([session.tmpDir]));
}
async function harOpen(progress, harBackends, params) {
  let harBackend$1;
  if (params.file.endsWith(".zip")) {
    const zipFile$1 = new zipFile.ZipFile(params.file);
    const entryNames = await zipFile$1.entries();
    const harEntryName = entryNames.find((e) => e.endsWith(".har"));
    if (!harEntryName)
      return { error: "Specified archive does not have a .har file" };
    const har = await progress.raceWithCleanup(zipFile$1.read(harEntryName), () => zipFile$1.close());
    const harFile = JSON.parse(har.toString());
    harBackend$1 = new harBackend.HarBackend(harFile, null, zipFile$1);
  } else {
    const harFile = JSON.parse(await progress.race(fs.default.promises.readFile(params.file, "utf-8")));
    harBackend$1 = new harBackend.HarBackend(harFile, path.dirname(params.file), null);
  }
  harBackends.set(harBackend$1.id, harBackend$1);
  return { harId: harBackend$1.id };
}
async function harLookup(progress, harBackends, params) {
  const harBackend = harBackends.get(params.harId);
  if (!harBackend)
    return { action: "error", message: `Internal error: har was not opened` };
  return await progress.race(harBackend.lookup(params.url, params.method, params.headers, params.postData, params.isNavigationRequest));
}
function harClose(harBackends, params) {
  const harBackend = harBackends.get(params.harId);
  if (harBackend) {
    harBackends.delete(harBackend.id);
    harBackend.dispose();
  }
}
async function harUnzip(progress, params) {
  const dir = path.dirname(params.zipFile);
  const zipFile$1 = new zipFile.ZipFile(params.zipFile);
  progress.cleanupWhenAborted(() => zipFile$1.close());
  for (const entry of await progress.race(zipFile$1.entries())) {
    const buffer = await progress.race(zipFile$1.read(entry));
    if (entry === "har.har")
      await progress.race(fs.default.promises.writeFile(params.harFile, buffer));
    else
      await progress.race(fs.default.promises.writeFile(path.join(dir, entry), buffer));
  }
  await progress.race(fs.default.promises.unlink(params.zipFile));
  zipFile$1.close();
}
async function tracingStarted(progress, stackSessions, params) {
  let tmpDir = void 0;
  if (!params.tracesDir)
    tmpDir = await progress.race(fs.default.promises.mkdtemp(path.join(os.tmpdir(), "playwright-tracing-")));
  const traceStacksFile = path.join(params.tracesDir || tmpDir, params.traceName + ".stacks");
  stackSessions.set(traceStacksFile, { callStacks: [], file: traceStacksFile, writer: Promise.resolve(), tmpDir });
  return { stacksId: traceStacksFile };
}
async function traceDiscarded(progress, stackSessions, params) {
  await deleteStackSession(progress, stackSessions, params.stacksId);
}
function addStackToTracingNoReply(stackSessions, params) {
  for (const session of stackSessions.values()) {
    session.callStacks.push(params.callData);
    if (process.env.PW_LIVE_TRACE_STACKS) {
      session.writer = session.writer.then(() => {
        const buffer = Buffer.from(JSON.stringify(traceUtils.serializeClientSideCallMetadata(session.callStacks)));
        return fs.default.promises.writeFile(session.file, buffer);
      });
    }
  }
}

exports.addStackToTracingNoReply = addStackToTracingNoReply;
exports.harClose = harClose;
exports.harLookup = harLookup;
exports.harOpen = harOpen;
exports.harUnzip = harUnzip;
exports.traceDiscarded = traceDiscarded;
exports.tracingStarted = tracingStarted;
exports.zip = zip;
