'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const frames = require('../frames.js');
const dispatcher = require('./dispatcher.js');
const elementHandlerDispatcher = require('./elementHandlerDispatcher.js');
const jsHandleDispatcher = require('./jsHandleDispatcher.js');
const networkDispatchers = require('./networkDispatchers.js');
const ariaSnapshot = require('../../utils/isomorphic/ariaSnapshot.js');
const utilsBundle = require('../../utilsBundle.js');

class FrameDispatcher extends dispatcher.Dispatcher {
  constructor(scope, frame) {
    const gcBucket = frame._page.mainFrame() === frame ? "MainFrame" : "Frame";
    const pageDispatcher = scope.connection.existingDispatcher(frame._page);
    super(pageDispatcher || scope, frame, "Frame", {
      url: frame.url(),
      name: frame.name(),
      parentFrame: FrameDispatcher.fromNullable(scope, frame.parentFrame()),
      loadStates: Array.from(frame._firedLifecycleEvents)
    }, gcBucket);
    this._type_Frame = true;
    this._browserContextDispatcher = scope;
    this._frame = frame;
    this.addObjectListener(frames.Frame.Events.AddLifecycle, (lifecycleEvent) => {
      this._dispatchEvent("loadstate", { add: lifecycleEvent });
    });
    this.addObjectListener(frames.Frame.Events.RemoveLifecycle, (lifecycleEvent) => {
      this._dispatchEvent("loadstate", { remove: lifecycleEvent });
    });
    this.addObjectListener(frames.Frame.Events.InternalNavigation, (event) => {
      if (!event.isPublic)
        return;
      const params = { url: event.url, name: event.name, error: event.error ? event.error.message : void 0 };
      if (event.newDocument)
        params.newDocument = { request: networkDispatchers.RequestDispatcher.fromNullable(this._browserContextDispatcher, event.newDocument.request || null) };
      this._dispatchEvent("navigated", params);
    });
  }
  static from(scope, frame) {
    const result = scope.connection.existingDispatcher(frame);
    return result || new FrameDispatcher(scope, frame);
  }
  static fromNullable(scope, frame) {
    if (!frame)
      return;
    return FrameDispatcher.from(scope, frame);
  }
  async goto(params, progress) {
    return { response: networkDispatchers.ResponseDispatcher.fromNullable(this._browserContextDispatcher, await this._frame.goto(progress, params.url, params)) };
  }
  async frameElement(params, progress) {
    return { element: elementHandlerDispatcher.ElementHandleDispatcher.from(this, await progress.race(this._frame.frameElement())) };
  }
  async evaluateExpression(params, progress) {
    return { value: jsHandleDispatcher.serializeResult(await progress.race(this._frame.evaluateExpression(params.expression, { isFunction: params.isFunction }, jsHandleDispatcher.parseArgument(params.arg)))) };
  }
  async evaluateExpressionHandle(params, progress) {
    return { handle: elementHandlerDispatcher.ElementHandleDispatcher.fromJSOrElementHandle(this, await progress.race(this._frame.evaluateExpressionHandle(params.expression, { isFunction: params.isFunction }, jsHandleDispatcher.parseArgument(params.arg)))) };
  }
  async waitForSelector(params, progress) {
    return { element: elementHandlerDispatcher.ElementHandleDispatcher.fromNullable(this, await this._frame.waitForSelector(progress, params.selector, true, params)) };
  }
  async dispatchEvent(params, progress) {
    return this._frame.dispatchEvent(progress, params.selector, params.type, jsHandleDispatcher.parseArgument(params.eventInit), params);
  }
  async evalOnSelector(params, progress) {
    return { value: jsHandleDispatcher.serializeResult(await progress.race(this._frame.evalOnSelector(params.selector, !!params.strict, params.expression, params.isFunction, jsHandleDispatcher.parseArgument(params.arg)))) };
  }
  async evalOnSelectorAll(params, progress) {
    return { value: jsHandleDispatcher.serializeResult(await progress.race(this._frame.evalOnSelectorAll(params.selector, params.expression, params.isFunction, jsHandleDispatcher.parseArgument(params.arg)))) };
  }
  async querySelector(params, progress) {
    return { element: elementHandlerDispatcher.ElementHandleDispatcher.fromNullable(this, await progress.race(this._frame.querySelector(params.selector, params))) };
  }
  async querySelectorAll(params, progress) {
    const elements = await progress.race(this._frame.querySelectorAll(params.selector));
    return { elements: elements.map((e) => elementHandlerDispatcher.ElementHandleDispatcher.from(this, e)) };
  }
  async queryCount(params, progress) {
    return { value: await progress.race(this._frame.queryCount(params.selector)) };
  }
  async content(params, progress) {
    return { value: await progress.race(this._frame.content()) };
  }
  async setContent(params, progress) {
    return await this._frame.setContent(progress, params.html, params);
  }
  async addScriptTag(params, progress) {
    return { element: elementHandlerDispatcher.ElementHandleDispatcher.from(this, await progress.race(this._frame.addScriptTag(params))) };
  }
  async addStyleTag(params, progress) {
    return { element: elementHandlerDispatcher.ElementHandleDispatcher.from(this, await progress.race(this._frame.addStyleTag(params))) };
  }
  async click(params, progress) {
    progress.metadata.potentiallyClosesScope = true;
    return await this._frame.click(progress, params.selector, params);
  }
  async dblclick(params, progress) {
    return await this._frame.dblclick(progress, params.selector, params);
  }
  async dragAndDrop(params, progress) {
    return await this._frame.dragAndDrop(progress, params.source, params.target, params);
  }
  async tap(params, progress) {
    return await this._frame.tap(progress, params.selector, params);
  }
  async fill(params, progress) {
    return await this._frame.fill(progress, params.selector, params.value, params);
  }
  async focus(params, progress) {
    await this._frame.focus(progress, params.selector, params);
  }
  async blur(params, progress) {
    await this._frame.blur(progress, params.selector, params);
  }
  async textContent(params, progress) {
    const value = await this._frame.textContent(progress, params.selector, params);
    return { value: value === null ? void 0 : value };
  }
  async innerText(params, progress) {
    return { value: await this._frame.innerText(progress, params.selector, params) };
  }
  async innerHTML(params, progress) {
    return { value: await this._frame.innerHTML(progress, params.selector, params) };
  }
  async generateLocatorString(params, progress) {
    return { value: await this._frame.generateLocatorString(progress, params.selector) };
  }
  async getAttribute(params, progress) {
    const value = await this._frame.getAttribute(progress, params.selector, params.name, params);
    return { value: value === null ? void 0 : value };
  }
  async inputValue(params, progress) {
    const value = await this._frame.inputValue(progress, params.selector, params);
    return { value };
  }
  async isChecked(params, progress) {
    return { value: await this._frame.isChecked(progress, params.selector, params) };
  }
  async isDisabled(params, progress) {
    return { value: await this._frame.isDisabled(progress, params.selector, params) };
  }
  async isEditable(params, progress) {
    return { value: await this._frame.isEditable(progress, params.selector, params) };
  }
  async isEnabled(params, progress) {
    return { value: await this._frame.isEnabled(progress, params.selector, params) };
  }
  async isHidden(params, progress) {
    return { value: await this._frame.isHidden(progress, params.selector, params) };
  }
  async isVisible(params, progress) {
    return { value: await this._frame.isVisible(progress, params.selector, params) };
  }
  async hover(params, progress) {
    return await this._frame.hover(progress, params.selector, params);
  }
  async selectOption(params, progress) {
    const elements = (params.elements || []).map((e) => e._elementHandle);
    return { values: await this._frame.selectOption(progress, params.selector, elements, params.options || [], params) };
  }
  async setInputFiles(params, progress) {
    return await this._frame.setInputFiles(progress, params.selector, params);
  }
  async type(params, progress) {
    return await this._frame.type(progress, params.selector, params.text, params);
  }
  async press(params, progress) {
    return await this._frame.press(progress, params.selector, params.key, params);
  }
  async check(params, progress) {
    return await this._frame.check(progress, params.selector, params);
  }
  async uncheck(params, progress) {
    return await this._frame.uncheck(progress, params.selector, params);
  }
  async waitForTimeout(params, progress) {
    return await this._frame.waitForTimeout(progress, params.waitTimeout);
  }
  async waitForFunction(params, progress) {
    return { handle: elementHandlerDispatcher.ElementHandleDispatcher.fromJSOrElementHandle(this, await this._frame.waitForFunctionExpression(progress, params.expression, params.isFunction, jsHandleDispatcher.parseArgument(params.arg), params)) };
  }
  async title(params, progress) {
    return { value: await progress.race(this._frame.title()) };
  }
  async highlight(params, progress) {
    return await this._frame.highlight(progress, params.selector);
  }
  async expect(params, progress) {
    progress.metadata.potentiallyClosesScope = true;
    let expectedValue = params.expectedValue ? jsHandleDispatcher.parseArgument(params.expectedValue) : void 0;
    if (params.expression === "to.match.aria" && expectedValue)
      expectedValue = ariaSnapshot.parseAriaSnapshotUnsafe(utilsBundle.yaml, expectedValue);
    const result = await this._frame.expect(progress, params.selector, { ...params, expectedValue }, params.timeout, (result2) => {
      if (result2.received !== void 0)
        result2.received = jsHandleDispatcher.serializeResult(result2.received);
      return result2;
    });
    if (result.received !== void 0)
      result.received = jsHandleDispatcher.serializeResult(result.received);
    return result;
  }
  async ariaSnapshot(params, progress) {
    return { snapshot: await this._frame.ariaSnapshot(progress, params.selector, params) };
  }
}

exports.FrameDispatcher = FrameDispatcher;
