'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const artifact = require('./artifact.js');
const browserContext = require('./browserContext.js');
const cdpSession = require('./cdpSession.js');
const channelOwner = require('./channelOwner.js');
const errors = require('./errors.js');
const events = require('./events.js');
const fileUtils = require('./fileUtils.js');

class Browser extends channelOwner.ChannelOwner {
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    this._contexts = /* @__PURE__ */ new Set();
    this._isConnected = true;
    this._shouldCloseConnectionOnClose = false;
    this._options = {};
    this._name = initializer.name;
    this._channel.on("context", ({ context }) => this._didCreateContext(browserContext.BrowserContext.from(context)));
    this._channel.on("close", () => this._didClose());
    this._closedPromise = new Promise((f) => this.once(events.Events.Browser.Disconnected, f));
  }
  static from(browser) {
    return browser._object;
  }
  browserType() {
    return this._browserType;
  }
  async newContext(options = {}) {
    if (!options.userAgent) {
      options.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
    }
    return await this._innerNewContext(options, false);
  }
  async _newContextForReuse(options = {}) {
    return await this._wrapApiCall(() => this._innerNewContext(options, true), { internal: true });
  }
  async _disconnectFromReusedContext(reason) {
    return await this._wrapApiCall(async () => {
      const context = [...this._contexts].find((context2) => context2._forReuse);
      if (!context)
        return;
      await this._instrumentation.runBeforeCloseBrowserContext(context);
      for (const page of context.pages())
        page._onClose();
      context._onClose();
      await this._channel.disconnectFromReusedContext({ reason });
    }, { internal: true });
  }
  async _innerNewContext(options = {}, forReuse) {
    options = this._browserType._playwright.selectors._withSelectorOptions({
      ...this._browserType._playwright._defaultContextOptions,
      ...options
    });
    const contextOptions = await browserContext.prepareBrowserContextParams(this._platform, options);
    const response = forReuse ? await this._channel.newContextForReuse(contextOptions) : await this._channel.newContext(contextOptions);
    const context = browserContext.BrowserContext.from(response.context);
    if (forReuse)
      context._forReuse = true;
    if (options.logger)
      context._logger = options.logger;
    await context._initializeHarFromOptions(options.recordHar);
    await this._instrumentation.runAfterCreateBrowserContext(context);
    return context;
  }
  _connectToBrowserType(browserType, browserOptions, logger) {
    this._browserType = browserType;
    this._options = browserOptions;
    this._logger = logger;
    for (const context of this._contexts)
      this._setupBrowserContext(context);
  }
  _didCreateContext(context) {
    context._browser = this;
    this._contexts.add(context);
    if (this._browserType)
      this._setupBrowserContext(context);
  }
  _setupBrowserContext(context) {
    context._logger = this._logger;
    context.tracing._tracesDir = this._options.tracesDir;
    this._browserType._contexts.add(context);
    this._browserType._playwright.selectors._contextsForSelectors.add(context);
    context.setDefaultTimeout(this._browserType._playwright._defaultContextTimeout);
    context.setDefaultNavigationTimeout(this._browserType._playwright._defaultContextNavigationTimeout);
  }
  contexts() {
    return [...this._contexts];
  }
  version() {
    return this._initializer.version;
  }
  async newPage(options = {}) {
    return await this._wrapApiCall(async () => {
      const context = await this.newContext(options);
      const page = await context.newPage();
      page._ownedContext = context;
      context._ownerPage = page;
      return page;
    }, { title: "Create page" });
  }
  isConnected() {
    return this._isConnected;
  }
  async newBrowserCDPSession() {
    return cdpSession.CDPSession.from((await this._channel.newBrowserCDPSession()).session);
  }
  async startTracing(page, options = {}) {
    this._path = options.path;
    await this._channel.startTracing({ ...options, page: page ? page._channel : void 0 });
  }
  async stopTracing() {
    const artifact$1 = artifact.Artifact.from((await this._channel.stopTracing()).artifact);
    const buffer = await artifact$1.readIntoBuffer();
    await artifact$1.delete();
    if (this._path) {
      await fileUtils.mkdirIfNeeded(this._platform, this._path);
      await this._platform.fs().promises.writeFile(this._path, buffer);
      this._path = void 0;
    }
    return buffer;
  }
  async [Symbol.asyncDispose]() {
    await this.close();
  }
  async close(options = {}) {
    this._closeReason = options.reason;
    try {
      if (this._shouldCloseConnectionOnClose)
        this._connection.close();
      else
        await this._channel.close(options);
      await this._closedPromise;
    } catch (e) {
      if (errors.isTargetClosedError(e))
        return;
      throw e;
    }
  }
  _didClose() {
    this._isConnected = false;
    this.emit(events.Events.Browser.Disconnected, this);
  }
}

exports.Browser = Browser;
