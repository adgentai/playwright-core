'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const accessibility = require('./accessibility.js');
const browserContext = require('./browserContext.js');
const console = require('./console.js');
const errors = require('./errors.js');
const fileChooser = require('./fileChooser.js');
const frames = require('./frames.js');
const helper = require('./helper.js');
const input = require('./input.js');
const instrumentation = require('./instrumentation.js');
const javascript = require('./javascript.js');
const screenshotter = require('./screenshotter.js');
const assert = require('../utils/isomorphic/assert.js');
const locatorGenerators = require('../utils/isomorphic/locatorGenerators.js');
const manualPromise = require('../utils/isomorphic/manualPromise.js');
const protocolFormatter = require('../utils/isomorphic/protocolFormatter.js');
const stringUtils = require('../utils/isomorphic/stringUtils.js');
const comparators = require('./utils/comparators.js');
require('node:crypto');
require('./utils/debug.js');
const debugLogger = require('./utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../zipBundle.js');
require('./utils/hostPlatform.js');
require('../utilsBundle.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./utils/happyEyeballs.js');
require('./utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./utils/profiler.js');
require('./utils/socksProxy.js');
require('node:os');
require('./utils/zones.js');
const cssParser = require('../utils/isomorphic/cssParser.js');
const utilityScriptSerializers = require('../utils/isomorphic/utilityScriptSerializers.js');
const callLog = require('./callLog.js');
const bindingsControllerSource = require('../generated/bindingsControllerSource.js');

class Page extends instrumentation.SdkObject {
  constructor(delegate, browserContext) {
    super(browserContext, "page");
    this._closedState = "open";
    this._closedPromise = new manualPromise.ManualPromise();
    this._initializedPromise = new manualPromise.ManualPromise();
    this._eventsToEmitAfterInitialized = [];
    this._crashed = false;
    this.openScope = new manualPromise.LongStandingScope();
    this._emulatedMedia = {};
    this._fileChooserInterceptedBy = /* @__PURE__ */ new Set();
    this._pageBindings = /* @__PURE__ */ new Map();
    this.initScripts = [];
    this._workers = /* @__PURE__ */ new Map();
    this.requestInterceptors = [];
    this.video = null;
    this._isServerSideOnly = false;
    this._locatorHandlers = /* @__PURE__ */ new Map();
    this._lastLocatorHandlerUid = 0;
    this._locatorHandlerRunningCounter = 0;
    // Aiming at 25 fps by default - each frame is 40ms, but we give some slack with 35ms.
    // When throttling for tracing, 200ms between frames, except for 10 frames around the action.
    this._frameThrottler = new FrameThrottler(10, 35, 200);
    this.lastSnapshotFrameIds = [];
    this.attribution.page = this;
    this.delegate = delegate;
    this.browserContext = browserContext;
    this.accessibility = new accessibility.Accessibility(delegate.getAccessibilityTree.bind(delegate));
    this.keyboard = new input.Keyboard(delegate.rawKeyboard, this);
    this.mouse = new input.Mouse(delegate.rawMouse, this);
    this.touchscreen = new input.Touchscreen(delegate.rawTouchscreen, this);
    this.screenshotter = new screenshotter.Screenshotter(this);
    this.frameManager = new frames.FrameManager(this);
    if (delegate.pdf)
      this.pdf = delegate.pdf.bind(delegate);
    this.coverage = delegate.coverage ? delegate.coverage() : null;
  }
  static {
    this.Events = {
      Close: "close",
      Crash: "crash",
      Download: "download",
      EmulatedSizeChanged: "emulatedsizechanged",
      FileChooser: "filechooser",
      FrameAttached: "frameattached",
      FrameDetached: "framedetached",
      InternalFrameNavigatedToNewDocument: "internalframenavigatedtonewdocument",
      LocatorHandlerTriggered: "locatorhandlertriggered",
      ScreencastFrame: "screencastframe",
      Video: "video",
      WebSocket: "websocket",
      Worker: "worker"
    };
  }
  async reportAsNew(opener, error = void 0, contextEvent = browserContext.BrowserContext.Events.Page) {
    if (opener) {
      const openerPageOrError = await opener.waitForInitializedOrError();
      if (openerPageOrError instanceof Page && !openerPageOrError.isClosed())
        this._opener = openerPageOrError;
    }
    this._markInitialized(error, contextEvent);
  }
  _markInitialized(error = void 0, contextEvent = browserContext.BrowserContext.Events.Page) {
    if (error) {
      if (this.browserContext.isClosingOrClosed())
        return;
      this.frameManager.createDummyMainFrameIfNeeded();
    }
    this._initialized = error || this;
    this.emitOnContext(contextEvent, this);
    for (const { event, args } of this._eventsToEmitAfterInitialized)
      this.browserContext.emit(event, ...args);
    this._eventsToEmitAfterInitialized = [];
    if (this.isClosed())
      this.emit(Page.Events.Close);
    else
      this.instrumentation.onPageOpen(this);
    this._initializedPromise.resolve(this._initialized);
  }
  initializedOrUndefined() {
    return this._initialized ? this : void 0;
  }
  waitForInitializedOrError() {
    return this._initializedPromise;
  }
  emitOnContext(event, ...args) {
    if (this._isServerSideOnly)
      return;
    this.browserContext.emit(event, ...args);
  }
  emitOnContextOnceInitialized(event, ...args) {
    if (this._isServerSideOnly)
      return;
    if (this._initialized)
      this.browserContext.emit(event, ...args);
    else
      this._eventsToEmitAfterInitialized.push({ event, args });
  }
  async resetForReuse(progress) {
    await this.mainFrame().gotoImpl(progress, "about:blank", {});
    this._emulatedSize = void 0;
    this._emulatedMedia = {};
    this._extraHTTPHeaders = void 0;
    await Promise.all([
      this.delegate.updateEmulatedViewportSize(),
      this.delegate.updateEmulateMedia(),
      this.delegate.updateExtraHTTPHeaders()
    ]);
    await this.delegate.resetForReuse(progress);
  }
  _didClose() {
    this.frameManager.dispose();
    this._frameThrottler.dispose();
    assert.assert(this._closedState !== "closed", "Page closed twice");
    this._closedState = "closed";
    this.emit(Page.Events.Close);
    this._closedPromise.resolve();
    this.instrumentation.onPageClose(this);
    this.openScope.close(new errors.TargetClosedError());
  }
  _didCrash() {
    this.frameManager.dispose();
    this._frameThrottler.dispose();
    this.emit(Page.Events.Crash);
    this._crashed = true;
    this.instrumentation.onPageClose(this);
    this.openScope.close(new Error("Page crashed"));
  }
  async _onFileChooserOpened(handle) {
    let multiple;
    try {
      multiple = await handle.evaluate((element) => !!element.multiple);
    } catch (e) {
      return;
    }
    if (!this.listenerCount(Page.Events.FileChooser)) {
      handle.dispose();
      return;
    }
    const fileChooser$1 = new fileChooser.FileChooser(this, handle, multiple);
    this.emit(Page.Events.FileChooser, fileChooser$1);
  }
  opener() {
    return this._opener;
  }
  mainFrame() {
    return this.frameManager.mainFrame();
  }
  frames() {
    return this.frameManager.frames();
  }
  async exposeBinding(progress, name, needsHandle, playwrightBinding) {
    if (this._pageBindings.has(name))
      throw new Error(`Function "${name}" has been already registered`);
    if (this.browserContext._pageBindings.has(name))
      throw new Error(`Function "${name}" has been already registered in the browser context`);
    await progress.race(this.browserContext.exposePlaywrightBindingIfNeeded());
    const binding = new PageBinding(name, playwrightBinding, needsHandle);
    this._pageBindings.set(name, binding);
    progress.cleanupWhenAborted(() => this._pageBindings.delete(name));
    await progress.race(this.delegate.addInitScript(binding.initScript));
    await progress.race(this.safeNonStallingEvaluateInAllFrames(binding.initScript.source, "main"));
    return binding;
  }
  async removeExposedBindings(bindings) {
    bindings = bindings.filter((binding) => this._pageBindings.get(binding.name) === binding);
    for (const binding of bindings)
      this._pageBindings.delete(binding.name);
    await this.delegate.removeInitScripts(bindings.map((binding) => binding.initScript));
    const cleanup = bindings.map((binding) => `{ ${binding.cleanupScript} };
`).join("");
    await this.safeNonStallingEvaluateInAllFrames(cleanup, "main");
  }
  async setExtraHTTPHeaders(progress, headers) {
    const oldHeaders = this._extraHTTPHeaders;
    this._extraHTTPHeaders = headers;
    progress.cleanupWhenAborted(async () => {
      this._extraHTTPHeaders = oldHeaders;
      await this.delegate.updateExtraHTTPHeaders();
    });
    await progress.race(this.delegate.updateExtraHTTPHeaders());
  }
  extraHTTPHeaders() {
    return this._extraHTTPHeaders;
  }
  async onBindingCalled(payload, context) {
    if (this._closedState === "closed")
      return;
    await PageBinding.dispatch(this, payload, context);
  }
  addConsoleMessage(type, args, location, text) {
    const message = new console.ConsoleMessage(this, type, text, args, location);
    const intercepted = this.frameManager.interceptConsoleMessage(message);
    if (intercepted) {
      args.forEach((arg) => arg.dispose());
      return;
    }
    this.emitOnContextOnceInitialized(browserContext.BrowserContext.Events.Console, message);
  }
  async reload(progress, options) {
    return this.mainFrame().raceNavigationAction(progress, async () => {
      const [response] = await Promise.all([
        // Reload must be a new document, and should not be confused with a stray pushState.
        this.mainFrame()._waitForNavigation(progress, true, options),
        progress.race(this.delegate.reload())
      ]);
      return response;
    });
  }
  async goBack(progress, options) {
    return this.mainFrame().raceNavigationAction(progress, async () => {
      let error;
      const waitPromise = this.mainFrame()._waitForNavigation(progress, false, options).catch((e) => {
        error = e;
        return null;
      });
      const result = await progress.race(this.delegate.goBack());
      if (!result) {
        waitPromise.catch(() => {
        });
        return null;
      }
      const response = await waitPromise;
      if (error)
        throw error;
      return response;
    });
  }
  async goForward(progress, options) {
    return this.mainFrame().raceNavigationAction(progress, async () => {
      let error;
      const waitPromise = this.mainFrame()._waitForNavigation(progress, false, options).catch((e) => {
        error = e;
        return null;
      });
      const result = await progress.race(this.delegate.goForward());
      if (!result) {
        waitPromise.catch(() => {
        });
        return null;
      }
      const response = await waitPromise;
      if (error)
        throw error;
      return response;
    });
  }
  requestGC() {
    return this.delegate.requestGC();
  }
  registerLocatorHandler(selector, noWaitAfter) {
    const uid = ++this._lastLocatorHandlerUid;
    this._locatorHandlers.set(uid, { selector, noWaitAfter });
    return uid;
  }
  resolveLocatorHandler(uid, remove) {
    const handler = this._locatorHandlers.get(uid);
    if (remove)
      this._locatorHandlers.delete(uid);
    if (handler) {
      handler.resolved?.resolve();
      handler.resolved = void 0;
    }
  }
  unregisterLocatorHandler(uid) {
    this._locatorHandlers.delete(uid);
  }
  async performActionPreChecks(progress) {
    await this._performWaitForNavigationCheck(progress);
    await this._performLocatorHandlersCheckpoint(progress);
    await this._performWaitForNavigationCheck(progress);
  }
  async _performWaitForNavigationCheck(progress) {
    const mainFrame = this.frameManager.mainFrame();
    if (!mainFrame || !mainFrame.pendingDocument())
      return;
    const url = mainFrame.pendingDocument()?.request?.url();
    const toUrl = url ? `" ${stringUtils.trimStringWithEllipsis(url, 200)}"` : "";
    progress.log(`  waiting for${toUrl} navigation to finish...`);
    await helper.helper.waitForEvent(progress, mainFrame, frames.Frame.Events.InternalNavigation, (e) => {
      if (!e.isPublic)
        return false;
      if (!e.error)
        progress.log(`  navigated to "${stringUtils.trimStringWithEllipsis(mainFrame.url(), 200)}"`);
      return true;
    }).promise;
  }
  async _performLocatorHandlersCheckpoint(progress) {
    if (this._locatorHandlerRunningCounter)
      return;
    for (const [uid, handler] of this._locatorHandlers) {
      if (!handler.resolved) {
        if (await this.mainFrame().isVisibleInternal(progress, handler.selector, { strict: true })) {
          handler.resolved = new manualPromise.ManualPromise();
          this.emit(Page.Events.LocatorHandlerTriggered, uid);
        }
      }
      if (handler.resolved) {
        ++this._locatorHandlerRunningCounter;
        progress.log(`  found ${locatorGenerators.asLocator(this.browserContext._browser.sdkLanguage(), handler.selector)}, intercepting action to run the handler`);
        const promise = handler.resolved.then(async () => {
          if (!handler.noWaitAfter) {
            progress.log(`  locator handler has finished, waiting for ${locatorGenerators.asLocator(this.browserContext._browser.sdkLanguage(), handler.selector)} to be hidden`);
            await this.mainFrame().waitForSelector(progress, handler.selector, false, { state: "hidden" });
          } else {
            progress.log(`  locator handler has finished`);
          }
        });
        await progress.race(this.openScope.race(promise)).finally(() => --this._locatorHandlerRunningCounter);
        progress.log(`  interception handler has finished, continuing`);
      }
    }
  }
  async emulateMedia(progress, options) {
    const oldEmulatedMedia = { ...this._emulatedMedia };
    progress.cleanupWhenAborted(async () => {
      this._emulatedMedia = oldEmulatedMedia;
      await this.delegate.updateEmulateMedia();
    });
    if (options.media !== void 0)
      this._emulatedMedia.media = options.media;
    if (options.colorScheme !== void 0)
      this._emulatedMedia.colorScheme = options.colorScheme;
    if (options.reducedMotion !== void 0)
      this._emulatedMedia.reducedMotion = options.reducedMotion;
    if (options.forcedColors !== void 0)
      this._emulatedMedia.forcedColors = options.forcedColors;
    if (options.contrast !== void 0)
      this._emulatedMedia.contrast = options.contrast;
    await progress.race(this.delegate.updateEmulateMedia());
  }
  emulatedMedia() {
    const contextOptions = this.browserContext._options;
    return {
      media: this._emulatedMedia.media || "no-override",
      colorScheme: this._emulatedMedia.colorScheme !== void 0 ? this._emulatedMedia.colorScheme : contextOptions.colorScheme ?? "light",
      reducedMotion: this._emulatedMedia.reducedMotion !== void 0 ? this._emulatedMedia.reducedMotion : contextOptions.reducedMotion ?? "no-preference",
      forcedColors: this._emulatedMedia.forcedColors !== void 0 ? this._emulatedMedia.forcedColors : contextOptions.forcedColors ?? "none",
      contrast: this._emulatedMedia.contrast !== void 0 ? this._emulatedMedia.contrast : contextOptions.contrast ?? "no-preference"
    };
  }
  async setViewportSize(progress, viewportSize) {
    const oldEmulatedSize = this._emulatedSize;
    progress.cleanupWhenAborted(async () => {
      this._emulatedSize = oldEmulatedSize;
      await this.delegate.updateEmulatedViewportSize();
    });
    this._setEmulatedSize({ viewport: { ...viewportSize }, screen: { ...viewportSize } });
    await progress.race(this.delegate.updateEmulatedViewportSize());
  }
  setEmulatedSizeFromWindowOpen(emulatedSize) {
    this._setEmulatedSize(emulatedSize);
  }
  _setEmulatedSize(emulatedSize) {
    this._emulatedSize = emulatedSize;
    this.emit(Page.Events.EmulatedSizeChanged);
  }
  emulatedSize() {
    if (this._emulatedSize)
      return this._emulatedSize;
    const contextOptions = this.browserContext._options;
    return contextOptions.viewport ? { viewport: contextOptions.viewport, screen: contextOptions.screen || contextOptions.viewport } : void 0;
  }
  async bringToFront() {
    await this.delegate.bringToFront();
  }
  async addInitScript(progress, source) {
    const initScript = new InitScript(source);
    this.initScripts.push(initScript);
    progress.cleanupWhenAborted(() => this.removeInitScripts([initScript]));
    await progress.race(this.delegate.addInitScript(initScript));
    return initScript;
  }
  async removeInitScripts(initScripts) {
    const set = new Set(initScripts);
    this.initScripts = this.initScripts.filter((script) => !set.has(script));
    await this.delegate.removeInitScripts(initScripts);
  }
  needsRequestInterception() {
    return this.requestInterceptors.length > 0 || this.browserContext.requestInterceptors.length > 0;
  }
  async addRequestInterceptor(progress, handler, prepend) {
    if (prepend)
      this.requestInterceptors.unshift(handler);
    else
      this.requestInterceptors.push(handler);
    await this.delegate.updateRequestInterception();
  }
  async removeRequestInterceptor(handler) {
    const index = this.requestInterceptors.indexOf(handler);
    if (index === -1)
      return;
    this.requestInterceptors.splice(index, 1);
    await this.browserContext.notifyRoutesInFlightAboutRemovedHandler(handler);
    await this.delegate.updateRequestInterception();
  }
  async expectScreenshot(progress, options) {
    const locator = options.locator;
    const rafrafScreenshot = locator ? async (timeout) => {
      return await locator.frame.rafrafTimeoutScreenshotElementWithProgress(progress, locator.selector, timeout, options || {});
    } : async (timeout) => {
      await this.performActionPreChecks(progress);
      await this.mainFrame().rafrafTimeout(progress, timeout);
      return await this.screenshotter.screenshotPage(progress, options || {});
    };
    const comparator = comparators.getComparator("image/png");
    if (!options.expected && options.isNot)
      return { errorMessage: '"not" matcher requires expected result' };
    try {
      const format = screenshotter.validateScreenshotOptions(options || {});
      if (format !== "png")
        throw new Error("Only PNG screenshots are supported");
    } catch (error) {
      return { errorMessage: error.message };
    }
    let intermediateResult;
    const areEqualScreenshots = (actual, expected, previous) => {
      const comparatorResult = actual && expected ? comparator(actual, expected, options) : void 0;
      if (comparatorResult !== void 0 && !!comparatorResult === !!options.isNot)
        return true;
      if (comparatorResult)
        intermediateResult = { errorMessage: comparatorResult.errorMessage, diff: comparatorResult.diff, actual, previous };
      return false;
    };
    const handleError = (e) => {
      if (javascript.isJavaScriptErrorInEvaluate(e) || cssParser.isInvalidSelectorError(e))
        throw e;
      let errorMessage = e.message;
      if (e instanceof errors.TimeoutError && intermediateResult?.previous)
        errorMessage = `Failed to take two consecutive stable screenshots.`;
      return {
        log: callLog.compressCallLog(e.message ? [...progress.metadata.log, e.message] : progress.metadata.log),
        ...intermediateResult,
        errorMessage,
        timedOut: e instanceof errors.TimeoutError
      };
    };
    progress.legacySetErrorHandler(handleError);
    try {
      let actual;
      let previous;
      const pollIntervals = [0, 100, 250, 500];
      progress.log(`${protocolFormatter.renderTitleForCall(progress.metadata)}${options.timeout ? ` with timeout ${options.timeout}ms` : ""}`);
      if (options.expected)
        progress.log(`  verifying given screenshot expectation`);
      else
        progress.log(`  generating new stable screenshot expectation`);
      let isFirstIteration = true;
      while (true) {
        if (this.isClosed())
          throw new Error("The page has closed");
        const screenshotTimeout = pollIntervals.shift() ?? 1e3;
        if (screenshotTimeout)
          progress.log(`waiting ${screenshotTimeout}ms before taking screenshot`);
        previous = actual;
        actual = await rafrafScreenshot(screenshotTimeout).catch((e) => {
          if (this.mainFrame().isNonRetriableError(e))
            throw e;
          progress.log(`failed to take screenshot - ` + e.message);
          return void 0;
        });
        if (!actual)
          continue;
        const expectation = options.expected && isFirstIteration ? options.expected : previous;
        if (areEqualScreenshots(actual, expectation, previous))
          break;
        if (intermediateResult)
          progress.log(intermediateResult.errorMessage);
        isFirstIteration = false;
      }
      if (!isFirstIteration)
        progress.log(`captured a stable screenshot`);
      if (!options.expected)
        return { actual };
      if (isFirstIteration) {
        progress.log(`screenshot matched expectation`);
        return {};
      }
      if (areEqualScreenshots(actual, options.expected, void 0)) {
        progress.log(`screenshot matched expectation`);
        return {};
      }
      throw new Error(intermediateResult.errorMessage);
    } catch (e) {
      return handleError(e);
    }
  }
  async screenshot(progress, options) {
    return await this.screenshotter.screenshotPage(progress, options);
  }
  async close(options = {}) {
    if (this._closedState === "closed")
      return;
    if (options.reason)
      this.closeReason = options.reason;
    const runBeforeUnload = !!options.runBeforeUnload;
    if (this._closedState !== "closing") {
      this._closedState = "closing";
      await this.delegate.closePage(runBeforeUnload).catch((e) => debugLogger.debugLogger.log("error", e));
    }
    if (!runBeforeUnload)
      await this._closedPromise;
  }
  isClosed() {
    return this._closedState === "closed";
  }
  hasCrashed() {
    return this._crashed;
  }
  isClosedOrClosingOrCrashed() {
    return this._closedState !== "open" || this._crashed;
  }
  addWorker(workerId, worker) {
    this._workers.set(workerId, worker);
    this.emit(Page.Events.Worker, worker);
  }
  removeWorker(workerId) {
    const worker = this._workers.get(workerId);
    if (!worker)
      return;
    worker.didClose();
    this._workers.delete(workerId);
  }
  clearWorkers() {
    for (const [workerId, worker] of this._workers) {
      worker.didClose();
      this._workers.delete(workerId);
    }
  }
  async setFileChooserInterceptedBy(enabled, by) {
    const wasIntercepted = this.fileChooserIntercepted();
    if (enabled)
      this._fileChooserInterceptedBy.add(by);
    else
      this._fileChooserInterceptedBy.delete(by);
    if (wasIntercepted !== this.fileChooserIntercepted())
      await this.delegate.updateFileChooserInterception();
  }
  fileChooserIntercepted() {
    return this._fileChooserInterceptedBy.size > 0;
  }
  frameNavigatedToNewDocument(frame) {
    this.emit(Page.Events.InternalFrameNavigatedToNewDocument, frame);
    const origin = frame.origin();
    if (origin)
      this.browserContext.addVisitedOrigin(origin);
  }
  allInitScripts() {
    const bindings = [...this.browserContext._pageBindings.values(), ...this._pageBindings.values()].map((binding) => binding.initScript);
    if (this.browserContext.bindingsInitScript)
      bindings.unshift(this.browserContext.bindingsInitScript);
    return [...bindings, ...this.browserContext.initScripts, ...this.initScripts];
  }
  getBinding(name) {
    return this._pageBindings.get(name) || this.browserContext._pageBindings.get(name);
  }
  setScreencastOptions(options) {
    this.delegate.setScreencastOptions(options).catch((e) => debugLogger.debugLogger.log("error", e));
    this._frameThrottler.setThrottlingEnabled(!!options);
  }
  throttleScreencastFrameAck(ack) {
    this._frameThrottler.ack(ack);
  }
  temporarilyDisableTracingScreencastThrottling() {
    this._frameThrottler.recharge();
  }
  async safeNonStallingEvaluateInAllFrames(expression, world, options = {}) {
    await Promise.all(this.frames().map(async (frame) => {
      try {
        await frame.nonStallingEvaluateInExistingContext(expression, world);
      } catch (e) {
        if (options.throwOnJSErrors && javascript.isJavaScriptErrorInEvaluate(e))
          throw e;
      }
    }));
  }
  async hideHighlight() {
    await Promise.all(this.frames().map((frame) => frame.hideHighlight().catch(() => {
    })));
  }
  markAsServerSideOnly() {
    this._isServerSideOnly = true;
  }
  async snapshotForAI(progress) {
    this.lastSnapshotFrameIds = [];
    const snapshot = await snapshotFrameForAI(progress, this.mainFrame(), 0, this.lastSnapshotFrameIds);
    return snapshot.join("\n");
  }
}
class Worker extends instrumentation.SdkObject {
  constructor(parent, url) {
    super(parent, "worker");
    this.existingExecutionContext = null;
    this.openScope = new manualPromise.LongStandingScope();
    this.url = url;
    this._executionContextCallback = () => {
    };
    this._executionContextPromise = new Promise((x) => this._executionContextCallback = x);
  }
  static {
    this.Events = {
      Close: "close"
    };
  }
  createExecutionContext(delegate) {
    this.existingExecutionContext = new javascript.ExecutionContext(this, delegate, "worker");
    this._executionContextCallback(this.existingExecutionContext);
    return this.existingExecutionContext;
  }
  didClose() {
    if (this.existingExecutionContext)
      this.existingExecutionContext.contextDestroyed("Worker was closed");
    this.emit(Worker.Events.Close, this);
    this.openScope.close(new Error("Worker closed"));
  }
  async evaluateExpression(expression, isFunction, arg) {
    return javascript.evaluateExpression(await this._executionContextPromise, expression, { returnByValue: true, isFunction }, arg);
  }
  async evaluateExpressionHandle(expression, isFunction, arg) {
    return javascript.evaluateExpression(await this._executionContextPromise, expression, { returnByValue: false, isFunction }, arg);
  }
}
class PageBinding {
  static {
    this.kController = "__playwright__binding__controller__";
  }
  static {
    this.kBindingName = "__playwright__binding__";
  }
  static createInitScript() {
    return new InitScript(`
      (() => {
        const module = {};
        ${bindingsControllerSource.source}
        const property = '${PageBinding.kController}';
        if (!globalThis[property])
          globalThis[property] = new (module.exports.BindingsController())(globalThis, '${PageBinding.kBindingName}');
      })();
    `);
  }
  constructor(name, playwrightFunction, needsHandle) {
    this.name = name;
    this.playwrightFunction = playwrightFunction;
    this.initScript = new InitScript(`globalThis['${PageBinding.kController}'].addBinding(${JSON.stringify(name)}, ${needsHandle})`);
    this.needsHandle = needsHandle;
    this.cleanupScript = `globalThis['${PageBinding.kController}'].removeBinding(${JSON.stringify(name)})`;
  }
  static async dispatch(page, payload, context) {
    const { name, seq, serializedArgs } = JSON.parse(payload);
    try {
      assert.assert(context.world);
      const binding = page.getBinding(name);
      if (!binding)
        throw new Error(`Function "${name}" is not exposed`);
      let result;
      if (binding.needsHandle) {
        const handle = await context.evaluateExpressionHandle(`arg => globalThis['${PageBinding.kController}'].takeBindingHandle(arg)`, { isFunction: true }, { name, seq }).catch((e) => null);
        result = await binding.playwrightFunction({ frame: context.frame, page, context: page.browserContext }, handle);
      } else {
        if (!Array.isArray(serializedArgs))
          throw new Error(`serializedArgs is not an array. This can happen when Array.prototype.toJSON is defined incorrectly`);
        const args = serializedArgs.map((a) => utilityScriptSerializers.parseEvaluationResultValue(a));
        result = await binding.playwrightFunction({ frame: context.frame, page, context: page.browserContext }, ...args);
      }
      context.evaluateExpressionHandle(`arg => globalThis['${PageBinding.kController}'].deliverBindingResult(arg)`, { isFunction: true }, { name, seq, result }).catch((e) => debugLogger.debugLogger.log("error", e));
    } catch (error) {
      context.evaluateExpressionHandle(`arg => globalThis['${PageBinding.kController}'].deliverBindingResult(arg)`, { isFunction: true }, { name, seq, error }).catch((e) => debugLogger.debugLogger.log("error", e));
    }
  }
}
class InitScript {
  constructor(source) {
    this.source = `(() => {
      ${source}
    })();`;
  }
}
class FrameThrottler {
  constructor(nonThrottledFrames, defaultInterval, throttlingInterval) {
    this._acks = [];
    this._throttlingEnabled = false;
    this._nonThrottledFrames = nonThrottledFrames;
    this._budget = nonThrottledFrames;
    this._defaultInterval = defaultInterval;
    this._throttlingInterval = throttlingInterval;
    this._tick();
  }
  dispose() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = void 0;
    }
  }
  setThrottlingEnabled(enabled) {
    this._throttlingEnabled = enabled;
  }
  recharge() {
    for (const ack of this._acks)
      ack();
    this._acks = [];
    this._budget = this._nonThrottledFrames;
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._tick();
    }
  }
  ack(ack) {
    if (!this._timeoutId) {
      ack();
      return;
    }
    this._acks.push(ack);
  }
  _tick() {
    const ack = this._acks.shift();
    if (ack) {
      --this._budget;
      ack();
    }
    if (this._throttlingEnabled && this._budget <= 0) {
      this._timeoutId = setTimeout(() => this._tick(), this._throttlingInterval);
    } else {
      this._timeoutId = setTimeout(() => this._tick(), this._defaultInterval);
    }
  }
}
async function snapshotFrameForAI(progress, frame, frameOrdinal, frameIds) {
  const snapshot = await frame.retryWithProgressAndTimeouts(progress, [1e3, 2e3, 4e3, 8e3], async (continuePolling) => {
    try {
      const context = await progress.race(frame._utilityContext());
      const injectedScript = await progress.race(context.injectedScript());
      const snapshotOrRetry = await progress.race(injectedScript.evaluate((injected, refPrefix) => {
        const node = injected.document.body;
        if (!node)
          return true;
        return injected.ariaSnapshot(node, { forAI: true, refPrefix });
      }, frameOrdinal ? "f" + frameOrdinal : ""));
      if (snapshotOrRetry === true)
        return continuePolling;
      return snapshotOrRetry;
    } catch (e) {
      if (frame.isNonRetriableError(e))
        throw e;
      return continuePolling;
    }
  });
  const lines = snapshot.split("\n");
  const result = [];
  for (const line of lines) {
    const match = line.match(/^(\s*)- iframe (?:\[active\] )?\[ref=(.*)\]/);
    if (!match) {
      result.push(line);
      continue;
    }
    const leadingSpace = match[1];
    const ref = match[2];
    const frameSelector = `aria-ref=${ref} >> internal:control=enter-frame`;
    const frameBodySelector = `${frameSelector} >> body`;
    const child = await progress.race(frame.selectors.resolveFrameForSelector(frameBodySelector, { strict: true }));
    if (!child) {
      result.push(line);
      continue;
    }
    const frameOrdinal2 = frameIds.length + 1;
    frameIds.push(child.frame._id);
    try {
      const childSnapshot = await snapshotFrameForAI(progress, child.frame, frameOrdinal2, frameIds);
      result.push(line + ":", ...childSnapshot.map((l) => leadingSpace + "  " + l));
    } catch {
      result.push(line);
    }
  }
  return result;
}

exports.InitScript = InitScript;
exports.Page = Page;
exports.PageBinding = PageBinding;
exports.Worker = Worker;
