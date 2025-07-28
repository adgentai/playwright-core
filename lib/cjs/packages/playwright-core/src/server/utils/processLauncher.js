'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const childProcess = require('node:child_process');
const fs = require('../../../../../bundles/fs.js');
const readline = require('node:readline');
const fileUtils = require('./fileUtils.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
const debug = require('./debug.js');
require('./debugLogger.js');
require('./hostPlatform.js');
require('node:path');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./happyEyeballs.js');
require('./nodePlatform.js');
require('./profiler.js');
require('./socksProxy.js');
require('node:os');
require('../../zipBundle.js');
require('./zones.js');

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
const readline__namespace = /*#__PURE__*/_interopNamespaceDefault(readline);

const gracefullyCloseSet = /* @__PURE__ */ new Set();
const killSet = /* @__PURE__ */ new Set();
async function gracefullyCloseAll() {
  await Promise.all(Array.from(gracefullyCloseSet).map((gracefullyClose) => gracefullyClose().catch((e) => {
  })));
}
function gracefullyProcessExitDoNotHang(code) {
  setTimeout(() => process.exit(code), 3e4);
  gracefullyCloseAll().then(() => {
    process.exit(code);
  });
}
function exitHandler() {
  for (const kill of killSet)
    kill();
}
let sigintHandlerCalled = false;
function sigintHandler() {
  const exitWithCode130 = () => {
    if (debug.isUnderTest()) {
      setTimeout(() => process.exit(130), 1e3);
    } else {
      process.exit(130);
    }
  };
  if (sigintHandlerCalled) {
    process.off("SIGINT", sigintHandler);
    for (const kill of killSet)
      kill();
    exitWithCode130();
  } else {
    sigintHandlerCalled = true;
    gracefullyCloseAll().then(() => exitWithCode130());
  }
}
function sigtermHandler() {
  gracefullyCloseAll();
}
function sighupHandler() {
  gracefullyCloseAll();
}
const installedHandlers = /* @__PURE__ */ new Set();
const processHandlers = {
  exit: exitHandler,
  SIGINT: sigintHandler,
  SIGTERM: sigtermHandler,
  SIGHUP: sighupHandler
};
function addProcessHandlerIfNeeded(name) {
  if (!installedHandlers.has(name)) {
    installedHandlers.add(name);
    process.on(name, processHandlers[name]);
  }
}
function removeProcessHandlersIfNeeded() {
  if (killSet.size)
    return;
  for (const handler of installedHandlers)
    process.off(handler, processHandlers[handler]);
  installedHandlers.clear();
}
async function launchProcess(options) {
  const stdio = options.stdio === "pipe" ? ["ignore", "pipe", "pipe", "pipe", "pipe"] : ["pipe", "pipe", "pipe"];
  options.log(`<launching> ${options.command} ${options.args ? options.args.join(" ") : ""}`);
  const spawnOptions = {
    // On non-windows platforms, `detached: true` makes child process a leader of a new
    // process group, making it possible to kill child process tree with `.kill(-pid)` command.
    // @see https://nodejs.org/api/child_process.html#child_process_options_detached
    detached: process.platform !== "win32",
    env: options.env,
    cwd: options.cwd,
    shell: options.shell,
    stdio
  };
  const spawnedProcess = childProcess__namespace.spawn(options.command, options.args || [], spawnOptions);
  const cleanup = async () => {
    options.log(`[pid=${spawnedProcess.pid || "N/A"}] starting temporary directories cleanup`);
    const errors = await fileUtils.removeFolders(options.tempDirectories);
    for (let i = 0; i < options.tempDirectories.length; ++i) {
      if (errors[i])
        options.log(`[pid=${spawnedProcess.pid || "N/A"}] exception while removing ${options.tempDirectories[i]}: ${errors[i]}`);
    }
    options.log(`[pid=${spawnedProcess.pid || "N/A"}] finished temporary directories cleanup`);
  };
  spawnedProcess.on("error", () => {
  });
  if (!spawnedProcess.pid) {
    let failed;
    const failedPromise = new Promise((f, r) => failed = f);
    spawnedProcess.once("error", (error) => {
      failed(new Error("Failed to launch: " + error));
    });
    return failedPromise.then((e) => Promise.reject(e));
  }
  options.log(`<launched> pid=${spawnedProcess.pid}`);
  const stdout = readline__namespace.createInterface({ input: spawnedProcess.stdout });
  stdout.on("line", (data) => {
    options.log(`[pid=${spawnedProcess.pid}][out] ` + data);
  });
  const stderr = readline__namespace.createInterface({ input: spawnedProcess.stderr });
  stderr.on("line", (data) => {
    options.log(`[pid=${spawnedProcess.pid}][err] ` + data);
  });
  let processClosed = false;
  let fulfillCleanup = () => {
  };
  const waitForCleanup = new Promise((f) => fulfillCleanup = f);
  spawnedProcess.once("close", (exitCode, signal) => {
    options.log(`[pid=${spawnedProcess.pid}] <process did exit: exitCode=${exitCode}, signal=${signal}>`);
    processClosed = true;
    gracefullyCloseSet.delete(gracefullyClose);
    killSet.delete(killProcessAndCleanup);
    removeProcessHandlersIfNeeded();
    options.onExit(exitCode, signal);
    cleanup().then(fulfillCleanup);
  });
  addProcessHandlerIfNeeded("exit");
  if (options.handleSIGINT)
    addProcessHandlerIfNeeded("SIGINT");
  if (options.handleSIGTERM)
    addProcessHandlerIfNeeded("SIGTERM");
  if (options.handleSIGHUP)
    addProcessHandlerIfNeeded("SIGHUP");
  gracefullyCloseSet.add(gracefullyClose);
  killSet.add(killProcessAndCleanup);
  let gracefullyClosing = false;
  async function gracefullyClose() {
    if (gracefullyClosing) {
      options.log(`[pid=${spawnedProcess.pid}] <forcefully close>`);
      killProcess();
      await waitForCleanup;
      return;
    }
    gracefullyClosing = true;
    options.log(`[pid=${spawnedProcess.pid}] <gracefully close start>`);
    await options.attemptToGracefullyClose().catch(() => killProcess());
    await waitForCleanup;
    options.log(`[pid=${spawnedProcess.pid}] <gracefully close end>`);
  }
  function killProcess() {
    gracefullyCloseSet.delete(gracefullyClose);
    killSet.delete(killProcessAndCleanup);
    removeProcessHandlersIfNeeded();
    options.log(`[pid=${spawnedProcess.pid}] <kill>`);
    if (spawnedProcess.pid && !spawnedProcess.killed && !processClosed) {
      options.log(`[pid=${spawnedProcess.pid}] <will force kill>`);
      try {
        if (process.platform === "win32") {
          const taskkillProcess = childProcess__namespace.spawnSync(`taskkill /pid ${spawnedProcess.pid} /T /F`, { shell: true });
          const [stdout2, stderr2] = [taskkillProcess.stdout.toString(), taskkillProcess.stderr.toString()];
          if (stdout2)
            options.log(`[pid=${spawnedProcess.pid}] taskkill stdout: ${stdout2}`);
          if (stderr2)
            options.log(`[pid=${spawnedProcess.pid}] taskkill stderr: ${stderr2}`);
        } else {
          process.kill(-spawnedProcess.pid, "SIGKILL");
        }
      } catch (e) {
        options.log(`[pid=${spawnedProcess.pid}] exception while trying to kill process: ${e}`);
      }
    } else {
      options.log(`[pid=${spawnedProcess.pid}] <skipped force kill spawnedProcess.killed=${spawnedProcess.killed} processClosed=${processClosed}>`);
    }
  }
  function killProcessAndCleanup() {
    killProcess();
    options.log(`[pid=${spawnedProcess.pid || "N/A"}] starting temporary directories cleanup`);
    for (const dir of options.tempDirectories) {
      try {
        fs.default.rmSync(dir, { force: true, recursive: true, maxRetries: 5 });
      } catch (e) {
        options.log(`[pid=${spawnedProcess.pid || "N/A"}] exception while removing ${dir}: ${e}`);
      }
    }
    options.log(`[pid=${spawnedProcess.pid || "N/A"}] finished temporary directories cleanup`);
  }
  function killAndWait() {
    killProcess();
    return waitForCleanup;
  }
  return { launchedProcess: spawnedProcess, gracefullyClose, kill: killAndWait };
}
function envArrayToObject(env) {
  const result = {};
  for (const { name, value } of env)
    result[name] = value;
  return result;
}

exports.envArrayToObject = envArrayToObject;
exports.gracefullyCloseAll = gracefullyCloseAll;
exports.gracefullyCloseSet = gracefullyCloseSet;
exports.gracefullyProcessExitDoNotHang = gracefullyProcessExitDoNotHang;
exports.launchProcess = launchProcess;
