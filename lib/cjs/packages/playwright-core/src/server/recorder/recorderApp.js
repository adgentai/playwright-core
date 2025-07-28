'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const empty = require('../../../../../_virtual/empty.js');
const fs = require('../../../../../bundles/fs.js');
const path = require('node:path');
const debug = require('../utils/debug.js');
const utilsBundle = require('../../utilsBundle.js');
const instrumentation = require('../instrumentation.js');
const launchApp = require('../launchApp.js');
const progress = require('../progress.js');
const throttledFile = require('./throttledFile.js');
const languages = require('../codegen/languages.js');
const recorderUtils = require('./recorderUtils.js');
const language = require('../codegen/language.js');
const recorder = require('../recorder.js');
const time = require('../../utils/isomorphic/time.js');
const browserContext = require('../browserContext.js');

class RecorderApp {
  constructor(recorder, params, page, wsEndpointForTest) {
    this._throttledOutputFile = null;
    this._actions = [];
    this._userSources = [];
    this._recorderSources = [];
    this._page = page;
    this._recorder = recorder;
    this.wsEndpointForTest = wsEndpointForTest;
    this._languageGeneratorOptions = {
      browserName: params.browserName,
      launchOptions: { headless: false, ...params.launchOptions, tracesDir: void 0 },
      contextOptions: { ...params.contextOptions },
      deviceName: params.device,
      saveStorage: params.saveStorage
    };
    this._throttledOutputFile = params.outputFile ? new throttledFile.ThrottledFile(params.outputFile) : null;
    this._primaryLanguage = process.env.TEST_INSPECTOR_LANGUAGE || params.language || params.sdkLanguage;
  }
  async _init(inspectedContext) {
    await launchApp.syncLocalStorageWithSettings(this._page, "recorder");
    const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), this._page);
    await controller.run(async (progress) => {
      await this._page.addRequestInterceptor(progress, (route) => {
        if (!route.request().url().startsWith("https://playwright/")) {
          route.continue({ isFallback: true }).catch(() => {
          });
          return;
        }
        const uri = route.request().url().substring("https://playwright/".length);
        const file = require.resolve("../../vite/recorder/" + uri);
        fs.default.promises.readFile(file).then((buffer) => {
          route.fulfill({
            status: 200,
            headers: [
              { name: "Content-Type", value: utilsBundle.mime.getType(path.extname(file)) || "application/octet-stream" }
            ],
            body: buffer.toString("base64"),
            isBase64: true
          }).catch(() => {
          });
        });
      });
      await this._page.exposeBinding(progress, "dispatch", false, (_, data) => this._handleUIEvent(data));
      this._page.once("close", () => {
        this._recorder.close();
        this._page.browserContext.close({ reason: "Recorder window closed" }).catch(() => {
        });
        delete inspectedContext[recorderAppSymbol];
      });
      await this._page.mainFrame().goto(progress, process.env.PW_HMR ? "http://localhost:44225" : "https://playwright/index.html");
    });
    const url = this._recorder.url();
    if (url)
      this._onPageNavigated(url);
    this._onModeChanged(this._recorder.mode());
    this._onPausedStateChanged(this._recorder.paused());
    this._onUserSourcesChanged(this._recorder.userSources());
    this._onCallLogsUpdated(this._recorder.callLog());
    this._wireListeners(this._recorder);
    this._updateActions(true);
  }
  _handleUIEvent(data) {
    if (data.event === "clear") {
      this._actions = [];
      this._updateActions();
      this._recorder.clear();
      return;
    }
    if (data.event === "fileChanged") {
      const source = [...this._recorderSources, ...this._userSources].find((s) => s.id === data.params.fileId);
      if (source)
        this._recorder.setLanguage(source.language);
      return;
    }
    if (data.event === "setMode") {
      this._recorder.setMode(data.params.mode);
      return;
    }
    if (data.event === "resume") {
      this._recorder.resume();
      return;
    }
    if (data.event === "pause") {
      this._recorder.pause();
      return;
    }
    if (data.event === "step") {
      this._recorder.step();
      return;
    }
    if (data.event === "highlightRequested") {
      if (data.params.selector)
        this._recorder.setHighlightedSelector(data.params.selector);
      if (data.params.ariaTemplate)
        this._recorder.setHighlightedAriaTemplate(data.params.ariaTemplate);
      return;
    }
    throw new Error(`Unknown event: ${data.event}`);
  }
  static async show(context, params) {
    if (process.env.PW_CODEGEN_NO_INSPECTOR)
      return;
    const recorder$1 = await recorder.Recorder.forContext(context, params);
    if (params.recorderMode === "api") {
      await ProgrammaticRecorderApp.run(context, recorder$1);
      return;
    }
    await RecorderApp._show(recorder$1, context, params);
  }
  async close() {
    await this._page.close();
  }
  static showInspectorNoReply(context) {
    if (process.env.PW_CODEGEN_NO_INSPECTOR)
      return;
    void recorder.Recorder.forContext(context, {}).then((recorder) => RecorderApp._show(recorder, context, {})).catch(() => {
    });
  }
  static async _show(recorder, inspectedContext, params) {
    if (inspectedContext[recorderAppSymbol])
      return;
    inspectedContext[recorderAppSymbol] = true;
    const sdkLanguage = inspectedContext._browser.sdkLanguage();
    const headed = !!inspectedContext._browser.options.headful;
    const recorderPlaywright = empty.default.createPlaywright({ sdkLanguage: "javascript", isInternalPlaywright: true });
    const { context: appContext, page } = await launchApp.launchApp(recorderPlaywright.chromium, {
      sdkLanguage,
      windowSize: { width: 600, height: 600 },
      windowPosition: { x: 1020, y: 10 },
      persistentContextOptions: {
        noDefaultViewport: true,
        headless: !!process.env.PWTEST_CLI_HEADLESS || debug.isUnderTest() && !headed,
        cdpPort: debug.isUnderTest() ? 0 : void 0,
        handleSIGINT: params.handleSIGINT,
        executablePath: inspectedContext._browser.options.isChromium ? inspectedContext._browser.options.customExecutablePath : void 0,
        // Use the same channel as the inspected context to guarantee that the browser is installed.
        channel: inspectedContext._browser.options.isChromium ? inspectedContext._browser.options.channel : void 0
      }
    });
    const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), appContext._browser);
    await controller.run(async (progress) => {
      await appContext._browser._defaultContext._loadDefaultContextAsIs(progress);
    });
    const appParams = {
      browserName: inspectedContext._browser.options.name,
      sdkLanguage: inspectedContext._browser.sdkLanguage(),
      wsEndpointForTest: inspectedContext._browser.options.wsEndpoint,
      headed: !!inspectedContext._browser.options.headful,
      executablePath: inspectedContext._browser.options.isChromium ? inspectedContext._browser.options.customExecutablePath : void 0,
      channel: inspectedContext._browser.options.isChromium ? inspectedContext._browser.options.channel : void 0,
      ...params
    };
    const recorderApp = new RecorderApp(recorder, appParams, page, appContext._browser.options.wsEndpoint);
    await recorderApp._init(inspectedContext);
    inspectedContext.recorderAppForTest = recorderApp;
  }
  _wireListeners(recorder$1) {
    recorder$1.on(recorder.RecorderEvent.ActionAdded, (action) => {
      this._onActionAdded(action);
    });
    recorder$1.on(recorder.RecorderEvent.SignalAdded, (signal) => {
      this._onSignalAdded(signal);
    });
    recorder$1.on(recorder.RecorderEvent.PageNavigated, (url) => {
      this._onPageNavigated(url);
    });
    recorder$1.on(recorder.RecorderEvent.ContextClosed, () => {
      this._onContextClosed();
    });
    recorder$1.on(recorder.RecorderEvent.ModeChanged, (mode) => {
      this._onModeChanged(mode);
    });
    recorder$1.on(recorder.RecorderEvent.PausedStateChanged, (paused) => {
      this._onPausedStateChanged(paused);
    });
    recorder$1.on(recorder.RecorderEvent.UserSourcesChanged, (sources) => {
      this._onUserSourcesChanged(sources);
    });
    recorder$1.on(recorder.RecorderEvent.ElementPicked, (elementInfo, userGesture) => {
      this._onElementPicked(elementInfo, userGesture);
    });
    recorder$1.on(recorder.RecorderEvent.CallLogsUpdated, (callLogs) => {
      this._onCallLogsUpdated(callLogs);
    });
  }
  _onActionAdded(action) {
    this._actions.push(action);
    this._updateActions();
  }
  _onSignalAdded(signal) {
    const lastAction = this._actions.findLast((a) => a.frame.pageGuid === signal.frame.pageGuid);
    if (lastAction)
      lastAction.action.signals.push(signal.signal);
    this._updateActions();
  }
  _onPageNavigated(url) {
    this._page.mainFrame().evaluateExpression((({ url: url2 }) => {
      window.playwrightSetPageURL(url2);
    }).toString(), { isFunction: true }, { url }).catch(() => {
    });
  }
  _onContextClosed() {
    this._throttledOutputFile?.flush();
    this._page.browserContext.close({ reason: "Recorder window closed" }).catch(() => {
    });
  }
  _onModeChanged(mode) {
    this._page.mainFrame().evaluateExpression(((mode2) => {
      window.playwrightSetMode(mode2);
    }).toString(), { isFunction: true }, mode).catch(() => {
    });
  }
  _onPausedStateChanged(paused) {
    this._page.mainFrame().evaluateExpression(((paused2) => {
      window.playwrightSetPaused(paused2);
    }).toString(), { isFunction: true }, paused).catch(() => {
    });
  }
  _onUserSourcesChanged(sources) {
    if (!sources.length && !this._userSources.length)
      return;
    this._userSources = sources;
    this._pushAllSources();
  }
  _onElementPicked(elementInfo, userGesture) {
    if (userGesture)
      this._page.bringToFront();
    this._page.mainFrame().evaluateExpression(((param) => {
      window.playwrightElementPicked(param.elementInfo, param.userGesture);
    }).toString(), { isFunction: true }, { elementInfo, userGesture }).catch(() => {
    });
  }
  _onCallLogsUpdated(callLogs) {
    this._page.mainFrame().evaluateExpression(((callLogs2) => {
      window.playwrightUpdateLogs(callLogs2);
    }).toString(), { isFunction: true }, callLogs).catch(() => {
    });
  }
  async _pushAllSources() {
    const sources = [...this._userSources, ...this._recorderSources];
    this._page.mainFrame().evaluateExpression((({ sources: sources2 }) => {
      window.playwrightSetSources(sources2);
    }).toString(), { isFunction: true }, { sources }).catch(() => {
    });
    if (process.env.PWTEST_CLI_IS_UNDER_TEST && sources.length) {
      const primarySource = sources.find((s) => s.isPrimary);
      if (process._didSetSourcesForTest(primarySource?.text ?? ""))
        this._page.close().catch(() => {
        });
    }
  }
  _updateActions(initial = false) {
    const timestamp = initial ? 0 : time.monotonicTime();
    const recorderSources = [];
    const actions = recorderUtils.collapseActions(this._actions);
    for (const languageGenerator of languages.languageSet()) {
      const { header, footer, actionTexts, text } = language.generateCode(actions, languageGenerator, this._languageGeneratorOptions);
      const source = {
        isPrimary: languageGenerator.id === this._primaryLanguage,
        timestamp,
        isRecorded: true,
        label: languageGenerator.name,
        group: languageGenerator.groupName,
        id: languageGenerator.id,
        text,
        header,
        footer,
        actions: actionTexts,
        language: languageGenerator.highlighter,
        highlight: []
      };
      source.revealLine = text.split("\n").length - 1;
      recorderSources.push(source);
      if (languageGenerator.id === this._primaryLanguage)
        this._throttledOutputFile?.setContent(source.text);
    }
    this._recorderSources = recorderSources;
    this._pushAllSources();
  }
}
class ProgrammaticRecorderApp {
  static async run(inspectedContext, recorder$1) {
    let lastAction = null;
    recorder$1.on(recorder.RecorderEvent.ActionAdded, (action) => {
      const page = findPageByGuid(inspectedContext, action.frame.pageGuid);
      if (!page)
        return;
      if (!lastAction || !recorderUtils.shouldMergeAction(action, lastAction))
        inspectedContext.emit(browserContext.BrowserContext.Events.RecorderEvent, { event: "actionAdded", data: action, page });
      else
        inspectedContext.emit(browserContext.BrowserContext.Events.RecorderEvent, { event: "actionUpdated", data: action, page });
      lastAction = action;
    });
    recorder$1.on(recorder.RecorderEvent.SignalAdded, (signal) => {
      const page = findPageByGuid(inspectedContext, signal.frame.pageGuid);
      inspectedContext.emit(browserContext.BrowserContext.Events.RecorderEvent, { event: "signalAdded", data: signal, page });
    });
  }
}
function findPageByGuid(context, guid) {
  return context.pages().find((p) => p.guid === guid);
}
const recorderAppSymbol = Symbol("recorderApp");

exports.ProgrammaticRecorderApp = ProgrammaticRecorderApp;
exports.RecorderApp = RecorderApp;
