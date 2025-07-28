'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const _commonjsDynamicModules = require('../../../../_virtual/_commonjs-dynamic-modules.js');
const time = require('../../../playwright-core/src/utils/isomorphic/time.js');
require('../../../../_virtual/pixelmatch.js');
require('../../../playwright-core/src/utilsBundle.js');
require('node:crypto');
require('../../../playwright-core/src/server/utils/debug.js');
require('../../../playwright-core/src/server/utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../../../playwright-core/src/zipBundle.js');
require('../../../playwright-core/src/server/utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../../../playwright-core/src/server/utils/happyEyeballs.js');
require('../../../playwright-core/src/server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
const profiler = require('../../../playwright-core/src/server/utils/profiler.js');
require('../../../playwright-core/src/server/utils/socksProxy.js');
require('node:os');
require('../../../playwright-core/src/server/utils/zones.js');
const util = require('../util.js');

class ProcessRunner {
  async gracefullyClose() {
  }
  dispatchEvent(method, params) {
    const response = { method, params };
    sendMessageToParent({ method: "__dispatch__", params: response });
  }
}
let gracefullyCloseCalled = false;
let forceExitInitiated = false;
sendMessageToParent({ method: "ready" });
process.on("disconnect", () => gracefullyCloseAndExit(true));
process.on("SIGINT", () => {
});
process.on("SIGTERM", () => {
});
let processRunner;
let processName;
const startingEnv = { ...process.env };
process.on("message", async (message) => {
  if (message.method === "__init__") {
    const { processParams, runnerParams, runnerScript } = message.params;
    void profiler.startProfiling();
    time.setTimeOrigin(processParams.timeOrigin);
    const { create } = _commonjsDynamicModules.commonjsRequire(runnerScript);
    processRunner = create(runnerParams);
    processName = processParams.processName;
    return;
  }
  if (message.method === "__stop__") {
    const keys = /* @__PURE__ */ new Set([...Object.keys(process.env), ...Object.keys(startingEnv)]);
    const producedEnv = [...keys].filter((key) => startingEnv[key] !== process.env[key]).map((key) => [key, process.env[key] ?? null]);
    sendMessageToParent({ method: "__env_produced__", params: producedEnv });
    await gracefullyCloseAndExit(false);
    return;
  }
  if (message.method === "__dispatch__") {
    const { id, method, params } = message.params;
    try {
      const result = await processRunner[method](params);
      const response = { id, result };
      sendMessageToParent({ method: "__dispatch__", params: response });
    } catch (e) {
      const response = { id, error: util.serializeError(e) };
      sendMessageToParent({ method: "__dispatch__", params: response });
    }
  }
});
const kForceExitTimeout = +(process.env.PWTEST_FORCE_EXIT_TIMEOUT || 3e4);
async function gracefullyCloseAndExit(forceExit) {
  if (forceExit && !forceExitInitiated) {
    forceExitInitiated = true;
    setTimeout(() => process.exit(0), kForceExitTimeout);
  }
  if (!gracefullyCloseCalled) {
    gracefullyCloseCalled = true;
    await processRunner?.gracefullyClose().catch(() => {
    });
    if (processName)
      await profiler.stopProfiling(processName).catch(() => {
      });
    process.exit(0);
  }
}
function sendMessageToParent(message) {
  try {
    process.send(message);
  } catch (e) {
    try {
      JSON.stringify(message);
    } catch {
      throw e;
    }
  }
}

exports.ProcessRunner = ProcessRunner;
