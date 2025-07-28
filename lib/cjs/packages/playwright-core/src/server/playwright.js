'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
require('./utils/debug.js');
const debugLogger = require('./utils/debugLogger.js');
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
require('node:child_process');
require('node:readline');
require('./utils/profiler.js');
require('./utils/socksProxy.js');
require('node:os');
require('./utils/zones.js');
const android = require('./android/android.js');
const backendAdb = require('./android/backendAdb.js');
const bidiChromium = require('./bidi/bidiChromium.js');
const bidiFirefox = require('./bidi/bidiFirefox.js');
const chromium = require('./chromium/chromium.js');
const debugController = require('./debugController.js');
const electron = require('./electron/electron.js');
const firefox = require('./firefox/firefox.js');
const instrumentation = require('./instrumentation.js');
const webkit = require('./webkit/webkit.js');

class Playwright extends instrumentation.SdkObject {
  constructor(options) {
    super(instrumentation.createRootSdkObject(), void 0, "Playwright");
    this._allPages = /* @__PURE__ */ new Set();
    this._allBrowsers = /* @__PURE__ */ new Set();
    this.options = options;
    this.attribution.playwright = this;
    this.instrumentation.addListener({
      onBrowserOpen: (browser) => this._allBrowsers.add(browser),
      onBrowserClose: (browser) => this._allBrowsers.delete(browser),
      onPageOpen: (page) => this._allPages.add(page),
      onPageClose: (page) => this._allPages.delete(page),
      onCallLog: (sdkObject, metadata, logName, message) => {
        debugLogger.debugLogger.log(logName, message);
      }
    }, null);
    this.chromium = new chromium.Chromium(this);
    this._bidiChromium = new bidiChromium.BidiChromium(this);
    this._bidiFirefox = new bidiFirefox.BidiFirefox(this);
    this.firefox = new firefox.Firefox(this);
    this.webkit = new webkit.WebKit(this);
    this.electron = new electron.Electron(this);
    this.android = new android.Android(this, new backendAdb.AdbBackend());
    this.debugController = new debugController.DebugController(this);
  }
  async hideHighlight() {
    await Promise.all([...this._allPages].map((p) => p.hideHighlight().catch(() => {
    })));
  }
  allBrowsers() {
    return [...this._allBrowsers];
  }
  allPages() {
    return [...this._allPages];
  }
}
function createPlaywright(options) {
  return new Playwright(options);
}

exports.Playwright = Playwright;
exports.createPlaywright = createPlaywright;
