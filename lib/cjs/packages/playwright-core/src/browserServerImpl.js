'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const playwrightServer = require('./remote/playwrightServer.js');
const helper = require('./server/helper.js');
const instrumentation = require('./server/instrumentation.js');
const playwright = require('./server/playwright.js');
const crypto = require('./server/utils/crypto.js');
const debug = require('./server/utils/debug.js');
const stackTrace = require('./utils/isomorphic/stackTrace.js');
const time = require('./utils/isomorphic/time.js');
const utilsBundle = require('./utilsBundle.js');
const validatorPrimitives = require('./protocol/validatorPrimitives.js');
const progress = require('./server/progress.js');

class BrowserServerLauncherImpl {
  constructor(browserName) {
    this._browserName = browserName;
  }
  async launchServer(options = {}) {
    const playwright$1 = playwright.createPlaywright({ sdkLanguage: "javascript", isServer: true });
    const metadata = instrumentation.serverSideCallMetadata();
    const validatorContext = {
      tChannelImpl: (names, arg, path2) => {
        throw new validatorPrimitives.ValidationError(`${path2}: channels are not expected in launchServer`);
      },
      binary: "buffer",
      isUnderTest: debug.isUnderTest
    };
    let launchOptions = {
      ...options,
      ignoreDefaultArgs: Array.isArray(options.ignoreDefaultArgs) ? options.ignoreDefaultArgs : void 0,
      ignoreAllDefaultArgs: !!options.ignoreDefaultArgs && !Array.isArray(options.ignoreDefaultArgs),
      env: options.env ? envObjectToArray(options.env) : void 0,
      timeout: options.timeout ?? time.DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT
    };
    let browser;
    try {
      const controller = new progress.ProgressController(metadata, playwright$1[this._browserName]);
      browser = await controller.run(async (progress) => {
        if (options._userDataDir !== void 0) {
          const validator = validatorPrimitives.scheme["BrowserTypeLaunchPersistentContextParams"];
          launchOptions = validator({ ...launchOptions, userDataDir: options._userDataDir }, "", validatorContext);
          const context = await playwright$1[this._browserName].launchPersistentContext(progress, options._userDataDir, launchOptions);
          return context._browser;
        } else {
          const validator = validatorPrimitives.scheme["BrowserTypeLaunchParams"];
          launchOptions = validator(launchOptions, "", validatorContext);
          return await playwright$1[this._browserName].launch(progress, launchOptions, toProtocolLogger(options.logger));
        }
      });
    } catch (e) {
      const log = helper.helper.formatBrowserLogs(metadata.log);
      stackTrace.rewriteErrorMessage(e, `${e.message} Failed to launch browser.${log}`);
      throw e;
    }
    const path = options.wsPath ? options.wsPath.startsWith("/") ? options.wsPath : `/${options.wsPath}` : `/${crypto.createGuid()}`;
    const server = new playwrightServer.PlaywrightServer({ mode: options._sharedBrowser ? "launchServerShared" : "launchServer", path, maxConnections: Infinity, preLaunchedBrowser: browser });
    const wsEndpoint = await server.listen(options.port, options.host);
    const browserServer = new utilsBundle.ws.EventEmitter();
    browserServer.process = () => browser.options.browserProcess.process;
    browserServer.wsEndpoint = () => wsEndpoint;
    browserServer.close = () => browser.options.browserProcess.close();
    browserServer[Symbol.asyncDispose] = browserServer.close;
    browserServer.kill = () => browser.options.browserProcess.kill();
    browserServer._disconnectForTest = () => server.close();
    browserServer._userDataDirForTest = browser._userDataDirForTest;
    browser.options.browserProcess.onclose = (exitCode, signal) => {
      server.close();
      browserServer.emit("close", exitCode, signal);
    };
    return browserServer;
  }
}
function toProtocolLogger(logger) {
  return logger ? (direction, message) => {
    if (logger.isEnabled("protocol", "verbose"))
      logger.log("protocol", "verbose", (direction === "send" ? "SEND ► " : "◀ RECV ") + JSON.stringify(message), [], {});
  } : void 0;
}
function envObjectToArray(env) {
  const result = [];
  for (const name in env) {
    if (!Object.is(env[name], void 0))
      result.push({ name, value: String(env[name]) });
  }
  return result;
}

exports.BrowserServerLauncherImpl = BrowserServerLauncherImpl;
