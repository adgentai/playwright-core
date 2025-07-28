'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const artifact = require('./artifact.js');
const cdpSession = require('./cdpSession.js');
const channelOwner = require('./channelOwner.js');
const clientHelper = require('./clientHelper.js');
const clock = require('./clock.js');
const consoleMessage = require('./consoleMessage.js');
const dialog = require('./dialog.js');
const errors = require('./errors.js');
const events = require('./events.js');
const fetch = require('./fetch.js');
const frame = require('./frame.js');
const harRouter = require('./harRouter.js');
const network = require('./network.js');
const page = require('./page.js');
const tracing = require('./tracing.js');
const waiter = require('./waiter.js');
const webError = require('./webError.js');
const worker = require('./worker.js');
const timeoutSettings = require('./timeoutSettings.js');
const fileUtils = require('./fileUtils.js');
const headers = require('../utils/isomorphic/headers.js');
const urlMatch = require('../utils/isomorphic/urlMatch.js');
const rtti = require('../utils/isomorphic/rtti.js');
const stackTrace = require('../utils/isomorphic/stackTrace.js');
const stringUtils = require('../utils/isomorphic/stringUtils.js');

class BrowserContext extends channelOwner.ChannelOwner {
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    this._pages = /* @__PURE__ */ new Set();
    this._routes = [];
    this._webSocketRoutes = [];
    // Browser is null for browser contexts created outside of normal browser, e.g. android or electron.
    this._browser = null;
    this._bindings = /* @__PURE__ */ new Map();
    this._forReuse = false;
    this._backgroundPages = /* @__PURE__ */ new Set();
    this._serviceWorkers = /* @__PURE__ */ new Set();
    this._harRecorders = /* @__PURE__ */ new Map();
    this._closingStatus = "none";
    this._harRouters = [];
    this._options = initializer.options;
    this._timeoutSettings = new timeoutSettings.TimeoutSettings(this._platform);
    this.tracing = tracing.Tracing.from(initializer.tracing);
    this.request = fetch.APIRequestContext.from(initializer.requestContext);
    this.request._timeoutSettings = this._timeoutSettings;
    this.clock = new clock.Clock(this);
    this._channel.on("bindingCall", ({ binding }) => this._onBinding(page.BindingCall.from(binding)));
    this._channel.on("close", () => this._onClose());
    this._channel.on("page", ({ page: page$1 }) => this._onPage(page.Page.from(page$1)));
    this._channel.on("route", ({ route }) => this._onRoute(network.Route.from(route)));
    this._channel.on("webSocketRoute", ({ webSocketRoute }) => this._onWebSocketRoute(network.WebSocketRoute.from(webSocketRoute)));
    this._channel.on("backgroundPage", ({ page: page$1 }) => {
      const backgroundPage = page.Page.from(page$1);
      this._backgroundPages.add(backgroundPage);
      this.emit(events.Events.BrowserContext.BackgroundPage, backgroundPage);
    });
    this._channel.on("serviceWorker", ({ worker: worker$1 }) => {
      const serviceWorker = worker.Worker.from(worker$1);
      serviceWorker._context = this;
      this._serviceWorkers.add(serviceWorker);
      this.emit(events.Events.BrowserContext.ServiceWorker, serviceWorker);
    });
    this._channel.on("console", (event) => {
      const consoleMessage$1 = new consoleMessage.ConsoleMessage(this._platform, event);
      this.emit(events.Events.BrowserContext.Console, consoleMessage$1);
      const page = consoleMessage$1.page();
      if (page)
        page.emit(events.Events.Page.Console, consoleMessage$1);
    });
    this._channel.on("pageError", ({ error, page: page$1 }) => {
      const pageObject = page.Page.from(page$1);
      const parsedError = errors.parseError(error);
      this.emit(events.Events.BrowserContext.WebError, new webError.WebError(pageObject, parsedError));
      if (pageObject)
        pageObject.emit(events.Events.Page.PageError, parsedError);
    });
    this._channel.on("dialog", ({ dialog: dialog$1 }) => {
      const dialogObject = dialog.Dialog.from(dialog$1);
      let hasListeners = this.emit(events.Events.BrowserContext.Dialog, dialogObject);
      const page = dialogObject.page();
      if (page)
        hasListeners = page.emit(events.Events.Page.Dialog, dialogObject) || hasListeners;
      if (!hasListeners) {
        if (dialogObject.type() === "beforeunload")
          dialog$1.accept({}).catch(() => {
          });
        else
          dialog$1.dismiss().catch(() => {
          });
      }
    });
    this._channel.on("request", ({ request, page: page$1 }) => this._onRequest(network.Request.from(request), page.Page.fromNullable(page$1)));
    this._channel.on("requestFailed", ({ request, failureText, responseEndTiming, page: page$1 }) => this._onRequestFailed(network.Request.from(request), responseEndTiming, failureText, page.Page.fromNullable(page$1)));
    this._channel.on("requestFinished", (params) => this._onRequestFinished(params));
    this._channel.on("response", ({ response, page: page$1 }) => this._onResponse(network.Response.from(response), page.Page.fromNullable(page$1)));
    this._channel.on("recorderEvent", ({ event, data, page: page$1 }) => {
      if (event === "actionAdded")
        this._onRecorderEventSink?.actionAdded(page.Page.from(page$1), data);
      else if (event === "actionUpdated")
        this._onRecorderEventSink?.actionUpdated(page.Page.from(page$1), data);
      else if (event === "signalAdded")
        this._onRecorderEventSink?.signalAdded(page.Page.from(page$1), data);
    });
    this._closedPromise = new Promise((f) => this.once(events.Events.BrowserContext.Close, f));
    this._setEventToSubscriptionMapping(/* @__PURE__ */ new Map([
      [events.Events.BrowserContext.Console, "console"],
      [events.Events.BrowserContext.Dialog, "dialog"],
      [events.Events.BrowserContext.Request, "request"],
      [events.Events.BrowserContext.Response, "response"],
      [events.Events.BrowserContext.RequestFinished, "requestFinished"],
      [events.Events.BrowserContext.RequestFailed, "requestFailed"]
    ]));
  }
  static from(context) {
    return context._object;
  }
  static fromNullable(context) {
    return context ? BrowserContext.from(context) : null;
  }
  async _initializeHarFromOptions(recordHar) {
    if (!recordHar)
      return;
    const defaultContent = recordHar.path.endsWith(".zip") ? "attach" : "embed";
    await this._recordIntoHAR(recordHar.path, null, {
      url: recordHar.urlFilter,
      updateContent: recordHar.content ?? (recordHar.omitContent ? "omit" : defaultContent),
      updateMode: recordHar.mode ?? "full"
    });
  }
  _onPage(page) {
    this._pages.add(page);
    this.emit(events.Events.BrowserContext.Page, page);
    if (page._opener && !page._opener.isClosed())
      page._opener.emit(events.Events.Page.Popup, page);
  }
  _onRequest(request, page) {
    this.emit(events.Events.BrowserContext.Request, request);
    if (page)
      page.emit(events.Events.Page.Request, request);
  }
  _onResponse(response, page) {
    this.emit(events.Events.BrowserContext.Response, response);
    if (page)
      page.emit(events.Events.Page.Response, response);
  }
  _onRequestFailed(request, responseEndTiming, failureText, page) {
    request._failureText = failureText || null;
    request._setResponseEndTiming(responseEndTiming);
    this.emit(events.Events.BrowserContext.RequestFailed, request);
    if (page)
      page.emit(events.Events.Page.RequestFailed, request);
  }
  _onRequestFinished(params) {
    const { responseEndTiming } = params;
    const request = network.Request.from(params.request);
    const response = network.Response.fromNullable(params.response);
    const page$1 = page.Page.fromNullable(params.page);
    request._setResponseEndTiming(responseEndTiming);
    this.emit(events.Events.BrowserContext.RequestFinished, request);
    if (page$1)
      page$1.emit(events.Events.Page.RequestFinished, request);
    if (response)
      response._finishedPromise.resolve(null);
  }
  async _onRoute(route) {
    route._context = this;
    const page = route.request()._safePage();
    const routeHandlers = this._routes.slice();
    for (const routeHandler of routeHandlers) {
      if (page?._closeWasCalled || this._closingStatus !== "none")
        return;
      if (!routeHandler.matches(route.request().url()))
        continue;
      const index = this._routes.indexOf(routeHandler);
      if (index === -1)
        continue;
      if (routeHandler.willExpire())
        this._routes.splice(index, 1);
      const handled = await routeHandler.handle(route);
      if (!this._routes.length)
        this._updateInterceptionPatterns().catch(() => {
        });
      if (handled)
        return;
    }
    await route._innerContinue(
      true
      /* isFallback */
    ).catch(() => {
    });
  }
  async _onWebSocketRoute(webSocketRoute) {
    const routeHandler = this._webSocketRoutes.find((route) => route.matches(webSocketRoute.url()));
    if (routeHandler)
      await routeHandler.handle(webSocketRoute);
    else
      webSocketRoute.connectToServer();
  }
  async _onBinding(bindingCall) {
    const func = this._bindings.get(bindingCall._initializer.name);
    if (!func)
      return;
    await bindingCall.call(func);
  }
  setDefaultNavigationTimeout(timeout) {
    this._timeoutSettings.setDefaultNavigationTimeout(timeout);
  }
  setDefaultTimeout(timeout) {
    this._timeoutSettings.setDefaultTimeout(timeout);
  }
  browser() {
    return this._browser;
  }
  pages() {
    return [...this._pages];
  }
  async newPage() {
    if (this._ownerPage)
      throw new Error("Please use browser.newContext()");
    return page.Page.from((await this._channel.newPage()).page);
  }
  async cookies(urls) {
    if (!urls)
      urls = [];
    if (urls && typeof urls === "string")
      urls = [urls];
    return (await this._channel.cookies({ urls })).cookies;
  }
  async addCookies(cookies) {
    await this._channel.addCookies({ cookies });
  }
  async clearCookies(options = {}) {
    await this._channel.clearCookies({
      name: stringUtils.isString(options.name) ? options.name : void 0,
      nameRegexSource: rtti.isRegExp(options.name) ? options.name.source : void 0,
      nameRegexFlags: rtti.isRegExp(options.name) ? options.name.flags : void 0,
      domain: stringUtils.isString(options.domain) ? options.domain : void 0,
      domainRegexSource: rtti.isRegExp(options.domain) ? options.domain.source : void 0,
      domainRegexFlags: rtti.isRegExp(options.domain) ? options.domain.flags : void 0,
      path: stringUtils.isString(options.path) ? options.path : void 0,
      pathRegexSource: rtti.isRegExp(options.path) ? options.path.source : void 0,
      pathRegexFlags: rtti.isRegExp(options.path) ? options.path.flags : void 0
    });
  }
  async grantPermissions(permissions, options) {
    await this._channel.grantPermissions({ permissions, ...options });
  }
  async clearPermissions() {
    await this._channel.clearPermissions();
  }
  async setGeolocation(geolocation) {
    await this._channel.setGeolocation({ geolocation: geolocation || void 0 });
  }
  async setExtraHTTPHeaders(headers$1) {
    network.validateHeaders(headers$1);
    await this._channel.setExtraHTTPHeaders({ headers: headers.headersObjectToArray(headers$1) });
  }
  async setOffline(offline) {
    await this._channel.setOffline({ offline });
  }
  async setHTTPCredentials(httpCredentials) {
    await this._channel.setHTTPCredentials({ httpCredentials: httpCredentials || void 0 });
  }
  async addInitScript(script, arg) {
    const source = await clientHelper.evaluationScript(this._platform, script, arg);
    await this._channel.addInitScript({ source });
  }
  async exposeBinding(name, callback, options = {}) {
    await this._channel.exposeBinding({ name, needsHandle: options.handle });
    this._bindings.set(name, callback);
  }
  async exposeFunction(name, callback) {
    await this._channel.exposeBinding({ name });
    const binding = (source, ...args) => callback(...args);
    this._bindings.set(name, binding);
  }
  async route(url, handler, options = {}) {
    this._routes.unshift(new network.RouteHandler(this._platform, this._options.baseURL, url, handler, options.times));
    await this._updateInterceptionPatterns();
  }
  async routeWebSocket(url, handler) {
    this._webSocketRoutes.unshift(new network.WebSocketRouteHandler(this._options.baseURL, url, handler));
    await this._updateWebSocketInterceptionPatterns();
  }
  async _recordIntoHAR(har, page, options = {}) {
    const { harId } = await this._channel.harStart({
      page: page?._channel,
      options: {
        zip: har.endsWith(".zip"),
        content: options.updateContent ?? "attach",
        urlGlob: stringUtils.isString(options.url) ? options.url : void 0,
        urlRegexSource: rtti.isRegExp(options.url) ? options.url.source : void 0,
        urlRegexFlags: rtti.isRegExp(options.url) ? options.url.flags : void 0,
        mode: options.updateMode ?? "minimal"
      }
    });
    this._harRecorders.set(harId, { path: har, content: options.updateContent ?? "attach" });
  }
  async routeFromHAR(har, options = {}) {
    const localUtils = this._connection.localUtils();
    if (!localUtils)
      throw new Error("Route from har is not supported in thin clients");
    if (options.update) {
      await this._recordIntoHAR(har, null, options);
      return;
    }
    const harRouter$1 = await harRouter.HarRouter.create(localUtils, har, options.notFound || "abort", { urlMatch: options.url });
    this._harRouters.push(harRouter$1);
    await harRouter$1.addContextRoute(this);
  }
  _disposeHarRouters() {
    this._harRouters.forEach((router) => router.dispose());
    this._harRouters = [];
  }
  async unrouteAll(options) {
    await this._unrouteInternal(this._routes, [], options?.behavior);
    this._disposeHarRouters();
  }
  async unroute(url, handler) {
    const removed = [];
    const remaining = [];
    for (const route of this._routes) {
      if (urlMatch.urlMatchesEqual(route.url, url) && (!handler || route.handler === handler))
        removed.push(route);
      else
        remaining.push(route);
    }
    await this._unrouteInternal(removed, remaining, "default");
  }
  async _unrouteInternal(removed, remaining, behavior) {
    this._routes = remaining;
    if (behavior && behavior !== "default") {
      const promises = removed.map((routeHandler) => routeHandler.stop(behavior));
      await Promise.all(promises);
    }
    await this._updateInterceptionPatterns();
  }
  async _updateInterceptionPatterns() {
    const patterns = network.RouteHandler.prepareInterceptionPatterns(this._routes);
    await this._channel.setNetworkInterceptionPatterns({ patterns });
  }
  async _updateWebSocketInterceptionPatterns() {
    const patterns = network.WebSocketRouteHandler.prepareInterceptionPatterns(this._webSocketRoutes);
    await this._channel.setWebSocketInterceptionPatterns({ patterns });
  }
  _effectiveCloseReason() {
    return this._closeReason || this._browser?._closeReason;
  }
  async waitForEvent(event, optionsOrPredicate = {}) {
    return await this._wrapApiCall(async () => {
      const timeout = this._timeoutSettings.timeout(typeof optionsOrPredicate === "function" ? {} : optionsOrPredicate);
      const predicate = typeof optionsOrPredicate === "function" ? optionsOrPredicate : optionsOrPredicate.predicate;
      const waiter$1 = waiter.Waiter.createForEvent(this, event);
      waiter$1.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded while waiting for event "${event}"`);
      if (event !== events.Events.BrowserContext.Close)
        waiter$1.rejectOnEvent(this, events.Events.BrowserContext.Close, () => new errors.TargetClosedError(this._effectiveCloseReason()));
      const result = await waiter$1.waitForEvent(this, event, predicate);
      waiter$1.dispose();
      return result;
    });
  }
  async storageState(options = {}) {
    const state = await this._channel.storageState({ indexedDB: options.indexedDB });
    if (options.path) {
      await fileUtils.mkdirIfNeeded(this._platform, options.path);
      await this._platform.fs().promises.writeFile(options.path, JSON.stringify(state, void 0, 2), "utf8");
    }
    return state;
  }
  backgroundPages() {
    return [...this._backgroundPages];
  }
  serviceWorkers() {
    return [...this._serviceWorkers];
  }
  async newCDPSession(page$1) {
    if (!(page$1 instanceof page.Page) && !(page$1 instanceof frame.Frame))
      throw new Error("page: expected Page or Frame");
    const result = await this._channel.newCDPSession(page$1 instanceof page.Page ? { page: page$1._channel } : { frame: page$1._channel });
    return cdpSession.CDPSession.from(result.session);
  }
  _onClose() {
    this._closingStatus = "closed";
    this._browser?._contexts.delete(this);
    this._browser?._browserType._contexts.delete(this);
    this._browser?._browserType._playwright.selectors._contextsForSelectors.delete(this);
    this._disposeHarRouters();
    this.tracing._resetStackCounter();
    this.emit(events.Events.BrowserContext.Close, this);
  }
  async [Symbol.asyncDispose]() {
    await this.close();
  }
  async close(options = {}) {
    if (this._closingStatus !== "none")
      return;
    this._closeReason = options.reason;
    this._closingStatus = "closing";
    await this.request.dispose(options);
    await this._wrapApiCall(async () => {
      await this._instrumentation.runBeforeCloseBrowserContext(this);
      for (const [harId, harParams] of this._harRecorders) {
        const har = await this._channel.harExport({ harId });
        const artifact$1 = artifact.Artifact.from(har.artifact);
        const isCompressed = harParams.content === "attach" || harParams.path.endsWith(".zip");
        const needCompressed = harParams.path.endsWith(".zip");
        if (isCompressed && !needCompressed) {
          const localUtils = this._connection.localUtils();
          if (!localUtils)
            throw new Error("Uncompressed har is not supported in thin clients");
          await artifact$1.saveAs(harParams.path + ".tmp");
          await localUtils.harUnzip({ zipFile: harParams.path + ".tmp", harFile: harParams.path });
        } else {
          await artifact$1.saveAs(harParams.path);
        }
        await artifact$1.delete();
      }
    }, { internal: true });
    await this._channel.close(options);
    await this._closedPromise;
  }
  async _enableRecorder(params, eventSink) {
    if (eventSink)
      this._onRecorderEventSink = eventSink;
    await this._channel.enableRecorder(params);
  }
  async _disableRecorder() {
    this._onRecorderEventSink = void 0;
    await this._channel.disableRecorder();
  }
}
async function prepareStorageState(platform, options) {
  if (typeof options.storageState !== "string")
    return options.storageState;
  try {
    return JSON.parse(await platform.fs().promises.readFile(options.storageState, "utf8"));
  } catch (e) {
    stackTrace.rewriteErrorMessage(e, `Error reading storage state from ${options.storageState}:
` + e.message);
    throw e;
  }
}
async function prepareBrowserContextParams(platform, options) {
  if (options.videoSize && !options.videosPath)
    throw new Error(`"videoSize" option requires "videosPath" to be specified`);
  if (options.extraHTTPHeaders)
    network.validateHeaders(options.extraHTTPHeaders);
  const contextParams = {
    ...options,
    viewport: options.viewport === null ? void 0 : options.viewport,
    noDefaultViewport: options.viewport === null,
    extraHTTPHeaders: options.extraHTTPHeaders ? headers.headersObjectToArray(options.extraHTTPHeaders) : void 0,
    storageState: await prepareStorageState(platform, options),
    serviceWorkers: options.serviceWorkers,
    colorScheme: options.colorScheme === null ? "no-override" : options.colorScheme,
    reducedMotion: options.reducedMotion === null ? "no-override" : options.reducedMotion,
    forcedColors: options.forcedColors === null ? "no-override" : options.forcedColors,
    contrast: options.contrast === null ? "no-override" : options.contrast,
    acceptDownloads: toAcceptDownloadsProtocol(options.acceptDownloads),
    clientCertificates: await toClientCertificatesProtocol(platform, options.clientCertificates)
  };
  if (!contextParams.recordVideo && options.videosPath) {
    contextParams.recordVideo = {
      dir: options.videosPath,
      size: options.videoSize
    };
  }
  if (contextParams.recordVideo && contextParams.recordVideo.dir)
    contextParams.recordVideo.dir = platform.path().resolve(contextParams.recordVideo.dir);
  return contextParams;
}
function toAcceptDownloadsProtocol(acceptDownloads) {
  if (acceptDownloads === void 0)
    return void 0;
  if (acceptDownloads)
    return "accept";
  return "deny";
}
async function toClientCertificatesProtocol(platform, certs) {
  if (!certs)
    return void 0;
  const bufferizeContent = async (value, path) => {
    if (value)
      return value;
    if (path)
      return await platform.fs().promises.readFile(path);
  };
  return await Promise.all(certs.map(async (cert) => ({
    origin: cert.origin,
    cert: await bufferizeContent(cert.cert, cert.certPath),
    key: await bufferizeContent(cert.key, cert.keyPath),
    pfx: await bufferizeContent(cert.pfx, cert.pfxPath),
    passphrase: cert.passphrase
  })));
}

exports.BrowserContext = BrowserContext;
exports.prepareBrowserContextParams = prepareBrowserContextParams;
exports.toClientCertificatesProtocol = toClientCertificatesProtocol;
