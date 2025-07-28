'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const playwrightConnection = require('./playwrightConnection.js');
const playwright = require('../server/playwright.js');
const semaphore = require('../utils/isomorphic/semaphore.js');
const time = require('../utils/isomorphic/time.js');
const wsServer = require('../server/utils/wsServer.js');
const ascii = require('../server/utils/ascii.js');
const userAgent = require('../server/utils/userAgent.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
const debug = require('../server/utils/debug.js');
const debugLogger = require('../server/utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../zipBundle.js');
require('../server/utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../server/utils/happyEyeballs.js');
require('../server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('../server/utils/profiler.js');
const socksProxy = require('../server/utils/socksProxy.js');
require('../server/utils/zones.js');
require('../server/registry/index.js');
require('node:events');
require('../protocol/validator.js');
require('../protocol/serializers.js');
const instrumentation = require('../server/instrumentation.js');
const progress = require('../server/progress.js');
require('../server/fetch.js');
require('../server/browserContext.js');
require('../server/chromium/crConnection.js');
require('../server/page.js');
require('../server/frames.js');
require('../server/network.js');
require('../server/dispatchers/webSocketRouteDispatcher.js');
require('../server/chromium/crBrowser.js');
require('../server/debugger.js');
require('../server/android/android.js');
const browser = require('../server/browser.js');
require('../server/electron/electron.js');
require('node:os');
require('../../../../cloudflare/webSocketTransport.js');

class PlaywrightServer {
  constructor(options) {
    this._dontReuseBrowsers = /* @__PURE__ */ new Set();
    this._options = options;
    if (options.preLaunchedBrowser) {
      this._playwright = options.preLaunchedBrowser.attribution.playwright;
      this._dontReuse(options.preLaunchedBrowser);
    }
    if (options.preLaunchedAndroidDevice)
      this._playwright = options.preLaunchedAndroidDevice._android.attribution.playwright;
    this._playwright ??= playwright.createPlaywright({ sdkLanguage: "javascript", isServer: true });
    const browserSemaphore = new semaphore.Semaphore(this._options.maxConnections);
    const controllerSemaphore = new semaphore.Semaphore(1);
    const reuseBrowserSemaphore = new semaphore.Semaphore(1);
    this._wsServer = new wsServer.WSServer({
      onRequest: (request, response) => {
        if (request.method === "GET" && request.url === "/json") {
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({
            wsEndpointPath: this._options.path
          }));
          return;
        }
        response.end("Running");
      },
      onUpgrade: (request, socket) => {
        const uaError = userAgentVersionMatchesErrorMessage(request.headers["user-agent"] || "");
        if (uaError)
          return { error: `HTTP/${request.httpVersion} 428 Precondition Required\r
\r
${uaError}` };
      },
      onHeaders: (headers) => {
        if (process.env.PWTEST_SERVER_WS_HEADERS)
          headers.push(process.env.PWTEST_SERVER_WS_HEADERS);
      },
      onConnection: (request, url, ws, id) => {
        const browserHeader = request.headers["x-playwright-browser"];
        const browserName = url.searchParams.get("browser") || (Array.isArray(browserHeader) ? browserHeader[0] : browserHeader) || null;
        const proxyHeader = request.headers["x-playwright-proxy"];
        const proxyValue = url.searchParams.get("proxy") || (Array.isArray(proxyHeader) ? proxyHeader[0] : proxyHeader);
        const launchOptionsHeader = request.headers["x-playwright-launch-options"] || "";
        const launchOptionsHeaderValue = Array.isArray(launchOptionsHeader) ? launchOptionsHeader[0] : launchOptionsHeader;
        const launchOptionsParam = url.searchParams.get("launch-options");
        let launchOptions = { timeout: time.DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT };
        try {
          launchOptions = JSON.parse(launchOptionsParam || launchOptionsHeaderValue);
          if (!launchOptions.timeout)
            launchOptions.timeout = time.DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT;
        } catch (e) {
        }
        const isExtension = this._options.mode === "extension";
        const allowFSPaths = isExtension;
        launchOptions = filterLaunchOptions(launchOptions, allowFSPaths);
        if (process.env.PW_BROWSER_SERVER && url.searchParams.has("connect")) {
          const filter = url.searchParams.get("connect");
          if (filter !== "first")
            throw new Error(`Unknown connect filter: ${filter}`);
          return new playwrightConnection.PlaywrightConnection(
            browserSemaphore,
            ws,
            false,
            this._playwright,
            () => this._initConnectMode(id, filter, browserName, launchOptions),
            id
          );
        }
        if (isExtension) {
          if (url.searchParams.has("debug-controller")) {
            return new playwrightConnection.PlaywrightConnection(
              controllerSemaphore,
              ws,
              true,
              this._playwright,
              async () => {
                throw new Error("shouldnt be used");
              },
              id
            );
          }
          return new playwrightConnection.PlaywrightConnection(
            reuseBrowserSemaphore,
            ws,
            false,
            this._playwright,
            () => this._initReuseBrowsersMode(browserName, launchOptions, id),
            id
          );
        }
        if (this._options.mode === "launchServer" || this._options.mode === "launchServerShared") {
          if (this._options.preLaunchedBrowser) {
            return new playwrightConnection.PlaywrightConnection(
              browserSemaphore,
              ws,
              false,
              this._playwright,
              () => this._initPreLaunchedBrowserMode(id),
              id
            );
          }
          return new playwrightConnection.PlaywrightConnection(
            browserSemaphore,
            ws,
            false,
            this._playwright,
            () => this._initPreLaunchedAndroidMode(id),
            id
          );
        }
        return new playwrightConnection.PlaywrightConnection(
          browserSemaphore,
          ws,
          false,
          this._playwright,
          () => this._initLaunchBrowserMode(browserName, proxyValue, launchOptions, id),
          id
        );
      }
    });
  }
  async _initReuseBrowsersMode(browserName, launchOptions, id) {
    debugLogger.debugLogger.log("server", `[${id}] engaged reuse browsers mode for ${browserName}`);
    const requestedOptions = launchOptionsHash(launchOptions);
    let browser = this._playwright.allBrowsers().find((b) => {
      if (b.options.name !== browserName)
        return false;
      if (this._dontReuseBrowsers.has(b))
        return false;
      const existingOptions = launchOptionsHash({ ...b.options.originalLaunchOptions, timeout: time.DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT });
      return existingOptions === requestedOptions;
    });
    for (const b of this._playwright.allBrowsers()) {
      if (b === browser)
        continue;
      if (this._dontReuseBrowsers.has(b))
        continue;
      if (b.options.name === browserName && b.options.channel === launchOptions.channel)
        await b.close({ reason: "Connection terminated" });
    }
    if (!browser) {
      const browserType = this._playwright[browserName || "chromium"];
      const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), browserType);
      browser = await controller.run((progress) => browserType.launch(progress, {
        ...launchOptions,
        headless: !!process.env.PW_DEBUG_CONTROLLER_HEADLESS
      }), launchOptions.timeout);
    }
    return {
      preLaunchedBrowser: browser,
      denyLaunch: true,
      dispose: async () => {
        for (const context of browser.contexts()) {
          if (!context.pages().length)
            await context.close({ reason: "Connection terminated" });
        }
      }
    };
  }
  async _initConnectMode(id, filter, browserName, launchOptions) {
    browserName ??= "chromium";
    debugLogger.debugLogger.log("server", `[${id}] engaged connect mode`);
    let browser = this._playwright.allBrowsers().find((b) => b.options.name === browserName);
    if (!browser) {
      const browserType = this._playwright[browserName];
      const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), browserType);
      browser = await controller.run((progress) => browserType.launch(progress, launchOptions), launchOptions.timeout);
      this._dontReuse(browser);
    }
    return {
      preLaunchedBrowser: browser,
      denyLaunch: true,
      sharedBrowser: true
    };
  }
  async _initPreLaunchedBrowserMode(id) {
    debugLogger.debugLogger.log("server", `[${id}] engaged pre-launched (browser) mode`);
    const browser = this._options.preLaunchedBrowser;
    for (const b of this._playwright.allBrowsers()) {
      if (b !== browser)
        await b.close({ reason: "Connection terminated" });
    }
    return {
      preLaunchedBrowser: browser,
      socksProxy: this._options.preLaunchedSocksProxy,
      sharedBrowser: this._options.mode === "launchServerShared",
      denyLaunch: true
    };
  }
  async _initPreLaunchedAndroidMode(id) {
    debugLogger.debugLogger.log("server", `[${id}] engaged pre-launched (Android) mode`);
    const androidDevice = this._options.preLaunchedAndroidDevice;
    return {
      preLaunchedAndroidDevice: androidDevice,
      denyLaunch: true
    };
  }
  async _initLaunchBrowserMode(browserName, proxyValue, launchOptions, id) {
    debugLogger.debugLogger.log("server", `[${id}] engaged launch mode for "${browserName}"`);
    let socksProxy$1;
    if (proxyValue) {
      socksProxy$1 = new socksProxy.SocksProxy();
      socksProxy$1.setPattern(proxyValue);
      launchOptions.socksProxyPort = await socksProxy$1.listen(0);
      debugLogger.debugLogger.log("server", `[${id}] started socks proxy on port ${launchOptions.socksProxyPort}`);
    } else {
      launchOptions.socksProxyPort = void 0;
    }
    const browserType = this._playwright[browserName];
    const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), browserType);
    const browser = await controller.run((progress) => browserType.launch(progress, launchOptions), launchOptions.timeout);
    this._dontReuseBrowsers.add(browser);
    return {
      preLaunchedBrowser: browser,
      socksProxy: socksProxy$1,
      sharedBrowser: true,
      denyLaunch: true,
      dispose: async () => {
        await browser.close({ reason: "Connection terminated" });
        socksProxy$1?.close();
      }
    };
  }
  _dontReuse(browser$1) {
    this._dontReuseBrowsers.add(browser$1);
    browser$1.on(browser.Browser.Events.Disconnected, () => {
      this._dontReuseBrowsers.delete(browser$1);
    });
  }
  async listen(port = 0, hostname) {
    return this._wsServer.listen(port, hostname, this._options.path);
  }
  async close() {
    await this._wsServer.close();
  }
}
function userAgentVersionMatchesErrorMessage(userAgent$1) {
  const match = userAgent$1.match(/^Playwright\/(\d+\.\d+\.\d+)/);
  if (!match) {
    return;
  }
  const received = match[1].split(".").slice(0, 2).join(".");
  const expected = userAgent.getPlaywrightVersion(true);
  if (received !== expected) {
    return ascii.wrapInASCIIBox([
      `Playwright version mismatch:`,
      `  - server version: v${expected}`,
      `  - client version: v${received}`,
      ``,
      `If you are using VSCode extension, restart VSCode.`,
      ``,
      `If you are connecting to a remote service,`,
      `keep your local Playwright version in sync`,
      `with the remote service version.`,
      ``,
      `<3 Playwright Team`
    ].join("\n"), 1);
  }
}
function launchOptionsHash(options) {
  const copy = { ...options };
  for (const k of Object.keys(copy)) {
    const key = k;
    if (copy[key] === defaultLaunchOptions[key])
      delete copy[key];
  }
  for (const key of optionsThatAllowBrowserReuse)
    delete copy[key];
  return JSON.stringify(copy);
}
function filterLaunchOptions(options, allowFSPaths) {
  return {
    channel: options.channel,
    args: options.args,
    ignoreAllDefaultArgs: options.ignoreAllDefaultArgs,
    ignoreDefaultArgs: options.ignoreDefaultArgs,
    timeout: options.timeout,
    headless: options.headless,
    proxy: options.proxy,
    chromiumSandbox: options.chromiumSandbox,
    firefoxUserPrefs: options.firefoxUserPrefs,
    slowMo: options.slowMo,
    executablePath: debug.isUnderTest() || allowFSPaths ? options.executablePath : void 0,
    downloadsPath: allowFSPaths ? options.downloadsPath : void 0
  };
}
const defaultLaunchOptions = {
  ignoreAllDefaultArgs: false,
  handleSIGINT: false,
  handleSIGTERM: false,
  handleSIGHUP: false,
  headless: true,
  devtools: false
};
const optionsThatAllowBrowserReuse = [
  "headless",
  "timeout",
  "tracesDir"
];

exports.PlaywrightServer = PlaywrightServer;
