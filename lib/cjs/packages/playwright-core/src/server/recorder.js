'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const require$$0$3 = require('node:events');
const fs = require('../../../../bundles/fs.js');
const selectorParser = require('../utils/isomorphic/selectorParser.js');
const time = require('../utils/isomorphic/time.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
const debug = require('./utils/debug.js');
require('./utils/debugLogger.js');
const eventsHelper = require('./utils/eventsHelper.js');
require('node:path');
require('../zipBundle.js');
require('./utils/hostPlatform.js');
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
const browserContext = require('./browserContext.js');
const _debugger = require('./debugger.js');
const recorderUtils = require('./recorder/recorderUtils.js');
const locatorParser = require('../utils/isomorphic/locatorParser.js');
const progress = require('./progress.js');
const instrumentation = require('./instrumentation.js');
const recorderSignalProcessor = require('./recorder/recorderSignalProcessor.js');
const pollingRecorderSource = require('../generated/pollingRecorderSource.js');
const frames = require('./frames.js');
const page = require('./page.js');
const recorderRunner = require('./recorder/recorderRunner.js');

const recorderSymbol = Symbol("recorderSymbol");
const RecorderEvent = {
  PausedStateChanged: "pausedStateChanged",
  ModeChanged: "modeChanged",
  ElementPicked: "elementPicked",
  CallLogsUpdated: "callLogsUpdated",
  UserSourcesChanged: "userSourcesChanged",
  ActionAdded: "actionAdded",
  SignalAdded: "signalAdded",
  PageNavigated: "pageNavigated",
  ContextClosed: "contextClosed"
};
class Recorder extends require$$0$3 {
  constructor(context, params) {
    super();
    this._highlightedElement = {};
    this._overlayState = { offsetX: 0 };
    this._currentCallsMetadata = /* @__PURE__ */ new Map();
    this._userSources = /* @__PURE__ */ new Map();
    this._omitCallTracking = false;
    this._currentLanguage = "javascript";
    this._pageAliases = /* @__PURE__ */ new Map();
    this._lastPopupOrdinal = 0;
    this._lastDialogOrdinal = -1;
    this._lastDownloadOrdinal = -1;
    this._listeners = [];
    this._enabled = false;
    this._callLogs = [];
    this._context = context;
    this._params = params;
    this._mode = params.mode || "none";
    this._recorderMode = params.recorderMode ?? "default";
    this.handleSIGINT = params.handleSIGINT;
    this._signalProcessor = new recorderSignalProcessor.RecorderSignalProcessor({
      addAction: (actionInContext) => {
        if (this._enabled)
          this.emit(RecorderEvent.ActionAdded, actionInContext);
      },
      addSignal: (signal) => {
        if (this._enabled)
          this.emit(RecorderEvent.SignalAdded, signal);
      }
    });
    context.on(browserContext.BrowserContext.Events.BeforeClose, () => {
      this.emit(RecorderEvent.ContextClosed);
    });
    this._listeners.push(eventsHelper.eventsHelper.addEventListener(process, "exit", () => {
      this.emit(RecorderEvent.ContextClosed);
    }));
    this._setEnabled(params.mode === "recording");
    this._omitCallTracking = !!params.omitCallTracking;
    this._debugger = context.debugger();
    context.instrumentation.addListener(this, context);
    if (debug.isUnderTest()) {
      this._overlayState.offsetX = 200;
    }
  }
  static forContext(context, params) {
    let recorderPromise = context[recorderSymbol];
    if (!recorderPromise) {
      recorderPromise = Recorder._create(context, params);
      context[recorderSymbol] = recorderPromise;
    }
    return recorderPromise;
  }
  static existingForContext(context) {
    return context[recorderSymbol];
  }
  static async _create(context, params = {}) {
    const recorder = new Recorder(context, params);
    await recorder._install();
    return recorder;
  }
  async _install() {
    this.emit(RecorderEvent.ModeChanged, this._mode);
    this.emit(RecorderEvent.PausedStateChanged, this._debugger.isPaused());
    this._context.once(browserContext.BrowserContext.Events.Close, () => {
      eventsHelper.eventsHelper.removeEventListeners(this._listeners);
      this._context.instrumentation.removeListener(this);
      this.emit(RecorderEvent.ContextClosed);
    });
    const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), this._context);
    await controller.run(async (progress) => {
      await this._context.exposeBinding(progress, "__pw_recorderState", false, async (source) => {
        let actionSelector;
        let actionPoint;
        const hasActiveScreenshotCommand = [...this._currentCallsMetadata.keys()].some(isScreenshotCommand);
        if (!hasActiveScreenshotCommand) {
          actionSelector = await this._scopeHighlightedSelectorToFrame(source.frame);
          for (const [metadata, sdkObject] of this._currentCallsMetadata) {
            if (source.page === sdkObject.attribution.page) {
              actionPoint = metadata.point || actionPoint;
              actionSelector = actionSelector || metadata.params.selector;
            }
          }
        }
        const uiState = {
          mode: this._mode,
          actionPoint,
          actionSelector,
          ariaTemplate: this._highlightedElement.ariaTemplate,
          language: this._currentLanguage,
          testIdAttributeName: this._testIdAttributeName(),
          overlay: this._overlayState
        };
        return uiState;
      });
      await this._context.exposeBinding(progress, "__pw_recorderElementPicked", false, async ({ frame }, elementInfo) => {
        const selectorChain = await recorderUtils.generateFrameSelector(frame);
        this.emit(RecorderEvent.ElementPicked, { selector: recorderUtils.buildFullSelector(selectorChain, elementInfo.selector), ariaSnapshot: elementInfo.ariaSnapshot }, true);
      });
      await this._context.exposeBinding(progress, "__pw_recorderSetMode", false, async ({ frame }, mode) => {
        if (frame.parentFrame())
          return;
        this.setMode(mode);
      });
      await this._context.exposeBinding(progress, "__pw_recorderSetOverlayState", false, async ({ frame }, state) => {
        if (frame.parentFrame())
          return;
        this._overlayState = state;
      });
      await this._context.exposeBinding(progress, "__pw_resume", false, () => {
        this._debugger.resume(false);
      });
      this._context.on(browserContext.BrowserContext.Events.Page, (page) => this._onPage(page));
      for (const page of this._context.pages())
        this._onPage(page);
      this._context.dialogManager.addDialogHandler((dialog) => {
        this._onDialog(dialog.page());
        return false;
      });
      await this._context.exposeBinding(
        progress,
        "__pw_recorderPerformAction",
        false,
        (source, action) => this._performAction(source.frame, action)
      );
      await this._context.exposeBinding(
        progress,
        "__pw_recorderRecordAction",
        false,
        (source, action) => this._recordAction(source.frame, action)
      );
      await this._context.extendInjectedScript(pollingRecorderSource.source, { recorderMode: this._recorderMode });
    });
    if (this._debugger.isPaused())
      this._pausedStateChanged();
    this._debugger.on(_debugger.Debugger.Events.PausedStateChanged, () => this._pausedStateChanged());
  }
  _pausedStateChanged() {
    for (const { metadata, sdkObject } of this._debugger.pausedDetails()) {
      if (!this._currentCallsMetadata.has(metadata))
        this.onBeforeCall(sdkObject, metadata);
    }
    this.emit(RecorderEvent.PausedStateChanged, this._debugger.isPaused());
    this._updateUserSources();
    this.updateCallLog([...this._currentCallsMetadata.keys()]);
  }
  mode() {
    return this._mode;
  }
  setMode(mode) {
    if (this._mode === mode)
      return;
    this._highlightedElement = {};
    this._mode = mode;
    this.emit(RecorderEvent.ModeChanged, this._mode);
    this._setEnabled(this._isRecording());
    this._debugger.setMuted(this._isRecording());
    if (this._mode !== "none" && this._mode !== "standby" && this._context.pages().length === 1)
      this._context.pages()[0].bringToFront().catch(() => {
      });
    this._refreshOverlay();
  }
  url() {
    const page = this._context.pages()[0];
    return page?.mainFrame().url();
  }
  setHighlightedSelector(selector) {
    this._highlightedElement = { selector: locatorParser.locatorOrSelectorAsSelector(this._currentLanguage, selector, this._context.selectors().testIdAttributeName()) };
    this._refreshOverlay();
  }
  setHighlightedAriaTemplate(ariaTemplate) {
    this._highlightedElement = { ariaTemplate };
    this._refreshOverlay();
  }
  step() {
    this._debugger.resume(true);
  }
  setLanguage(language) {
    this._currentLanguage = language;
    this._refreshOverlay();
  }
  resume() {
    this._debugger.resume(false);
  }
  pause() {
    this._debugger.pauseOnNextStatement();
  }
  paused() {
    return this._debugger.isPaused();
  }
  close() {
    this._debugger.resume(false);
  }
  hideHighlightedSelector() {
    this._highlightedElement = {};
    this._refreshOverlay();
  }
  userSources() {
    return [...this._userSources.values()];
  }
  callLog() {
    return this._callLogs;
  }
  async _scopeHighlightedSelectorToFrame(frame) {
    if (!this._highlightedElement.selector)
      return;
    try {
      const mainFrame = frame._page.mainFrame();
      const resolved = await mainFrame.selectors.resolveFrameForSelector(this._highlightedElement.selector);
      if (!resolved)
        return "";
      if (resolved?.frame === mainFrame)
        return selectorParser.stringifySelector(resolved.info.parsed);
      if (resolved?.frame === frame)
        return selectorParser.stringifySelector(resolved.info.parsed);
      return "";
    } catch {
      return "";
    }
  }
  _refreshOverlay() {
    for (const page of this._context.pages()) {
      for (const frame of page.frames())
        frame.evaluateExpression("window.__pw_refreshOverlay()").catch(() => {
        });
    }
  }
  async onBeforeCall(sdkObject, metadata) {
    if (this._omitCallTracking || this._isRecording())
      return;
    this._currentCallsMetadata.set(metadata, sdkObject);
    this._updateUserSources();
    this.updateCallLog([metadata]);
    if (isScreenshotCommand(metadata))
      this.hideHighlightedSelector();
    else if (metadata.params && metadata.params.selector)
      this._highlightedElement = { selector: metadata.params.selector };
  }
  async onAfterCall(sdkObject, metadata) {
    if (this._omitCallTracking || this._isRecording())
      return;
    if (!metadata.error)
      this._currentCallsMetadata.delete(metadata);
    this._updateUserSources();
    this.updateCallLog([metadata]);
  }
  _updateUserSources() {
    const timestamp = time.monotonicTime();
    for (const source of this._userSources.values()) {
      source.highlight = [];
      source.revealLine = void 0;
    }
    for (const metadata of this._currentCallsMetadata.keys()) {
      if (!metadata.location)
        continue;
      const { file, line } = metadata.location;
      let source = this._userSources.get(file);
      if (!source) {
        source = { isPrimary: false, isRecorded: false, label: file, id: file, text: this._readSource(file), highlight: [], language: languageForFile(file), timestamp };
        this._userSources.set(file, source);
      }
      if (line) {
        const paused = this._debugger.isPaused(metadata);
        source.highlight.push({ line, type: metadata.error ? "error" : paused ? "paused" : "running" });
        source.revealLine = line;
      }
    }
    this.emit(RecorderEvent.UserSourcesChanged, this.userSources());
  }
  async onBeforeInputAction(sdkObject, metadata) {
  }
  async onCallLog(sdkObject, metadata, logName, message) {
    this.updateCallLog([metadata]);
  }
  updateCallLog(metadatas) {
    if (this._isRecording())
      return;
    const logs = [];
    for (const metadata of metadatas) {
      if (!metadata.method || metadata.internal)
        continue;
      let status = "done";
      if (this._currentCallsMetadata.has(metadata))
        status = "in-progress";
      if (this._debugger.isPaused(metadata))
        status = "paused";
      logs.push(recorderUtils.metadataToCallLog(metadata, status));
    }
    this._callLogs = logs;
    this.emit(RecorderEvent.CallLogsUpdated, logs);
  }
  _isRecording() {
    return ["recording", "assertingText", "assertingVisibility", "assertingValue", "assertingSnapshot"].includes(this._mode);
  }
  _readSource(fileName) {
    try {
      return fs.default.readFileSync(fileName, "utf-8");
    } catch (e) {
      return "// No source available";
    }
  }
  _setEnabled(enabled) {
    this._enabled = enabled;
  }
  async _onPage(page$1) {
    const frame = page$1.mainFrame();
    page$1.on(page.Page.Events.Close, () => {
      this._signalProcessor.addAction({
        frame: this._describeMainFrame(page$1),
        action: {
          name: "closePage",
          signals: []
        },
        startTime: time.monotonicTime()
      });
      this._pageAliases.delete(page$1);
      this._filePrimaryURLChanged();
    });
    frame.on(frames.Frame.Events.InternalNavigation, (event) => {
      if (event.isPublic) {
        this._onFrameNavigated(frame, page$1);
        this._filePrimaryURLChanged();
      }
    });
    page$1.on(page.Page.Events.Download, () => this._onDownload(page$1));
    const suffix = this._pageAliases.size ? String(++this._lastPopupOrdinal) : "";
    const pageAlias = "page" + suffix;
    this._pageAliases.set(page$1, pageAlias);
    if (page$1.opener()) {
      this._onPopup(page$1.opener(), page$1);
    } else {
      this._signalProcessor.addAction({
        frame: this._describeMainFrame(page$1),
        action: {
          name: "openPage",
          url: page$1.mainFrame().url(),
          signals: []
        },
        startTime: time.monotonicTime()
      });
    }
    this._filePrimaryURLChanged();
  }
  _filePrimaryURLChanged() {
    const page = this._context.pages()[0];
    this.emit(RecorderEvent.PageNavigated, page?.mainFrame().url());
  }
  clear() {
    if (this._params.mode === "recording") {
      for (const page of this._context.pages())
        this._onFrameNavigated(page.mainFrame(), page);
    }
  }
  _describeMainFrame(page) {
    return {
      pageGuid: page.guid,
      pageAlias: this._pageAliases.get(page),
      framePath: []
    };
  }
  async _describeFrame(frame) {
    return {
      pageGuid: frame._page.guid,
      pageAlias: this._pageAliases.get(frame._page),
      framePath: await recorderUtils.generateFrameSelector(frame)
    };
  }
  _testIdAttributeName() {
    return this._params.testIdAttributeName || this._context.selectors().testIdAttributeName() || "data-testid";
  }
  async _createActionInContext(frame, action) {
    const frameDescription = await this._describeFrame(frame);
    const actionInContext = {
      frame: frameDescription,
      action,
      description: void 0,
      startTime: time.monotonicTime()
    };
    return actionInContext;
  }
  async _performAction(frame, action) {
    const actionInContext = await this._createActionInContext(frame, action);
    this._signalProcessor.addAction(actionInContext);
    if (actionInContext.action.name !== "openPage" && actionInContext.action.name !== "closePage")
      await recorderRunner.performAction(this._pageAliases, actionInContext);
    actionInContext.endTime = time.monotonicTime();
  }
  async _recordAction(frame, action) {
    this._signalProcessor.addAction(await this._createActionInContext(frame, action));
  }
  _onFrameNavigated(frame, page) {
    const pageAlias = this._pageAliases.get(page);
    this._signalProcessor.signal(pageAlias, frame, { name: "navigation", url: frame.url() });
  }
  _onPopup(page, popup) {
    const pageAlias = this._pageAliases.get(page);
    const popupAlias = this._pageAliases.get(popup);
    this._signalProcessor.signal(pageAlias, page.mainFrame(), { name: "popup", popupAlias });
  }
  _onDownload(page) {
    const pageAlias = this._pageAliases.get(page);
    ++this._lastDownloadOrdinal;
    this._signalProcessor.signal(pageAlias, page.mainFrame(), { name: "download", downloadAlias: this._lastDownloadOrdinal ? String(this._lastDownloadOrdinal) : "" });
  }
  _onDialog(page) {
    const pageAlias = this._pageAliases.get(page);
    ++this._lastDialogOrdinal;
    this._signalProcessor.signal(pageAlias, page.mainFrame(), { name: "dialog", dialogAlias: this._lastDialogOrdinal ? String(this._lastDialogOrdinal) : "" });
  }
}
function isScreenshotCommand(metadata) {
  return metadata.method.toLowerCase().includes("screenshot");
}
function languageForFile(file) {
  if (file.endsWith(".py"))
    return "python";
  if (file.endsWith(".java"))
    return "java";
  if (file.endsWith(".cs"))
    return "csharp";
  return "javascript";
}

exports.Recorder = Recorder;
exports.RecorderEvent = RecorderEvent;
