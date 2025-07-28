'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const browserContext = require('./browserContext.js');
const channelOwner = require('./channelOwner.js');
const clientHelper = require('./clientHelper.js');
const consoleMessage = require('./consoleMessage.js');
const errors = require('./errors.js');
const events = require('./events.js');
const jsHandle = require('./jsHandle.js');
const waiter = require('./waiter.js');
const timeoutSettings = require('./timeoutSettings.js');

class Electron extends channelOwner.ChannelOwner {
  static from(electron) {
    return electron._object;
  }
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
  }
  async launch(options = {}) {
    options = this._playwright.selectors._withSelectorOptions(options);
    const params = {
      ...await browserContext.prepareBrowserContextParams(this._platform, options),
      env: clientHelper.envObjectToArray(options.env ? options.env : this._platform.env),
      tracesDir: options.tracesDir,
      timeout: new timeoutSettings.TimeoutSettings(this._platform).launchTimeout(options)
    };
    const app = ElectronApplication.from((await this._channel.launch(params)).electronApplication);
    this._playwright.selectors._contextsForSelectors.add(app._context);
    app.once(events.Events.ElectronApplication.Close, () => this._playwright.selectors._contextsForSelectors.delete(app._context));
    await app._context._initializeHarFromOptions(options.recordHar);
    app._context.tracing._tracesDir = options.tracesDir;
    return app;
  }
}
class ElectronApplication extends channelOwner.ChannelOwner {
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    this._windows = /* @__PURE__ */ new Set();
    this._timeoutSettings = new timeoutSettings.TimeoutSettings(this._platform);
    this._context = browserContext.BrowserContext.from(initializer.context);
    for (const page of this._context._pages)
      this._onPage(page);
    this._context.on(events.Events.BrowserContext.Page, (page) => this._onPage(page));
    this._channel.on("close", () => {
      this.emit(events.Events.ElectronApplication.Close);
    });
    this._channel.on("console", (event) => this.emit(events.Events.ElectronApplication.Console, new consoleMessage.ConsoleMessage(this._platform, event)));
    this._setEventToSubscriptionMapping(/* @__PURE__ */ new Map([
      [events.Events.ElectronApplication.Console, "console"]
    ]));
  }
  static from(electronApplication) {
    return electronApplication._object;
  }
  process() {
    return this._toImpl().process();
  }
  _onPage(page) {
    this._windows.add(page);
    this.emit(events.Events.ElectronApplication.Window, page);
    page.once(events.Events.Page.Close, () => this._windows.delete(page));
  }
  windows() {
    return [...this._windows];
  }
  async firstWindow(options) {
    if (this._windows.size)
      return this._windows.values().next().value;
    return await this.waitForEvent("window", options);
  }
  context() {
    return this._context;
  }
  async [Symbol.asyncDispose]() {
    await this.close();
  }
  async close() {
    try {
      await this._context.close();
    } catch (e) {
      if (errors.isTargetClosedError(e))
        return;
      throw e;
    }
  }
  async waitForEvent(event, optionsOrPredicate = {}) {
    return await this._wrapApiCall(async () => {
      const timeout = this._timeoutSettings.timeout(typeof optionsOrPredicate === "function" ? {} : optionsOrPredicate);
      const predicate = typeof optionsOrPredicate === "function" ? optionsOrPredicate : optionsOrPredicate.predicate;
      const waiter$1 = waiter.Waiter.createForEvent(this, event);
      waiter$1.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded while waiting for event "${event}"`);
      if (event !== events.Events.ElectronApplication.Close)
        waiter$1.rejectOnEvent(this, events.Events.ElectronApplication.Close, () => new errors.TargetClosedError());
      const result = await waiter$1.waitForEvent(this, event, predicate);
      waiter$1.dispose();
      return result;
    });
  }
  async browserWindow(page) {
    const result = await this._channel.browserWindow({ page: page._channel });
    return jsHandle.JSHandle.from(result.handle);
  }
  async evaluate(pageFunction, arg) {
    const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.parseResult(result.value);
  }
  async evaluateHandle(pageFunction, arg) {
    const result = await this._channel.evaluateExpressionHandle({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.JSHandle.from(result.handle);
  }
}

exports.Electron = Electron;
exports.ElectronApplication = ElectronApplication;
