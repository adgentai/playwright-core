'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const childProcess = require('node:child_process');
const fs = require('../../../../../bundles/fs.js');
const os = require('node:os');
const path = require('node:path');
const debugLogger = require('../utils/debugLogger.js');
const manualPromise = require('../../utils/isomorphic/manualPromise.js');
const userAgent = require('../utils/userAgent.js');
const utilsBundle = require('../../utilsBundle.js');
const fileUtils = require('../utils/fileUtils.js');
const index = require('./index.js');

function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
  if (e) {
    for (const k in e) {
      if (k !== 'default') {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}

const childProcess__namespace = /*#__PURE__*/_interopNamespaceDefault(childProcess);

async function downloadBrowserWithProgressBar(title, browserDirectory, executablePath, downloadURLs, downloadFileName, downloadSocketTimeout) {
  if (await fileUtils.existsAsync(index.browserDirectoryToMarkerFilePath(browserDirectory))) {
    debugLogger.debugLogger.log("install", `${title} is already downloaded.`);
    return false;
  }
  const zipPath = path.join(os.tmpdir(), downloadFileName);
  try {
    const retryCount = 5;
    for (let attempt = 1; attempt <= retryCount; ++attempt) {
      debugLogger.debugLogger.log("install", `downloading ${title} - attempt #${attempt}`);
      const url = downloadURLs[(attempt - 1) % downloadURLs.length];
      logPolitely(`Downloading ${title}` + utilsBundle.colors.dim(` from ${url}`));
      const { error } = await downloadBrowserWithProgressBarOutOfProcess(title, browserDirectory, url, zipPath, executablePath, downloadSocketTimeout);
      if (!error) {
        debugLogger.debugLogger.log("install", `SUCCESS installing ${title}`);
        break;
      }
      if (await fileUtils.existsAsync(zipPath))
        await fs.default.promises.unlink(zipPath);
      if (await fileUtils.existsAsync(browserDirectory))
        await fs.default.promises.rmdir(browserDirectory, { recursive: true });
      const errorMessage = error?.message || "";
      debugLogger.debugLogger.log("install", `attempt #${attempt} - ERROR: ${errorMessage}`);
      if (attempt >= retryCount)
        throw error;
    }
  } catch (e) {
    debugLogger.debugLogger.log("install", `FAILED installation ${title} with error: ${e}`);
    process.exitCode = 1;
    throw e;
  } finally {
    if (await fileUtils.existsAsync(zipPath))
      await fs.default.promises.unlink(zipPath);
  }
  logPolitely(`${title} downloaded to ${browserDirectory}`);
  return true;
}
function downloadBrowserWithProgressBarOutOfProcess(title, browserDirectory, url, zipPath, executablePath, socketTimeout) {
  const cp = childProcess__namespace.fork(path.join("/home/runner/work/playwright/playwright/packages/playwright-cloudflare", "oopDownloadBrowserMain.js"));
  const promise = new manualPromise.ManualPromise();
  const progress = getDownloadProgress();
  cp.on("message", (message) => {
    if (message?.method === "log")
      debugLogger.debugLogger.log("install", message.params.message);
    if (message?.method === "progress")
      progress(message.params.done, message.params.total);
  });
  cp.on("exit", (code) => {
    if (code !== 0) {
      promise.resolve({ error: new Error(`Download failure, code=${code}`) });
      return;
    }
    if (!fs.default.existsSync(index.browserDirectoryToMarkerFilePath(browserDirectory)))
      promise.resolve({ error: new Error(`Download failure, ${index.browserDirectoryToMarkerFilePath(browserDirectory)} does not exist`) });
    else
      promise.resolve({ error: null });
  });
  cp.on("error", (error) => {
    promise.resolve({ error });
  });
  debugLogger.debugLogger.log("install", `running download:`);
  debugLogger.debugLogger.log("install", `-- from url: ${url}`);
  debugLogger.debugLogger.log("install", `-- to location: ${zipPath}`);
  const downloadParams = {
    title,
    browserDirectory,
    url,
    zipPath,
    executablePath,
    socketTimeout,
    userAgent: userAgent.getUserAgent()
  };
  cp.send({ method: "download", params: downloadParams });
  return promise;
}
function logPolitely(toBeLogged) {
  const logLevel = process.env.npm_config_loglevel;
  const logLevelDisplay = ["silent", "error", "warn"].indexOf(logLevel || "") > -1;
  if (!logLevelDisplay)
    console.log(toBeLogged);
}
function getDownloadProgress() {
  if (process.stdout.isTTY)
    return getAnimatedDownloadProgress();
  return getBasicDownloadProgress();
}
function getAnimatedDownloadProgress() {
  let progressBar;
  let lastDownloadedBytes = 0;
  return (downloadedBytes, totalBytes) => {
    if (!progressBar) {
      progressBar = new utilsBundle.progress(
        `${toMegabytes(
          totalBytes
        )} [:bar] :percent :etas`,
        {
          complete: "=",
          incomplete: " ",
          width: 20,
          total: totalBytes
        }
      );
    }
    const delta = downloadedBytes - lastDownloadedBytes;
    lastDownloadedBytes = downloadedBytes;
    progressBar.tick(delta);
  };
}
function getBasicDownloadProgress() {
  const totalRows = 10;
  const stepWidth = 8;
  let lastRow = -1;
  return (downloadedBytes, totalBytes) => {
    const percentage = downloadedBytes / totalBytes;
    const row = Math.floor(totalRows * percentage);
    if (row > lastRow) {
      lastRow = row;
      const percentageString = String(percentage * 100 | 0).padStart(3);
      console.log(`|${"■".repeat(row * stepWidth)}${" ".repeat((totalRows - row) * stepWidth)}| ${percentageString}% of ${toMegabytes(totalBytes)}`);
    }
  };
}
function toMegabytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb * 10) / 10} MiB`;
}

exports.downloadBrowserWithProgressBar = downloadBrowserWithProgressBar;
exports.logPolitely = logPolitely;
