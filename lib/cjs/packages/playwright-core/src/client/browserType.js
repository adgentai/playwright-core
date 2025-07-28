'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const browser = require('./browser.js');
const browserContext = require('./browserContext.js');
const channelOwner = require('./channelOwner.js');
const clientHelper = require('./clientHelper.js');
const events = require('./events.js');
const assert = require('../utils/isomorphic/assert.js');
const headers = require('../utils/isomorphic/headers.js');
const time = require('../utils/isomorphic/time.js');
const timeoutRunner = require('../utils/isomorphic/timeoutRunner.js');
const webSocket = require('./webSocket.js');
const timeoutSettings = require('./timeoutSettings.js');

class BrowserType extends channelOwner.ChannelOwner {
  constructor() {
    super(...arguments);
    this._contexts = /* @__PURE__ */ new Set();
  }
  static from(browserType) {
    return browserType._object;
  }
  executablePath() {
    if (!this._initializer.executablePath)
      throw new Error("Browser is not supported on current platform");
    return this._initializer.executablePath;
  }
  name() {
    return this._initializer.name;
  }
  async launch(options = {}) {
    assert.assert(!options.userDataDir, "userDataDir option is not supported in `browserType.launch`. Use `browserType.launchPersistentContext` instead");
    assert.assert(!options.port, "Cannot specify a port without launching as a server.");
    const logger = options.logger || this._playwright._defaultLaunchOptions?.logger;
    options = { ...this._playwright._defaultLaunchOptions, ...options };
    const launchOptions = {
      ...options,
      ignoreDefaultArgs: Array.isArray(options.ignoreDefaultArgs) ? options.ignoreDefaultArgs : void 0,
      ignoreAllDefaultArgs: !!options.ignoreDefaultArgs && !Array.isArray(options.ignoreDefaultArgs),
      env: options.env ? clientHelper.envObjectToArray(options.env) : void 0,
      timeout: new timeoutSettings.TimeoutSettings(this._platform).launchTimeout(options)
    };
    return await this._wrapApiCall(async () => {
      const browser$1 = browser.Browser.from((await this._channel.launch(launchOptions)).browser);
      browser$1._connectToBrowserType(this, options, logger);
      return browser$1;
    });
  }
  async launchServer(options = {}) {
    if (!this._serverLauncher)
      throw new Error("Launching server is not supported");
    options = { ...this._playwright._defaultLaunchOptions, ...options };
    return await this._serverLauncher.launchServer(options);
  }
  async launchPersistentContext(userDataDir, options = {}) {
    const logger = options.logger || this._playwright._defaultLaunchOptions?.logger;
    assert.assert(!options.port, "Cannot specify a port without launching as a server.");
    options = this._playwright.selectors._withSelectorOptions({
      ...this._playwright._defaultLaunchOptions,
      ...this._playwright._defaultContextOptions,
      ...options
    });
    const contextParams = await browserContext.prepareBrowserContextParams(this._platform, options);
    const persistentParams = {
      ...contextParams,
      ignoreDefaultArgs: Array.isArray(options.ignoreDefaultArgs) ? options.ignoreDefaultArgs : void 0,
      ignoreAllDefaultArgs: !!options.ignoreDefaultArgs && !Array.isArray(options.ignoreDefaultArgs),
      env: options.env ? clientHelper.envObjectToArray(options.env) : void 0,
      channel: options.channel,
      userDataDir: this._platform.path().isAbsolute(userDataDir) || !userDataDir ? userDataDir : this._platform.path().resolve(userDataDir),
      timeout: new timeoutSettings.TimeoutSettings(this._platform).launchTimeout(options)
    };
    return await this._wrapApiCall(async () => {
      const result = await this._channel.launchPersistentContext(persistentParams);
      const browser$1 = browser.Browser.from(result.browser);
      browser$1._connectToBrowserType(this, options, logger);
      const context = browserContext.BrowserContext.from(result.context);
      await context._initializeHarFromOptions(options.recordHar);
      await this._instrumentation.runAfterCreateBrowserContext(context);
      return context;
    });
  }
  async connect(optionsOrWsEndpoint, options) {
    if (typeof optionsOrWsEndpoint === "string")
      return await this._connect({ ...options, wsEndpoint: optionsOrWsEndpoint });
    assert.assert(optionsOrWsEndpoint.wsEndpoint, "options.wsEndpoint is required");
    return await this._connect(optionsOrWsEndpoint);
  }
  async _connect(params) {
    const logger = params.logger;
    return await this._wrapApiCall(async () => {
      const deadline = params.timeout ? time.monotonicTime() + params.timeout : 0;
      const headers = { "x-playwright-browser": this.name(), ...params.headers };
      const connectParams = {
        wsEndpoint: params.wsEndpoint,
        headers,
        exposeNetwork: params.exposeNetwork ?? params._exposeNetwork,
        slowMo: params.slowMo,
        timeout: params.timeout || 0
      };
      if (params.__testHookRedirectPortForwarding)
        connectParams.socksProxyRedirectPortForTest = params.__testHookRedirectPortForwarding;
      const connection = await webSocket.connectOverWebSocket(this._connection, connectParams);
      let browser$1;
      connection.on("close", () => {
        for (const context of browser$1?.contexts() || []) {
          for (const page of context.pages())
            page._onClose();
          context._onClose();
        }
        setTimeout(() => browser$1?._didClose(), 0);
      });
      const result = await timeoutRunner.raceAgainstDeadline(async () => {
        if (params.__testHookBeforeCreateBrowser)
          await params.__testHookBeforeCreateBrowser();
        const playwright = await connection.initializePlaywright();
        if (!playwright._initializer.preLaunchedBrowser) {
          connection.close();
          throw new Error("Malformed endpoint. Did you use BrowserType.launchServer method?");
        }
        playwright.selectors = this._playwright.selectors;
        browser$1 = browser.Browser.from(playwright._initializer.preLaunchedBrowser);
        browser$1._connectToBrowserType(this, {}, logger);
        browser$1._shouldCloseConnectionOnClose = true;
        browser$1.on(events.Events.Browser.Disconnected, () => connection.close());
        return browser$1;
      }, deadline);
      if (!result.timedOut) {
        return result.result;
      } else {
        connection.close();
        throw new Error(`Timeout ${params.timeout}ms exceeded`);
      }
    });
  }
  async connectOverCDP(endpointURLOrOptions, options) {
    if (typeof endpointURLOrOptions === "string")
      return await this._connectOverCDP(endpointURLOrOptions, options);
    const endpointURL = "endpointURL" in endpointURLOrOptions ? endpointURLOrOptions.endpointURL : endpointURLOrOptions.wsEndpoint;
    assert.assert(endpointURL, "Cannot connect over CDP without wsEndpoint.");
    return await this.connectOverCDP(endpointURL, endpointURLOrOptions);
  }
  async _connectOverCDP(endpointURL, params = {}) {
    if (this.name() !== "chromium")
      throw new Error("Connecting over CDP is only supported in Chromium.");
    const headers$1 = params.headers ? headers.headersObjectToArray(params.headers) : void 0;
    const result = await this._channel.connectOverCDP({
      endpointURL,
      headers: headers$1,
      slowMo: params.slowMo,
      timeout: new timeoutSettings.TimeoutSettings(this._platform).timeout(params)
    });
    const browser$1 = browser.Browser.from(result.browser);
    browser$1._connectToBrowserType(this, {}, params.logger);
    if (result.defaultContext)
      await this._instrumentation.runAfterCreateBrowserContext(browserContext.BrowserContext.from(result.defaultContext));
    return browser$1;
  }
}

exports.BrowserType = BrowserType;
