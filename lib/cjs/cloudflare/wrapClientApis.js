'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const accessibility = require('../packages/playwright-core/src/client/accessibility.js');
const browserContext = require('../packages/playwright-core/src/client/browserContext.js');
require('../packages/playwright-core/src/protocol/validator.js');
const apiCallZone = require('./apiCallZone.js');
const errors = require('../packages/playwright-core/src/client/errors.js');
const browser = require('../packages/playwright-core/src/client/browser.js');
const browserType = require('../packages/playwright-core/src/client/browserType.js');
const cdpSession = require('../packages/playwright-core/src/client/cdpSession.js');
const dialog = require('../packages/playwright-core/src/client/dialog.js');
const consoleMessage = require('../packages/playwright-core/src/client/consoleMessage.js');
const jsHandle = require('../packages/playwright-core/src/client/jsHandle.js');
const elementHandle = require('../packages/playwright-core/src/client/elementHandle.js');
const fetch = require('../packages/playwright-core/src/client/fetch.js');
const frame = require('../packages/playwright-core/src/client/frame.js');
const network = require('../packages/playwright-core/src/client/network.js');
const page = require('../packages/playwright-core/src/client/page.js');
const playwright = require('../packages/playwright-core/src/client/playwright.js');
const tracing = require('../packages/playwright-core/src/client/tracing.js');
const worker = require('../packages/playwright-core/src/client/worker.js');
const coverage = require('../packages/playwright-core/src/client/coverage.js');
const download = require('../packages/playwright-core/src/client/download.js');
const locator = require('../packages/playwright-core/src/client/locator.js');
const fileChooser = require('../packages/playwright-core/src/client/fileChooser.js');
const input = require('../packages/playwright-core/src/client/input.js');
const selectors = require('../packages/playwright-core/src/client/selectors.js');
const video = require('../packages/playwright-core/src/client/video.js');
const webError = require('../packages/playwright-core/src/client/webError.js');

const apis = {
  accessibility: [accessibility.Accessibility.prototype, { snapshot: true }],
  // android: [Android.prototype],
  // androidDevice: [AndroidDevice.prototype],
  // androidWebView: [AndroidWebView.prototype],
  // androidInput: [AndroidInput.prototype],
  // androidSocket: [AndroidSocket.prototype],
  browser: [browser.Browser.prototype, { newContext: true, newPage: true, newBrowserCDPSession: true, startTracing: true, stopTracing: true, close: true }],
  browserContext: [browserContext.BrowserContext.prototype, {
    newPage: true,
    cookies: true,
    addCookies: true,
    clearCookies: true,
    grantPermissions: true,
    clearPermissions: true,
    setGeolocation: true,
    setExtraHTTPHeaders: true,
    setOffline: true,
    setHTTPCredentials: true,
    addInitScript: true,
    exposeBinding: true,
    exposeFunction: true,
    route: true,
    routeFromHAR: true,
    unrouteAll: true,
    unroute: true,
    waitForEvent: true,
    storageState: true,
    newCDPSession: true,
    close: true,
    routeWebSocket: true
  }],
  browserType: [browserType.BrowserType.prototype, { launch: true, launchServer: true, launchPersistentContext: true, connect: true, connectOverCDP: true }],
  // clock: [Clock.prototype, { install: true, fastForward: true, pauseAt: true, resume: true, runFor: true, setFixedTime: true, setSystemTime: true }],
  consoleMessage: [consoleMessage.ConsoleMessage.prototype, {}],
  coverage: [coverage.Coverage.prototype, { startCSSCoverage: true, stopCSSCoverage: true, startJSCoverage: true, stopJSCoverage: true }],
  dialog: [dialog.Dialog.prototype, { accept: true, dismiss: true }],
  download: [download.Download.prototype, { cancel: true, createReadStream: true, path: true, failure: true, delete: true, saveAs: true }],
  // electron: [Electron.prototype, {}],
  // electronApplication: [ElectronApplication.prototype, {}],
  locator: [locator.Locator.prototype, {
    boundingBox: true,
    check: true,
    click: true,
    dblclick: true,
    dispatchEvent: true,
    dragTo: true,
    evaluate: true,
    evaluateAll: true,
    evaluateHandle: true,
    fill: true,
    clear: true,
    highlight: true,
    elementHandle: true,
    elementHandles: true,
    focus: true,
    blur: true,
    count: true,
    getAttribute: true,
    hover: true,
    innerHTML: true,
    innerText: true,
    inputValue: true,
    isChecked: true,
    isDisabled: true,
    isEditable: true,
    isEnabled: true,
    isHidden: true,
    isVisible: true,
    press: true,
    screenshot: true,
    scrollIntoViewIfNeeded: true,
    selectOption: true,
    selectText: true,
    setChecked: true,
    setInputFiles: true,
    tap: true,
    textContent: true,
    type: true,
    pressSequentially: true,
    uncheck: true,
    all: true,
    allInnerTexts: true,
    allTextContents: true,
    waitFor: true,
    ariaSnapshot: true
  }],
  frameLocator: [locator.FrameLocator.prototype, {}],
  elementHandle: [elementHandle.ElementHandle.prototype, {
    // from JSHandle
    evaluate: true,
    evaluateHandle: true,
    getProperty: true,
    getProperties: true,
    jsonValue: true,
    dispose: true,
    // from ElementHandle
    ownerFrame: true,
    contentFrame: true,
    getAttribute: true,
    inputValue: true,
    textContent: true,
    innerText: true,
    innerHTML: true,
    isChecked: true,
    isDisabled: true,
    isEditable: true,
    isEnabled: true,
    isHidden: true,
    isVisible: true,
    dispatchEvent: true,
    scrollIntoViewIfNeeded: true,
    hover: true,
    click: true,
    dblclick: true,
    tap: true,
    selectOption: true,
    fill: true,
    selectText: true,
    setInputFiles: true,
    focus: true,
    type: true,
    press: true,
    check: true,
    uncheck: true,
    setChecked: true,
    boundingBox: true,
    screenshot: true,
    $: true,
    $$: true,
    $eval: true,
    $$eval: true,
    waitForElementState: true,
    waitForSelector: true
  }],
  fileChooser: [fileChooser.FileChooser.prototype, { setFiles: true }],
  timeoutError: [errors.TimeoutError.prototype, {}],
  frame: [frame.Frame.prototype, {
    goto: true,
    waitForNavigation: true,
    waitForLoadState: true,
    waitForURL: true,
    frameElement: true,
    evaluateHandle: true,
    evaluate: true,
    $: true,
    $$: true,
    waitForSelector: true,
    dispatchEvent: true,
    $eval: true,
    $$eval: true,
    content: true,
    setContent: true,
    addScriptTag: true,
    addStyleTag: true,
    click: true,
    dblclick: true,
    dragAndDrop: true,
    tap: true,
    fill: true,
    focus: true,
    textContent: true,
    innerText: true,
    innerHTML: true,
    getAttribute: true,
    inputValue: true,
    isChecked: true,
    isDisabled: true,
    isEditable: true,
    isEnabled: true,
    isHidden: true,
    isVisible: true,
    hover: true,
    selectOption: true,
    setInputFiles: true,
    type: true,
    press: true,
    check: true,
    uncheck: true,
    setChecked: true,
    waitForTimeout: true,
    waitForFunction: true,
    title: true
  }],
  keyboard: [input.Keyboard.prototype, { down: true, up: true, insertText: true, type: true, press: true }],
  mouse: [input.Mouse.prototype, { click: true, dblclick: true, down: true, up: true, move: true, wheel: true }],
  touchscreen: [input.Touchscreen.prototype, { tap: true }],
  jSHandle: [jsHandle.JSHandle.prototype, { evaluate: true, evaluateHandle: true, getProperty: true, jsonValue: true, getProperties: true, dispose: true }],
  route: [network.Route.prototype, { fallback: true, abort: true, fetch: true, fulfill: true, continue: true }],
  webSocket: [network.WebSocket.prototype, { waitForEvent: true }],
  // webSocketRoute: [WebSocketRoute.prototype, { close: true }],
  request: [fetch.APIRequest.prototype, { newContext: true }],
  requestContext: [fetch.APIRequestContext.prototype, { dispose: true, delete: true, head: true, get: true, patch: true, post: true, put: true, fetch: true, storageState: true }],
  response: [fetch.APIResponse.prototype, { body: true, json: true, text: true, dispose: true }],
  page: [page.Page.prototype, {
    opener: true,
    waitForSelector: true,
    dispatchEvent: true,
    evaluateHandle: true,
    $: true,
    $$: true,
    $eval: true,
    $$eval: true,
    addScriptTag: true,
    addStyleTag: true,
    exposeFunction: true,
    exposeBinding: true,
    setExtraHTTPHeaders: true,
    content: true,
    setContent: true,
    goto: true,
    reload: true,
    addLocatorHandler: true,
    waitForLoadState: true,
    waitForNavigation: true,
    waitForURL: true,
    waitForRequest: true,
    waitForResponse: true,
    waitForEvent: true,
    goBack: true,
    goForward: true,
    emulateMedia: true,
    setViewportSize: true,
    evaluate: true,
    addInitScript: true,
    route: true,
    routeFromHAR: true,
    unrouteAll: true,
    unroute: true,
    screenshot: true,
    title: true,
    bringToFront: true,
    close: true,
    click: true,
    dragAndDrop: true,
    dblclick: true,
    tap: true,
    fill: true,
    focus: true,
    textContent: true,
    innerText: true,
    innerHTML: true,
    getAttribute: true,
    inputValue: true,
    isChecked: true,
    isDisabled: true,
    isEditable: true,
    isEnabled: true,
    isHidden: true,
    isVisible: true,
    hover: true,
    selectOption: true,
    setInputFiles: true,
    type: true,
    press: true,
    check: true,
    uncheck: true,
    setChecked: true,
    waitForTimeout: true,
    waitForFunction: true,
    pause: true,
    pdf: true,
    removeLocatorHandler: true,
    requestGC: true,
    routeWebSocket: true
  }],
  selectors: [selectors.Selectors.prototype, { register: true }],
  tracing: [tracing.Tracing.prototype, { start: true, startChunk: true, stop: true, stopChunk: true, group: false, groupEnd: false }],
  video: [video.Video.prototype, { delete: true, path: true, saveAs: true }],
  worker: [worker.Worker.prototype, { evaluate: true, evaluateHandle: true }],
  session: [cdpSession.CDPSession.prototype, { send: true, detach: true }],
  playwright: [playwright.Playwright.prototype, { devices: false }],
  webError: [webError.WebError.prototype, {}]
};
const kApiFunctionWrapped = Symbol("kApiFunctionWrapped");
function wrapClientApis() {
  for (const [typeName, [proto, props]] of Object.entries(apis)) {
    for (const [key, needsWrap] of Object.entries(props)) {
      if (!needsWrap)
        continue;
      const originalFn = proto[key];
      if (!originalFn || typeof originalFn !== "function")
        throw new Error(`Method ${key} not found in ${typeName}`);
      if (originalFn[kApiFunctionWrapped] === true)
        continue;
      const wrapFn = async function(...args) {
        const apiName = apiCallZone.apiCallZone.getStore();
        if (apiName)
          return await originalFn.apply(this, args);
        return await apiCallZone.apiCallZone.run({ apiName: `${typeName}.${key}` }, async () => await originalFn.apply(this, args));
      };
      wrapFn[kApiFunctionWrapped] = true;
      proto[key] = wrapFn;
    }
  }
}

exports.wrapClientApis = wrapClientApis;
