'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const instrumentation = require('./instrumentation.js');
const processLauncher = require('./utils/processLauncher.js');
const recorder = require('./recorder.js');
const locatorGenerators = require('../utils/isomorphic/locatorGenerators.js');
require('../../../../_virtual/pixelmatch.js');
const utilsBundle = require('../utilsBundle.js');
require('node:crypto');
require('./utils/debug.js');
require('./utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../zipBundle.js');
require('./utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./utils/happyEyeballs.js');
require('./utils/nodePlatform.js');
require('./utils/profiler.js');
require('./utils/socksProxy.js');
require('node:child_process');
require('node:os');
require('./utils/zones.js');
const ariaSnapshot = require('../utils/isomorphic/ariaSnapshot.js');
const locatorParser = require('../utils/isomorphic/locatorParser.js');
const language = require('./codegen/language.js');
const recorderUtils = require('./recorder/recorderUtils.js');
const javascript = require('./codegen/javascript.js');

class DebugController extends instrumentation.SdkObject {
  constructor(playwright) {
    super({ attribution: { isInternalPlaywright: true }, instrumentation: instrumentation.createInstrumentation() }, void 0, "DebugController");
    this._sdkLanguage = "javascript";
    this._playwright = playwright;
  }
  static {
    this.Events = {
      StateChanged: "stateChanged",
      InspectRequested: "inspectRequested",
      SourceChanged: "sourceChanged",
      Paused: "paused",
      SetModeRequested: "setModeRequested"
    };
  }
  initialize(codegenId, sdkLanguage) {
    this._sdkLanguage = sdkLanguage;
  }
  dispose() {
    this.setReportStateChanged(false);
  }
  setReportStateChanged(enabled) {
    if (enabled && !this._trackHierarchyListener) {
      this._trackHierarchyListener = {
        onPageOpen: () => this._emitSnapshot(false),
        onPageClose: () => this._emitSnapshot(false)
      };
      this._playwright.instrumentation.addListener(this._trackHierarchyListener, null);
      this._emitSnapshot(true);
    } else if (!enabled && this._trackHierarchyListener) {
      this._playwright.instrumentation.removeListener(this._trackHierarchyListener);
      this._trackHierarchyListener = void 0;
    }
  }
  async resetForReuse(progress) {
    const contexts = /* @__PURE__ */ new Set();
    for (const page of this._playwright.allPages())
      contexts.add(page.browserContext);
    for (const context of contexts)
      await context.resetForReuse(progress, null);
  }
  async navigate(progress, url) {
    for (const p of this._playwright.allPages())
      await p.mainFrame().goto(progress, url);
  }
  async setRecorderMode(progress, params) {
    await progress.race(this._closeBrowsersWithoutPages());
    if (params.mode === "none") {
      for (const recorder of await progress.race(this._allRecorders())) {
        recorder.hideHighlightedSelector();
        recorder.setMode("none");
      }
      return;
    }
    if (!this._playwright.allBrowsers().length)
      await this._playwright.chromium.launch(progress, { headless: !!process.env.PW_DEBUG_CONTROLLER_HEADLESS });
    const pages = this._playwright.allPages();
    if (!pages.length) {
      const [browser] = this._playwright.allBrowsers();
      const context = await browser.newContextForReuse(progress, {});
      await context.newPage(
        progress,
        false
        /* isServerSide */
      );
    }
    if (params.testIdAttributeName) {
      for (const page of this._playwright.allPages())
        page.browserContext.selectors().setTestIdAttributeName(params.testIdAttributeName);
    }
    for (const recorder of await progress.race(this._allRecorders())) {
      recorder.hideHighlightedSelector();
      recorder.setMode(params.mode);
    }
  }
  async highlight(progress, params) {
    if (params.selector)
      locatorParser.unsafeLocatorOrSelectorAsSelector(this._sdkLanguage, params.selector, "data-testid");
    const ariaTemplate = params.ariaTemplate ? ariaSnapshot.parseAriaSnapshotUnsafe(utilsBundle.yaml, params.ariaTemplate) : void 0;
    for (const recorder of await progress.race(this._allRecorders())) {
      if (ariaTemplate)
        recorder.setHighlightedAriaTemplate(ariaTemplate);
      else if (params.selector)
        recorder.setHighlightedSelector(params.selector);
    }
  }
  async hideHighlight(progress) {
    for (const recorder of await progress.race(this._allRecorders()))
      recorder.hideHighlightedSelector();
    await this._playwright.hideHighlight();
  }
  allBrowsers() {
    return [...this._playwright.allBrowsers()];
  }
  async resume(progress) {
    for (const recorder of await progress.race(this._allRecorders()))
      recorder.resume();
  }
  kill() {
    processLauncher.gracefullyProcessExitDoNotHang(0);
  }
  async closeAllBrowsers() {
    await Promise.all(this.allBrowsers().map((browser) => browser.close({ reason: "Close all browsers requested" })));
  }
  _emitSnapshot(initial) {
    const pageCount = this._playwright.allPages().length;
    if (initial && !pageCount)
      return;
    this.emit(DebugController.Events.StateChanged, { pageCount });
  }
  async _allRecorders() {
    const contexts = /* @__PURE__ */ new Set();
    for (const page of this._playwright.allPages())
      contexts.add(page.browserContext);
    const recorders = await Promise.all([...contexts].map((c) => recorder.Recorder.forContext(c, { omitCallTracking: true })));
    const nonNullRecorders = recorders.filter(Boolean);
    for (const recorder of recorders)
      wireListeners(recorder, this);
    return nonNullRecorders;
  }
  async _closeBrowsersWithoutPages() {
    for (const browser of this._playwright.allBrowsers()) {
      for (const context of browser.contexts()) {
        if (!context.pages().length)
          await context.close({ reason: "Browser collected" });
      }
      if (!browser.contexts())
        await browser.close({ reason: "Browser collected" });
    }
  }
}
const wiredSymbol = Symbol("wired");
function wireListeners(recorder$1, debugController) {
  if (recorder$1[wiredSymbol])
    return;
  recorder$1[wiredSymbol] = true;
  const actions = [];
  const languageGenerator = new javascript.JavaScriptLanguageGenerator(
    /* isPlaywrightTest */
    true
  );
  const actionsChanged = () => {
    const aa = recorderUtils.collapseActions(actions);
    const { header, footer, text, actionTexts } = language.generateCode(aa, languageGenerator, {
      browserName: "chromium",
      launchOptions: {},
      contextOptions: {}
    });
    debugController.emit(DebugController.Events.SourceChanged, { text, header, footer, actions: actionTexts });
  };
  recorder$1.on(recorder.RecorderEvent.ElementPicked, (elementInfo) => {
    const locator = locatorGenerators.asLocator(debugController._sdkLanguage, elementInfo.selector);
    debugController.emit(DebugController.Events.InspectRequested, { selector: elementInfo.selector, locator, ariaSnapshot: elementInfo.ariaSnapshot });
  });
  recorder$1.on(recorder.RecorderEvent.PausedStateChanged, (paused) => {
    debugController.emit(DebugController.Events.Paused, { paused });
  });
  recorder$1.on(recorder.RecorderEvent.ModeChanged, (mode) => {
    debugController.emit(DebugController.Events.SetModeRequested, { mode });
  });
  recorder$1.on(recorder.RecorderEvent.ActionAdded, (action) => {
    actions.push(action);
    actionsChanged();
  });
  recorder$1.on(recorder.RecorderEvent.SignalAdded, (signal) => {
    const lastAction = actions.findLast((a) => a.frame.pageGuid === signal.frame.pageGuid);
    if (lastAction)
      lastAction.action.signals.push(signal.signal);
    actionsChanged();
  });
}

exports.DebugController = DebugController;
