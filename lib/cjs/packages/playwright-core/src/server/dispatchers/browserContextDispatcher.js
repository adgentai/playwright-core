'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('../../../../../bundles/fs.js');
const path = require('node:path');
const browserContext = require('../browserContext.js');
const artifactDispatcher = require('./artifactDispatcher.js');
const cdpSessionDispatcher = require('./cdpSessionDispatcher.js');
const dialogDispatcher = require('./dialogDispatcher.js');
const dispatcher = require('./dispatcher.js');
const elementHandlerDispatcher = require('./elementHandlerDispatcher.js');
const frameDispatcher = require('./frameDispatcher.js');
const jsHandleDispatcher = require('./jsHandleDispatcher.js');
const networkDispatchers = require('./networkDispatchers.js');
const pageDispatcher = require('./pageDispatcher.js');
const crBrowser = require('../chromium/crBrowser.js');
const errors = require('../errors.js');
const tracingDispatcher = require('./tracingDispatcher.js');
const webSocketRouteDispatcher = require('./webSocketRouteDispatcher.js');
const writableStreamDispatcher = require('./writableStreamDispatcher.js');
const crypto = require('../utils/crypto.js');
const urlMatch = require('../../utils/isomorphic/urlMatch.js');
const recorder = require('../recorder.js');
const recorderApp = require('../recorder/recorderApp.js');

class BrowserContextDispatcher extends dispatcher.Dispatcher {
  constructor(parentScope, context) {
    const requestContext = networkDispatchers.APIRequestContextDispatcher.from(parentScope, context.fetchRequest);
    const tracing = tracingDispatcher.TracingDispatcher.from(parentScope, context.tracing);
    super(parentScope, context, "BrowserContext", {
      isChromium: context._browser.options.isChromium,
      requestContext,
      tracing,
      options: context._options
    });
    this._type_EventTarget = true;
    this._type_BrowserContext = true;
    this._subscriptions = /* @__PURE__ */ new Set();
    this._webSocketInterceptionPatterns = [];
    this._bindings = [];
    this._initScripts = [];
    this._clockPaused = false;
    this._interceptionUrlMatchers = [];
    this.adopt(requestContext);
    this.adopt(tracing);
    this._requestInterceptor = (route, request) => {
      const matchesSome = this._interceptionUrlMatchers.some((urlMatch$1) => urlMatch.urlMatches(this._context._options.baseURL, request.url(), urlMatch$1));
      const routeDispatcher = this.connection.existingDispatcher(route);
      if (!matchesSome || routeDispatcher) {
        route.continue({ isFallback: true }).catch(() => {
        });
        return;
      }
      this._dispatchEvent("route", { route: new networkDispatchers.RouteDispatcher(networkDispatchers.RequestDispatcher.from(this, request), route) });
    };
    this._context = context;
    const onVideo = (artifact) => {
      const artifactDispatcher$1 = artifactDispatcher.ArtifactDispatcher.from(parentScope, artifact);
      this._dispatchEvent("video", { artifact: artifactDispatcher$1 });
    };
    this.addObjectListener(browserContext.BrowserContext.Events.VideoStarted, onVideo);
    for (const video of context._browser._idToVideo.values()) {
      if (video.context === context)
        onVideo(video.artifact);
    }
    for (const page of context.pages())
      this._dispatchEvent("page", { page: pageDispatcher.PageDispatcher.from(this, page) });
    this.addObjectListener(browserContext.BrowserContext.Events.Page, (page) => {
      this._dispatchEvent("page", { page: pageDispatcher.PageDispatcher.from(this, page) });
    });
    this.addObjectListener(browserContext.BrowserContext.Events.Close, () => {
      this._dispatchEvent("close");
      this._dispose();
    });
    this.addObjectListener(browserContext.BrowserContext.Events.PageError, (error, page) => {
      this._dispatchEvent("pageError", { error: errors.serializeError(error), page: pageDispatcher.PageDispatcher.from(this, page) });
    });
    this.addObjectListener(browserContext.BrowserContext.Events.Console, (message) => {
      const page = message.page();
      if (this._shouldDispatchEvent(page, "console")) {
        const pageDispatcher$1 = pageDispatcher.PageDispatcher.from(this, page);
        this._dispatchEvent("console", {
          page: pageDispatcher$1,
          type: message.type(),
          text: message.text(),
          args: message.args().map((a) => {
            const elementHandle = a.asElement();
            if (elementHandle)
              return elementHandlerDispatcher.ElementHandleDispatcher.from(frameDispatcher.FrameDispatcher.from(this, elementHandle._frame), elementHandle);
            return jsHandleDispatcher.JSHandleDispatcher.fromJSHandle(pageDispatcher$1, a);
          }),
          location: message.location()
        });
      }
    });
    this._dialogHandler = (dialog) => {
      if (!this._shouldDispatchEvent(dialog.page(), "dialog"))
        return false;
      this._dispatchEvent("dialog", { dialog: new dialogDispatcher.DialogDispatcher(this, dialog) });
      return true;
    };
    context.dialogManager.addDialogHandler(this._dialogHandler);
    if (context._browser.options.name === "chromium") {
      for (const page of context.backgroundPages())
        this._dispatchEvent("backgroundPage", { page: pageDispatcher.PageDispatcher.from(this, page) });
      this.addObjectListener(crBrowser.CRBrowserContext.CREvents.BackgroundPage, (page) => this._dispatchEvent("backgroundPage", { page: pageDispatcher.PageDispatcher.from(this, page) }));
      for (const serviceWorker of context.serviceWorkers())
        this._dispatchEvent("serviceWorker", { worker: new pageDispatcher.WorkerDispatcher(this, serviceWorker) });
      this.addObjectListener(crBrowser.CRBrowserContext.CREvents.ServiceWorker, (serviceWorker) => this._dispatchEvent("serviceWorker", { worker: new pageDispatcher.WorkerDispatcher(this, serviceWorker) }));
    }
    this.addObjectListener(browserContext.BrowserContext.Events.Request, (request) => {
      const redirectFromDispatcher = request.redirectedFrom() && this.connection.existingDispatcher(request.redirectedFrom());
      if (!redirectFromDispatcher && !this._shouldDispatchNetworkEvent(request, "request") && !request.isNavigationRequest())
        return;
      const requestDispatcher = networkDispatchers.RequestDispatcher.from(this, request);
      this._dispatchEvent("request", {
        request: requestDispatcher,
        page: pageDispatcher.PageDispatcher.fromNullable(this, request.frame()?._page.initializedOrUndefined())
      });
    });
    this.addObjectListener(browserContext.BrowserContext.Events.Response, (response) => {
      const requestDispatcher = this.connection.existingDispatcher(response.request());
      if (!requestDispatcher && !this._shouldDispatchNetworkEvent(response.request(), "response"))
        return;
      this._dispatchEvent("response", {
        response: networkDispatchers.ResponseDispatcher.from(this, response),
        page: pageDispatcher.PageDispatcher.fromNullable(this, response.frame()?._page.initializedOrUndefined())
      });
    });
    this.addObjectListener(browserContext.BrowserContext.Events.RequestFailed, (request) => {
      const requestDispatcher = this.connection.existingDispatcher(request);
      if (!requestDispatcher && !this._shouldDispatchNetworkEvent(request, "requestFailed"))
        return;
      this._dispatchEvent("requestFailed", {
        request: networkDispatchers.RequestDispatcher.from(this, request),
        failureText: request._failureText || void 0,
        responseEndTiming: request._responseEndTiming,
        page: pageDispatcher.PageDispatcher.fromNullable(this, request.frame()?._page.initializedOrUndefined())
      });
    });
    this.addObjectListener(browserContext.BrowserContext.Events.RequestFinished, ({ request, response }) => {
      const requestDispatcher = this.connection.existingDispatcher(request);
      if (!requestDispatcher && !this._shouldDispatchNetworkEvent(request, "requestFinished"))
        return;
      this._dispatchEvent("requestFinished", {
        request: networkDispatchers.RequestDispatcher.from(this, request),
        response: networkDispatchers.ResponseDispatcher.fromNullable(this, response),
        responseEndTiming: request._responseEndTiming,
        page: pageDispatcher.PageDispatcher.fromNullable(this, request.frame()?._page.initializedOrUndefined())
      });
    });
    this.addObjectListener(browserContext.BrowserContext.Events.RecorderEvent, ({ event, data, page }) => {
      this._dispatchEvent("recorderEvent", { event, data, page: pageDispatcher.PageDispatcher.from(this, page) });
    });
  }
  static from(parentScope, context) {
    const result = parentScope.connection.existingDispatcher(context);
    return result || new BrowserContextDispatcher(parentScope, context);
  }
  _shouldDispatchNetworkEvent(request, event) {
    return this._shouldDispatchEvent(request.frame()?._page?.initializedOrUndefined(), event);
  }
  _shouldDispatchEvent(page, event) {
    if (this._subscriptions.has(event))
      return true;
    const pageDispatcher = page ? this.connection.existingDispatcher(page) : void 0;
    if (pageDispatcher?._subscriptions.has(event))
      return true;
    return false;
  }
  async createTempFiles(params, progress) {
    const dir = this._context._browser.options.artifactsDir;
    const tmpDir = path.join(dir, "upload-" + crypto.createGuid());
    const tempDirWithRootName = params.rootDirName ? path.join(tmpDir, path.basename(params.rootDirName)) : tmpDir;
    await progress.race(fs.default.promises.mkdir(tempDirWithRootName, { recursive: true }));
    this._context._tempDirs.push(tmpDir);
    return {
      rootDir: params.rootDirName ? new writableStreamDispatcher.WritableStreamDispatcher(this, tempDirWithRootName) : void 0,
      writableStreams: await Promise.all(params.items.map(async (item) => {
        await progress.race(fs.default.promises.mkdir(path.dirname(path.join(tempDirWithRootName, item.name)), { recursive: true }));
        const file = fs.default.createWriteStream(path.join(tempDirWithRootName, item.name));
        return new writableStreamDispatcher.WritableStreamDispatcher(this, file, item.lastModifiedMs);
      }))
    };
  }
  async exposeBinding(params, progress) {
    const binding = await this._context.exposeBinding(progress, params.name, !!params.needsHandle, (source, ...args) => {
      if (this._disposed)
        return;
      const pageDispatcher$1 = pageDispatcher.PageDispatcher.from(this, source.page);
      const binding2 = new pageDispatcher.BindingCallDispatcher(pageDispatcher$1, params.name, !!params.needsHandle, source, args);
      this._dispatchEvent("bindingCall", { binding: binding2 });
      return binding2.promise();
    });
    this._bindings.push(binding);
  }
  async newPage(params, progress) {
    return { page: pageDispatcher.PageDispatcher.from(this, await this._context.newPage(
      progress,
      false
      /* isServerSide */
    )) };
  }
  async cookies(params, progress) {
    return { cookies: await progress.race(this._context.cookies(params.urls)) };
  }
  async addCookies(params, progress) {
    await this._context.addCookies(params.cookies);
  }
  async clearCookies(params, progress) {
    const nameRe = params.nameRegexSource !== void 0 && params.nameRegexFlags !== void 0 ? new RegExp(params.nameRegexSource, params.nameRegexFlags) : void 0;
    const domainRe = params.domainRegexSource !== void 0 && params.domainRegexFlags !== void 0 ? new RegExp(params.domainRegexSource, params.domainRegexFlags) : void 0;
    const pathRe = params.pathRegexSource !== void 0 && params.pathRegexFlags !== void 0 ? new RegExp(params.pathRegexSource, params.pathRegexFlags) : void 0;
    await this._context.clearCookies({
      name: nameRe || params.name,
      domain: domainRe || params.domain,
      path: pathRe || params.path
    });
  }
  async grantPermissions(params, progress) {
    await this._context.grantPermissions(params.permissions, params.origin);
  }
  async clearPermissions(params, progress) {
    await this._context.clearPermissions();
  }
  async setGeolocation(params, progress) {
    await this._context.setGeolocation(params.geolocation);
  }
  async setExtraHTTPHeaders(params, progress) {
    await this._context.setExtraHTTPHeaders(progress, params.headers);
  }
  async setOffline(params, progress) {
    await this._context.setOffline(progress, params.offline);
  }
  async setHTTPCredentials(params, progress) {
    await progress.race(this._context.setHTTPCredentials(params.httpCredentials));
  }
  async addInitScript(params, progress) {
    this._initScripts.push(await this._context.addInitScript(progress, params.source));
  }
  async setNetworkInterceptionPatterns(params, progress) {
    const hadMatchers = this._interceptionUrlMatchers.length > 0;
    if (!params.patterns.length) {
      if (hadMatchers)
        await this._context.removeRequestInterceptor(this._requestInterceptor);
      this._interceptionUrlMatchers = [];
    } else {
      this._interceptionUrlMatchers = params.patterns.map((pattern) => pattern.regexSource ? new RegExp(pattern.regexSource, pattern.regexFlags) : pattern.glob);
      if (!hadMatchers)
        await this._context.addRequestInterceptor(progress, this._requestInterceptor);
    }
  }
  async setWebSocketInterceptionPatterns(params, progress) {
    this._webSocketInterceptionPatterns = params.patterns;
    if (params.patterns.length && !this._routeWebSocketInitScript)
      this._routeWebSocketInitScript = await webSocketRouteDispatcher.WebSocketRouteDispatcher.install(progress, this.connection, this._context);
  }
  async storageState(params, progress) {
    return await progress.race(this._context.storageState(progress, params.indexedDB));
  }
  async close(params, progress) {
    progress.metadata.potentiallyClosesScope = true;
    await this._context.close(params);
  }
  async enableRecorder(params, progress) {
    const recorder$1 = await recorder.Recorder.forContext(this._context, params);
    if (params.recorderMode === "api") {
      await recorderApp.ProgrammaticRecorderApp.run(this._context, recorder$1);
      return;
    }
    await recorderApp.RecorderApp.show(this._context, params);
  }
  async disableRecorder(params, progress) {
    const recorder$1 = recorder.Recorder.existingForContext(this._context);
    if (recorder$1)
      recorder$1.setMode("none");
  }
  async pause(params, progress) {
  }
  async newCDPSession(params, progress) {
    if (!this._object._browser.options.isChromium)
      throw new Error(`CDP session is only available in Chromium`);
    if (!params.page && !params.frame || params.page && params.frame)
      throw new Error(`CDP session must be initiated with either Page or Frame, not none or both`);
    const crBrowserContext = this._object;
    return { session: new cdpSessionDispatcher.CDPSessionDispatcher(this, await progress.race(crBrowserContext.newCDPSession((params.page ? params.page : params.frame)._object))) };
  }
  async harStart(params, progress) {
    const harId = this._context.harStart(params.page ? params.page._object : null, params.options);
    return { harId };
  }
  async harExport(params, progress) {
    const artifact = await progress.race(this._context.harExport(params.harId));
    if (!artifact)
      throw new Error("No HAR artifact. Ensure record.harPath is set.");
    return { artifact: artifactDispatcher.ArtifactDispatcher.from(this, artifact) };
  }
  async clockFastForward(params, progress) {
    await this._context.clock.fastForward(progress, params.ticksString ?? params.ticksNumber ?? 0);
  }
  async clockInstall(params, progress) {
    await this._context.clock.install(progress, params.timeString ?? params.timeNumber ?? void 0);
  }
  async clockPauseAt(params, progress) {
    await this._context.clock.pauseAt(progress, params.timeString ?? params.timeNumber ?? 0);
    this._clockPaused = true;
  }
  async clockResume(params, progress) {
    await this._context.clock.resume(progress);
    this._clockPaused = false;
  }
  async clockRunFor(params, progress) {
    await this._context.clock.runFor(progress, params.ticksString ?? params.ticksNumber ?? 0);
  }
  async clockSetFixedTime(params, progress) {
    await this._context.clock.setFixedTime(progress, params.timeString ?? params.timeNumber ?? 0);
  }
  async clockSetSystemTime(params, progress) {
    await this._context.clock.setSystemTime(progress, params.timeString ?? params.timeNumber ?? 0);
  }
  async updateSubscription(params, progress) {
    if (params.enabled)
      this._subscriptions.add(params.event);
    else
      this._subscriptions.delete(params.event);
  }
  async registerSelectorEngine(params, progress) {
    this._object.selectors().register(params.selectorEngine);
  }
  async setTestIdAttributeName(params, progress) {
    this._object.selectors().setTestIdAttributeName(params.testIdAttributeName);
  }
  _onDispose() {
    if (this._context.isClosingOrClosed())
      return;
    this._context.dialogManager.removeDialogHandler(this._dialogHandler);
    this._interceptionUrlMatchers = [];
    this._context.removeRequestInterceptor(this._requestInterceptor).catch(() => {
    });
    this._context.removeExposedBindings(this._bindings).catch(() => {
    });
    this._bindings = [];
    this._context.removeInitScripts(this._initScripts).catch(() => {
    });
    this._initScripts = [];
    if (this._routeWebSocketInitScript)
      webSocketRouteDispatcher.WebSocketRouteDispatcher.uninstall(this.connection, this._context, this._routeWebSocketInitScript).catch(() => {
      });
    this._routeWebSocketInitScript = void 0;
    if (this._clockPaused)
      this._context.clock.resumeNoReply();
    this._clockPaused = false;
  }
}

exports.BrowserContextDispatcher = BrowserContextDispatcher;
