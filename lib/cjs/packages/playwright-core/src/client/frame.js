'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const eventEmitter = require('./eventEmitter.js');
const channelOwner = require('./channelOwner.js');
const clientHelper = require('./clientHelper.js');
const elementHandle = require('./elementHandle.js');
const events = require('./events.js');
const jsHandle = require('./jsHandle.js');
const locator = require('./locator.js');
const network = require('./network.js');
const types = require('./types.js');
const waiter = require('./waiter.js');
const assert = require('../utils/isomorphic/assert.js');
const locatorUtils = require('../utils/isomorphic/locatorUtils.js');
const urlMatch = require('../utils/isomorphic/urlMatch.js');
const timeoutSettings = require('./timeoutSettings.js');

class Frame extends channelOwner.ChannelOwner {
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    this._parentFrame = null;
    this._url = "";
    this._name = "";
    this._detached = false;
    this._childFrames = /* @__PURE__ */ new Set();
    this._eventEmitter = new eventEmitter.EventEmitter(parent._platform);
    this._eventEmitter.setMaxListeners(0);
    this._parentFrame = Frame.fromNullable(initializer.parentFrame);
    if (this._parentFrame)
      this._parentFrame._childFrames.add(this);
    this._name = initializer.name;
    this._url = initializer.url;
    this._loadStates = new Set(initializer.loadStates);
    this._channel.on("loadstate", (event) => {
      if (event.add) {
        this._loadStates.add(event.add);
        this._eventEmitter.emit("loadstate", event.add);
      }
      if (event.remove)
        this._loadStates.delete(event.remove);
      if (!this._parentFrame && event.add === "load" && this._page)
        this._page.emit(events.Events.Page.Load, this._page);
      if (!this._parentFrame && event.add === "domcontentloaded" && this._page)
        this._page.emit(events.Events.Page.DOMContentLoaded, this._page);
    });
    this._channel.on("navigated", (event) => {
      this._url = event.url;
      this._name = event.name;
      this._eventEmitter.emit("navigated", event);
      if (!event.error && this._page)
        this._page.emit(events.Events.Page.FrameNavigated, this);
    });
  }
  static from(frame) {
    return frame._object;
  }
  static fromNullable(frame) {
    return frame ? Frame.from(frame) : null;
  }
  page() {
    return this._page;
  }
  _timeout(options) {
    const timeoutSettings$1 = this._page?._timeoutSettings || new timeoutSettings.TimeoutSettings(this._platform);
    return timeoutSettings$1.timeout(options || {});
  }
  _navigationTimeout(options) {
    const timeoutSettings$1 = this._page?._timeoutSettings || new timeoutSettings.TimeoutSettings(this._platform);
    return timeoutSettings$1.navigationTimeout(options || {});
  }
  async goto(url, options = {}) {
    const waitUntil = verifyLoadState("waitUntil", options.waitUntil === void 0 ? "load" : options.waitUntil);
    return network.Response.fromNullable((await this._channel.goto({ url, ...options, waitUntil, timeout: this._navigationTimeout(options) })).response);
  }
  _setupNavigationWaiter(options) {
    const waiter$1 = new waiter.Waiter(this._page, "");
    if (this._page.isClosed())
      waiter$1.rejectImmediately(this._page._closeErrorWithReason());
    waiter$1.rejectOnEvent(this._page, events.Events.Page.Close, () => this._page._closeErrorWithReason());
    waiter$1.rejectOnEvent(this._page, events.Events.Page.Crash, new Error("Navigation failed because page crashed!"));
    waiter$1.rejectOnEvent(this._page, events.Events.Page.FrameDetached, new Error("Navigating frame was detached!"), (frame) => frame === this);
    const timeout = this._page._timeoutSettings.navigationTimeout(options);
    waiter$1.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded.`);
    return waiter$1;
  }
  async waitForNavigation(options = {}) {
    return await this._page._wrapApiCall(async () => {
      const waitUntil = verifyLoadState("waitUntil", options.waitUntil === void 0 ? "load" : options.waitUntil);
      const waiter = this._setupNavigationWaiter(options);
      const toUrl = typeof options.url === "string" ? ` to "${options.url}"` : "";
      waiter.log(`waiting for navigation${toUrl} until "${waitUntil}"`);
      const navigatedEvent = await waiter.waitForEvent(this._eventEmitter, "navigated", (event) => {
        if (event.error)
          return true;
        waiter.log(`  navigated to "${event.url}"`);
        return urlMatch.urlMatches(this._page?.context()._options.baseURL, event.url, options.url);
      });
      if (navigatedEvent.error) {
        const e = new Error(navigatedEvent.error);
        e.stack = "";
        await waiter.waitForPromise(Promise.reject(e));
      }
      if (!this._loadStates.has(waitUntil)) {
        await waiter.waitForEvent(this._eventEmitter, "loadstate", (s) => {
          waiter.log(`  "${s}" event fired`);
          return s === waitUntil;
        });
      }
      const request = navigatedEvent.newDocument ? network.Request.fromNullable(navigatedEvent.newDocument.request) : null;
      const response = request ? await waiter.waitForPromise(request._finalRequest()._internalResponse()) : null;
      waiter.dispose();
      return response;
    }, { title: "Wait for navigation" });
  }
  async waitForLoadState(state = "load", options = {}) {
    state = verifyLoadState("state", state);
    return await this._page._wrapApiCall(async () => {
      const waiter = this._setupNavigationWaiter(options);
      if (this._loadStates.has(state)) {
        waiter.log(`  not waiting, "${state}" event already fired`);
      } else {
        await waiter.waitForEvent(this._eventEmitter, "loadstate", (s) => {
          waiter.log(`  "${s}" event fired`);
          return s === state;
        });
      }
      waiter.dispose();
    }, { title: `Wait for load state "${state}"` });
  }
  async waitForURL(url, options = {}) {
    if (urlMatch.urlMatches(this._page?.context()._options.baseURL, this.url(), url))
      return await this.waitForLoadState(options.waitUntil, options);
    await this.waitForNavigation({ url, ...options });
  }
  async frameElement() {
    return elementHandle.ElementHandle.from((await this._channel.frameElement()).element);
  }
  async evaluateHandle(pageFunction, arg) {
    jsHandle.assertMaxArguments(arguments.length, 2);
    const result = await this._channel.evaluateExpressionHandle({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.JSHandle.from(result.handle);
  }
  async evaluate(pageFunction, arg) {
    jsHandle.assertMaxArguments(arguments.length, 2);
    const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.parseResult(result.value);
  }
  async _evaluateExposeUtilityScript(pageFunction, arg) {
    jsHandle.assertMaxArguments(arguments.length, 2);
    const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.parseResult(result.value);
  }
  async $(selector, options) {
    const result = await this._channel.querySelector({ selector, ...options });
    return elementHandle.ElementHandle.fromNullable(result.element);
  }
  async waitForSelector(selector, options = {}) {
    if (options.visibility)
      throw new Error("options.visibility is not supported, did you mean options.state?");
    if (options.waitFor && options.waitFor !== "visible")
      throw new Error("options.waitFor is not supported, did you mean options.state?");
    const result = await this._channel.waitForSelector({ selector, ...options, timeout: this._timeout(options) });
    return elementHandle.ElementHandle.fromNullable(result.element);
  }
  async dispatchEvent(selector, type, eventInit, options = {}) {
    await this._channel.dispatchEvent({ selector, type, eventInit: jsHandle.serializeArgument(eventInit), ...options, timeout: this._timeout(options) });
  }
  async $eval(selector, pageFunction, arg) {
    jsHandle.assertMaxArguments(arguments.length, 3);
    const result = await this._channel.evalOnSelector({ selector, expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.parseResult(result.value);
  }
  async $$eval(selector, pageFunction, arg) {
    jsHandle.assertMaxArguments(arguments.length, 3);
    const result = await this._channel.evalOnSelectorAll({ selector, expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.parseResult(result.value);
  }
  async $$(selector) {
    const result = await this._channel.querySelectorAll({ selector });
    return result.elements.map((e) => elementHandle.ElementHandle.from(e));
  }
  async _queryCount(selector) {
    return (await this._channel.queryCount({ selector })).value;
  }
  async content() {
    return (await this._channel.content()).value;
  }
  async setContent(html, options = {}) {
    const waitUntil = verifyLoadState("waitUntil", options.waitUntil === void 0 ? "load" : options.waitUntil);
    await this._channel.setContent({ html, ...options, waitUntil, timeout: this._navigationTimeout(options) });
  }
  name() {
    return this._name || "";
  }
  url() {
    return this._url;
  }
  parentFrame() {
    return this._parentFrame;
  }
  childFrames() {
    return Array.from(this._childFrames);
  }
  isDetached() {
    return this._detached;
  }
  async addScriptTag(options = {}) {
    const copy = { ...options };
    if (copy.path) {
      copy.content = (await this._platform.fs().promises.readFile(copy.path)).toString();
      copy.content = clientHelper.addSourceUrlToScript(copy.content, copy.path);
    }
    return elementHandle.ElementHandle.from((await this._channel.addScriptTag({ ...copy })).element);
  }
  async addStyleTag(options = {}) {
    const copy = { ...options };
    if (copy.path) {
      copy.content = (await this._platform.fs().promises.readFile(copy.path)).toString();
      copy.content += "/*# sourceURL=" + copy.path.replace(/\n/g, "") + "*/";
    }
    return elementHandle.ElementHandle.from((await this._channel.addStyleTag({ ...copy })).element);
  }
  async click(selector, options = {}) {
    return await this._channel.click({ selector, ...options, timeout: this._timeout(options) });
  }
  async dblclick(selector, options = {}) {
    return await this._channel.dblclick({ selector, ...options, timeout: this._timeout(options) });
  }
  async dragAndDrop(source, target, options = {}) {
    return await this._channel.dragAndDrop({ source, target, ...options, timeout: this._timeout(options) });
  }
  async tap(selector, options = {}) {
    return await this._channel.tap({ selector, ...options, timeout: this._timeout(options) });
  }
  async fill(selector, value, options = {}) {
    return await this._channel.fill({ selector, value, ...options, timeout: this._timeout(options) });
  }
  async _highlight(selector) {
    return await this._channel.highlight({ selector });
  }
  locator(selector, options) {
    return new locator.Locator(this, selector, options);
  }
  getByTestId(testId) {
    return this.locator(locatorUtils.getByTestIdSelector(locator.testIdAttributeName(), testId));
  }
  getByAltText(text, options) {
    return this.locator(locatorUtils.getByAltTextSelector(text, options));
  }
  getByLabel(text, options) {
    return this.locator(locatorUtils.getByLabelSelector(text, options));
  }
  getByPlaceholder(text, options) {
    return this.locator(locatorUtils.getByPlaceholderSelector(text, options));
  }
  getByText(text, options) {
    return this.locator(locatorUtils.getByTextSelector(text, options));
  }
  getByTitle(text, options) {
    return this.locator(locatorUtils.getByTitleSelector(text, options));
  }
  getByRole(role, options = {}) {
    return this.locator(locatorUtils.getByRoleSelector(role, options));
  }
  frameLocator(selector) {
    return new locator.FrameLocator(this, selector);
  }
  async focus(selector, options = {}) {
    await this._channel.focus({ selector, ...options, timeout: this._timeout(options) });
  }
  async textContent(selector, options = {}) {
    const value = (await this._channel.textContent({ selector, ...options, timeout: this._timeout(options) })).value;
    return value === void 0 ? null : value;
  }
  async innerText(selector, options = {}) {
    return (await this._channel.innerText({ selector, ...options, timeout: this._timeout(options) })).value;
  }
  async innerHTML(selector, options = {}) {
    return (await this._channel.innerHTML({ selector, ...options, timeout: this._timeout(options) })).value;
  }
  async getAttribute(selector, name, options = {}) {
    const value = (await this._channel.getAttribute({ selector, name, ...options, timeout: this._timeout(options) })).value;
    return value === void 0 ? null : value;
  }
  async inputValue(selector, options = {}) {
    return (await this._channel.inputValue({ selector, ...options, timeout: this._timeout(options) })).value;
  }
  async isChecked(selector, options = {}) {
    return (await this._channel.isChecked({ selector, ...options, timeout: this._timeout(options) })).value;
  }
  async isDisabled(selector, options = {}) {
    return (await this._channel.isDisabled({ selector, ...options, timeout: this._timeout(options) })).value;
  }
  async isEditable(selector, options = {}) {
    return (await this._channel.isEditable({ selector, ...options, timeout: this._timeout(options) })).value;
  }
  async isEnabled(selector, options = {}) {
    return (await this._channel.isEnabled({ selector, ...options, timeout: this._timeout(options) })).value;
  }
  async isHidden(selector, options = {}) {
    return (await this._channel.isHidden({ selector, ...options })).value;
  }
  async isVisible(selector, options = {}) {
    return (await this._channel.isVisible({ selector, ...options })).value;
  }
  async hover(selector, options = {}) {
    await this._channel.hover({ selector, ...options, timeout: this._timeout(options) });
  }
  async selectOption(selector, values, options = {}) {
    return (await this._channel.selectOption({ selector, ...elementHandle.convertSelectOptionValues(values), ...options, timeout: this._timeout(options) })).values;
  }
  async setInputFiles(selector, files, options = {}) {
    const converted = await elementHandle.convertInputFiles(this._platform, files, this.page().context());
    await this._channel.setInputFiles({ selector, ...converted, ...options, timeout: this._timeout(options) });
  }
  async type(selector, text, options = {}) {
    await this._channel.type({ selector, text, ...options, timeout: this._timeout(options) });
  }
  async press(selector, key, options = {}) {
    await this._channel.press({ selector, key, ...options, timeout: this._timeout(options) });
  }
  async check(selector, options = {}) {
    await this._channel.check({ selector, ...options, timeout: this._timeout(options) });
  }
  async uncheck(selector, options = {}) {
    await this._channel.uncheck({ selector, ...options, timeout: this._timeout(options) });
  }
  async setChecked(selector, checked, options) {
    if (checked)
      await this.check(selector, options);
    else
      await this.uncheck(selector, options);
  }
  async waitForTimeout(timeout) {
    await this._channel.waitForTimeout({ waitTimeout: timeout });
  }
  async waitForFunction(pageFunction, arg, options = {}) {
    if (typeof options.polling === "string")
      assert.assert(options.polling === "raf", "Unknown polling option: " + options.polling);
    const result = await this._channel.waitForFunction({
      ...options,
      pollingInterval: options.polling === "raf" ? void 0 : options.polling,
      expression: String(pageFunction),
      isFunction: typeof pageFunction === "function",
      arg: jsHandle.serializeArgument(arg),
      timeout: this._timeout(options)
    });
    return jsHandle.JSHandle.from(result.handle);
  }
  async title() {
    return (await this._channel.title()).value;
  }
  async _expect(expression, options) {
    const params = { expression, ...options, isNot: !!options.isNot };
    params.expectedValue = jsHandle.serializeArgument(options.expectedValue);
    const result = await this._channel.expect(params);
    if (result.received !== void 0)
      result.received = jsHandle.parseResult(result.received);
    return result;
  }
}
function verifyLoadState(name, waitUntil) {
  if (waitUntil === "networkidle0")
    waitUntil = "networkidle";
  if (!types.kLifecycleEvents.has(waitUntil))
    throw new Error(`${name}: expected one of (load|domcontentloaded|networkidle|commit)`);
  return waitUntil;
}

exports.Frame = Frame;
exports.verifyLoadState = verifyLoadState;
