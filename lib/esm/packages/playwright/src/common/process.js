import { commonjsRequire } from '../../../../_virtual/_commonjs-dynamic-modules.js';
import { setTimeOrigin } from '../../../playwright-core/src/utils/isomorphic/time.js';
import '../../../../_virtual/pixelmatch.js';
import '../../../playwright-core/src/utilsBundle.js';
import 'node:crypto';
import '../../../playwright-core/src/server/utils/debug.js';
import '../../../playwright-core/src/server/utils/debugLogger.js';
import '../../../../bundles/fs.js';
import 'node:path';
import '../../../playwright-core/src/zipBundle.js';
import '../../../playwright-core/src/server/utils/hostPlatform.js';
import 'node:http';
import 'node:http2';
import 'node:https';
import 'node:url';
import '../../../playwright-core/src/server/utils/happyEyeballs.js';
import '../../../playwright-core/src/server/utils/nodePlatform.js';
import 'node:child_process';
import 'node:readline';
import { startProfiling, stopProfiling } from '../../../playwright-core/src/server/utils/profiler.js';
import '../../../playwright-core/src/server/utils/socksProxy.js';
import 'node:os';
import '../../../playwright-core/src/server/utils/zones.js';
import { serializeError } from '../util.js';

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
    void startProfiling();
    setTimeOrigin(processParams.timeOrigin);
    const { create } = commonjsRequire(runnerScript);
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
      const response = { id, error: serializeError(e) };
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
      await stopProfiling(processName).catch(() => {
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

export { ProcessRunner };
