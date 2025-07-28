'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const empty = require('../../../../../_virtual/empty.js');
const fs = require('../../../../../bundles/fs.js');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');
const manualPromise = require('../../utils/isomorphic/manualPromise.js');
const ascii = require('../utils/ascii.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
const debugLogger = require('../utils/debugLogger.js');
const eventsHelper = require('../utils/eventsHelper.js');
const fileUtils = require('../utils/fileUtils.js');
require('../utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../utils/happyEyeballs.js');
require('../utils/nodePlatform.js');
const processLauncher = require('../utils/processLauncher.js');
require('../utils/profiler.js');
require('../utils/socksProxy.js');
require('node:child_process');
require('../../zipBundle.js');
require('../utils/zones.js');
const browserContext = require('../browserContext.js');
const crBrowser = require('../chromium/crBrowser.js');
const crConnection = require('../chromium/crConnection.js');
const crExecutionContext = require('../chromium/crExecutionContext.js');
const crProtocolHelper = require('../chromium/crProtocolHelper.js');
const console = require('../console.js');
const helper = require('../helper.js');
const instrumentation = require('../instrumentation.js');
const javascript = require('../javascript.js');
const webSocketTransport = require('../../../../../cloudflare/webSocketTransport.js');

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

const readline__namespace = /*#__PURE__*/_interopNamespaceDefault(readline);

const ARTIFACTS_FOLDER = path.join(os.tmpdir(), "playwright-artifacts-");
class ElectronApplication extends instrumentation.SdkObject {
  constructor(parent, browser, nodeConnection, process2) {
    super(parent, "electron-app");
    this._nodeElectronHandlePromise = new manualPromise.ManualPromise();
    this._process = process2;
    this._browserContext = browser._defaultContext;
    this._nodeConnection = nodeConnection;
    this._nodeSession = nodeConnection.rootSession;
    this._nodeSession.on("Runtime.executionContextCreated", async (event) => {
      if (!event.context.auxData || !event.context.auxData.isDefault)
        return;
      const crExecutionContext$1 = new crExecutionContext.CRExecutionContext(this._nodeSession, event.context);
      this._nodeExecutionContext = new javascript.ExecutionContext(this, crExecutionContext$1, "electron");
      const { result: remoteObject } = await crExecutionContext$1._client.send("Runtime.evaluate", {
        expression: `require('electron')`,
        contextId: event.context.id,
        // Needed after Electron 28 to get access to require: https://github.com/microsoft/playwright/issues/28048
        includeCommandLineAPI: true
      });
      this._nodeElectronHandlePromise.resolve(new javascript.JSHandle(this._nodeExecutionContext, "object", "ElectronModule", remoteObject.objectId));
    });
    this._nodeSession.on("Runtime.consoleAPICalled", (event) => this._onConsoleAPI(event));
    const appClosePromise = new Promise((f) => this.once(ElectronApplication.Events.Close, f));
    this._browserContext.setCustomCloseHandler(async () => {
      await this._browserContext.stopVideoRecording();
      const electronHandle = await this._nodeElectronHandlePromise;
      await electronHandle.evaluate(({ app }) => app.quit()).catch(() => {
      });
      this._nodeConnection.close();
      await appClosePromise;
    });
  }
  static {
    this.Events = {
      Close: "close",
      Console: "console"
    };
  }
  async _onConsoleAPI(event) {
    if (event.executionContextId === 0) {
      return;
    }
    if (!this._nodeExecutionContext)
      return;
    const args = event.args.map((arg) => crExecutionContext.createHandle(this._nodeExecutionContext, arg));
    const message = new console.ConsoleMessage(null, event.type, void 0, args, crProtocolHelper.toConsoleMessageLocation(event.stackTrace));
    this.emit(ElectronApplication.Events.Console, message);
  }
  async initialize() {
    await this._nodeSession.send("Runtime.enable", {});
    await this._nodeSession.send("Runtime.evaluate", { expression: "__playwright_run()" });
  }
  process() {
    return this._process;
  }
  context() {
    return this._browserContext;
  }
  async close() {
    await this._browserContext.close({ reason: "Application exited" });
  }
  async browserWindow(page) {
    const targetId = page.delegate._targetId;
    const electronHandle = await this._nodeElectronHandlePromise;
    return await electronHandle.evaluateHandle(({ BrowserWindow, webContents }, targetId2) => {
      const wc = webContents.fromDevToolsTargetId(targetId2);
      return BrowserWindow.fromWebContents(wc);
    }, targetId);
  }
}
class Electron extends instrumentation.SdkObject {
  constructor(playwright) {
    super(playwright, "electron");
    this.logName = "browser";
  }
  async launch(progress, options) {
    let app = void 0;
    let electronArguments = ["--inspect=0", "--remote-debugging-port=0", ...options.args || []];
    if (os.platform() === "linux") {
      const runningAsRoot = process.geteuid && process.geteuid() === 0;
      if (runningAsRoot && electronArguments.indexOf("--no-sandbox") === -1)
        electronArguments.unshift("--no-sandbox");
    }
    const artifactsDir = await progress.race(fs.default.promises.mkdtemp(ARTIFACTS_FOLDER));
    progress.cleanupWhenAborted(() => fileUtils.removeFolders([artifactsDir]));
    const browserLogsCollector = new debugLogger.RecentLogsCollector();
    const env = options.env ? processLauncher.envArrayToObject(options.env) : process.env;
    let command;
    if (options.executablePath) {
      command = options.executablePath;
    } else {
      try {
        command = empty.default;
      } catch (error) {
        if (error?.code === "MODULE_NOT_FOUND") {
          throw new Error("\n" + ascii.wrapInASCIIBox([
            "Electron executablePath not found!",
            "Please install it using `npm install -D electron` or set the executablePath to your Electron executable."
          ].join("\n"), 1));
        }
        throw error;
      }
      electronArguments.unshift("-r", require.resolve("./loader"));
    }
    let shell = false;
    if (process.platform === "win32") {
      shell = true;
      command = `"${command}"`;
      electronArguments = electronArguments.map((arg) => `"${arg}"`);
    }
    delete env.NODE_OPTIONS;
    const { launchedProcess, gracefullyClose, kill } = await processLauncher.launchProcess({
      command,
      args: electronArguments,
      env,
      log: (message) => {
        progress.log(message);
        browserLogsCollector.log(message);
      },
      shell,
      stdio: "pipe",
      cwd: options.cwd,
      tempDirectories: [artifactsDir],
      attemptToGracefullyClose: () => app.close(),
      handleSIGINT: true,
      handleSIGTERM: true,
      handleSIGHUP: true,
      onExit: () => app?.emit(ElectronApplication.Events.Close)
    });
    const waitForXserverError = waitForLine(progress, launchedProcess, /Unable to open X display/).then(() => {
      throw new Error([
        "Unable to open X display!",
        `================================`,
        "Most likely this is because there is no X server available.",
        "Use 'xvfb-run' on Linux to launch your tests with an emulated display server.",
        "For example: 'xvfb-run npm run test:e2e'",
        `================================`,
        progress.metadata.log
      ].join("\n"));
    });
    const nodeMatchPromise = waitForLine(progress, launchedProcess, /^Debugger listening on (ws:\/\/.*)$/);
    const chromeMatchPromise = waitForLine(progress, launchedProcess, /^DevTools listening on (ws:\/\/.*)$/);
    const debuggerDisconnectPromise = waitForLine(progress, launchedProcess, /Waiting for the debugger to disconnect\.\.\./);
    const nodeMatch = await nodeMatchPromise;
    const nodeTransport = await webSocketTransport.WebSocketTransport.connect(progress, nodeMatch[1]);
    progress.cleanupWhenAborted(() => nodeTransport.close());
    const nodeConnection = new crConnection.CRConnection(this, nodeTransport, helper.helper.debugProtocolLogger(), browserLogsCollector);
    debuggerDisconnectPromise.then(() => {
      nodeTransport.close();
    }).catch(() => {
    });
    const chromeMatch = await Promise.race([
      chromeMatchPromise,
      waitForXserverError
    ]);
    const chromeTransport = await webSocketTransport.WebSocketTransport.connect(progress, chromeMatch[1]);
    progress.cleanupWhenAborted(() => chromeTransport.close());
    const browserProcess = {
      onclose: void 0,
      process: launchedProcess,
      close: gracefullyClose,
      kill
    };
    const contextOptions = {
      ...options,
      noDefaultViewport: true
    };
    const browserOptions = {
      name: "electron",
      isChromium: true,
      headful: true,
      persistent: contextOptions,
      browserProcess,
      protocolLogger: helper.helper.debugProtocolLogger(),
      browserLogsCollector,
      artifactsDir,
      downloadsPath: artifactsDir,
      tracesDir: options.tracesDir || artifactsDir,
      originalLaunchOptions: {}
    };
    browserContext.validateBrowserContextOptions(contextOptions, browserOptions);
    const browser = await progress.race(crBrowser.CRBrowser.connect(this.attribution.playwright, chromeTransport, browserOptions));
    app = new ElectronApplication(this, browser, nodeConnection, launchedProcess);
    await progress.race(app.initialize());
    return app;
  }
}
function waitForLine(progress, process2, regex) {
  return progress.race(new Promise((resolve, reject) => {
    const rl = readline__namespace.createInterface({ input: process2.stderr });
    const failError = new Error("Process failed to launch!");
    const listeners = [
      eventsHelper.eventsHelper.addEventListener(rl, "line", onLine),
      eventsHelper.eventsHelper.addEventListener(rl, "close", reject.bind(null, failError)),
      eventsHelper.eventsHelper.addEventListener(process2, "exit", reject.bind(null, failError)),
      // It is Ok to remove error handler because we did not create process and there is another listener.
      eventsHelper.eventsHelper.addEventListener(process2, "error", reject.bind(null, failError))
    ];
    progress.cleanupWhenAborted(cleanup);
    function onLine(line) {
      const match = line.match(regex);
      if (!match)
        return;
      cleanup();
      resolve(match);
    }
    function cleanup() {
      eventsHelper.eventsHelper.removeEventListeners(listeners);
    }
  }));
}

exports.Electron = Electron;
exports.ElectronApplication = ElectronApplication;
