'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const page = require('../page.js');
const dispatcher = require('./dispatcher.js');
const pageDispatcher = require('./pageDispatcher.js');
const webSocketMockSource = require('../../generated/webSocketMockSource.js');
const instrumentation = require('../instrumentation.js');
const urlMatch = require('../../utils/isomorphic/urlMatch.js');
const eventsHelper = require('../utils/eventsHelper.js');

class WebSocketRouteDispatcher extends dispatcher.Dispatcher {
  constructor(scope, id, url, frame) {
    super(scope, new instrumentation.SdkObject(scope._object, "webSocketRoute"), "WebSocketRoute", { url });
    this._type_WebSocketRoute = true;
    this._id = id;
    this._frame = frame;
    this._eventListeners.push(
      // When the frame navigates or detaches, there will be no more communication
      // from the mock websocket, so pretend like it was closed.
      eventsHelper.eventsHelper.addEventListener(frame._page, page.Page.Events.InternalFrameNavigatedToNewDocument, (frame2) => {
        if (frame2 === this._frame)
          this._executionContextGone();
      }),
      eventsHelper.eventsHelper.addEventListener(frame._page, page.Page.Events.FrameDetached, (frame2) => {
        if (frame2 === this._frame)
          this._executionContextGone();
      }),
      eventsHelper.eventsHelper.addEventListener(frame._page, page.Page.Events.Close, () => this._executionContextGone()),
      eventsHelper.eventsHelper.addEventListener(frame._page, page.Page.Events.Crash, () => this._executionContextGone())
    );
    WebSocketRouteDispatcher._idToDispatcher.set(this._id, this);
    scope._dispatchEvent("webSocketRoute", { webSocketRoute: this });
  }
  static {
    this._idToDispatcher = /* @__PURE__ */ new Map();
  }
  static async install(progress, connection, target) {
    const context = target instanceof page.Page ? target.browserContext : target;
    let data = context.getBindingClient(kBindingName);
    if (data && data.connection !== connection)
      throw new Error("Another client is already routing WebSockets");
    if (!data) {
      data = { counter: 0, connection, binding: null };
      data.binding = await context.exposeBinding(progress, kBindingName, false, (source, payload) => {
        if (payload.type === "onCreate") {
          const contextDispatcher = connection.existingDispatcher(context);
          const pageDispatcher$1 = contextDispatcher ? pageDispatcher.PageDispatcher.fromNullable(contextDispatcher, source.page) : void 0;
          let scope;
          if (pageDispatcher$1 && matchesPattern(pageDispatcher$1, context._options.baseURL, payload.url))
            scope = pageDispatcher$1;
          else if (contextDispatcher && matchesPattern(contextDispatcher, context._options.baseURL, payload.url))
            scope = contextDispatcher;
          if (scope) {
            new WebSocketRouteDispatcher(scope, payload.id, payload.url, source.frame);
          } else {
            const request = { id: payload.id, type: "passthrough" };
            source.frame.evaluateExpression(`globalThis.__pwWebSocketDispatch(${JSON.stringify(request)})`).catch(() => {
            });
          }
          return;
        }
        const dispatcher = WebSocketRouteDispatcher._idToDispatcher.get(payload.id);
        if (payload.type === "onMessageFromPage")
          dispatcher?._dispatchEvent("messageFromPage", { message: payload.data.data, isBase64: payload.data.isBase64 });
        if (payload.type === "onMessageFromServer")
          dispatcher?._dispatchEvent("messageFromServer", { message: payload.data.data, isBase64: payload.data.isBase64 });
        if (payload.type === "onClosePage")
          dispatcher?._dispatchEvent("closePage", { code: payload.code, reason: payload.reason, wasClean: payload.wasClean });
        if (payload.type === "onCloseServer")
          dispatcher?._dispatchEvent("closeServer", { code: payload.code, reason: payload.reason, wasClean: payload.wasClean });
      }, data);
    }
    ++data.counter;
    return await target.addInitScript(progress, `
      (() => {
        const module = {};
        ${webSocketMockSource.source}
        (module.exports.inject())(globalThis);
      })();
    `);
  }
  static async uninstall(connection, target, initScript) {
    const context = target instanceof page.Page ? target.browserContext : target;
    const data = context.getBindingClient(kBindingName);
    if (!data || data.connection !== connection)
      return;
    if (--data.counter <= 0)
      await context.removeExposedBindings([data.binding]);
    await target.removeInitScripts([initScript]);
  }
  async connect(params, progress) {
    await this._evaluateAPIRequest(progress, { id: this._id, type: "connect" });
  }
  async ensureOpened(params, progress) {
    await this._evaluateAPIRequest(progress, { id: this._id, type: "ensureOpened" });
  }
  async sendToPage(params, progress) {
    await this._evaluateAPIRequest(progress, { id: this._id, type: "sendToPage", data: { data: params.message, isBase64: params.isBase64 } });
  }
  async sendToServer(params, progress) {
    await this._evaluateAPIRequest(progress, { id: this._id, type: "sendToServer", data: { data: params.message, isBase64: params.isBase64 } });
  }
  async closePage(params, progress) {
    await this._evaluateAPIRequest(progress, { id: this._id, type: "closePage", code: params.code, reason: params.reason, wasClean: params.wasClean });
  }
  async closeServer(params, progress) {
    await this._evaluateAPIRequest(progress, { id: this._id, type: "closeServer", code: params.code, reason: params.reason, wasClean: params.wasClean });
  }
  async _evaluateAPIRequest(progress, request) {
    await progress.race(this._frame.evaluateExpression(`globalThis.__pwWebSocketDispatch(${JSON.stringify(request)})`).catch(() => {
    }));
  }
  _onDispose() {
    WebSocketRouteDispatcher._idToDispatcher.delete(this._id);
  }
  _executionContextGone() {
    if (!this._disposed) {
      this._dispatchEvent("closePage", { wasClean: true });
      this._dispatchEvent("closeServer", { wasClean: true });
    }
  }
}
function matchesPattern(dispatcher, baseURL, url) {
  for (const pattern of dispatcher._webSocketInterceptionPatterns || []) {
    const urlMatch$1 = pattern.regexSource ? new RegExp(pattern.regexSource, pattern.regexFlags) : pattern.glob;
    if (urlMatch.urlMatches(baseURL, url, urlMatch$1, true))
      return true;
  }
  return false;
}
const kBindingName = "__pwWebSocketBinding";

exports.WebSocketRouteDispatcher = WebSocketRouteDispatcher;
