'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const android = require('./android.js');
const browser = require('./browser.js');
const browserType = require('./browserType.js');
const channelOwner = require('./channelOwner.js');
const electron = require('./electron.js');
const errors = require('./errors.js');
const fetch = require('./fetch.js');
const selectors = require('./selectors.js');

class Playwright extends channelOwner.ChannelOwner {
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    this.request = new fetch.APIRequest(this);
    this.chromium = browserType.BrowserType.from(initializer.chromium);
    this.chromium._playwright = this;
    this.firefox = browserType.BrowserType.from(initializer.firefox);
    this.firefox._playwright = this;
    this.webkit = browserType.BrowserType.from(initializer.webkit);
    this.webkit._playwright = this;
    this._android = android.Android.from(initializer.android);
    this._android._playwright = this;
    this._electron = electron.Electron.from(initializer.electron);
    this._electron._playwright = this;
    this._bidiChromium = browserType.BrowserType.from(initializer._bidiChromium);
    this._bidiChromium._playwright = this;
    this._bidiFirefox = browserType.BrowserType.from(initializer._bidiFirefox);
    this._bidiFirefox._playwright = this;
    this.devices = this._connection.localUtils()?.devices ?? {};
    this.selectors = new selectors.Selectors(this._connection._platform);
    this.errors = { TimeoutError: errors.TimeoutError };
  }
  static from(channel) {
    return channel._object;
  }
  _browserTypes() {
    return [this.chromium, this.firefox, this.webkit, this._bidiChromium, this._bidiFirefox];
  }
  _preLaunchedBrowser() {
    const browser$1 = browser.Browser.from(this._initializer.preLaunchedBrowser);
    browser$1._connectToBrowserType(this[browser$1._name], {}, void 0);
    return browser$1;
  }
  _allContexts() {
    return this._browserTypes().flatMap((type) => [...type._contexts]);
  }
  _allPages() {
    return this._allContexts().flatMap((context) => context.pages());
  }
}

exports.Playwright = Playwright;
