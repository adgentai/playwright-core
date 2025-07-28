'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const socksProxy = require('../utils/socksProxy.js');
const fetch = require('../fetch.js');
const androidDispatcher = require('./androidDispatcher.js');
const browserDispatcher = require('./browserDispatcher.js');
const browserTypeDispatcher = require('./browserTypeDispatcher.js');
const dispatcher = require('./dispatcher.js');
const electronDispatcher = require('./electronDispatcher.js');
const localUtilsDispatcher = require('./localUtilsDispatcher.js');
const networkDispatchers = require('./networkDispatchers.js');
const instrumentation = require('../instrumentation.js');
const eventsHelper = require('../utils/eventsHelper.js');

class PlaywrightDispatcher extends dispatcher.Dispatcher {
  constructor(scope, playwright, options = {}) {
    const denyLaunch = options.denyLaunch ?? false;
    const chromium = new browserTypeDispatcher.BrowserTypeDispatcher(scope, playwright.chromium, denyLaunch);
    const firefox = new browserTypeDispatcher.BrowserTypeDispatcher(scope, playwright.firefox, denyLaunch);
    const webkit = new browserTypeDispatcher.BrowserTypeDispatcher(scope, playwright.webkit, denyLaunch);
    const _bidiChromium = new browserTypeDispatcher.BrowserTypeDispatcher(scope, playwright._bidiChromium, denyLaunch);
    const _bidiFirefox = new browserTypeDispatcher.BrowserTypeDispatcher(scope, playwright._bidiFirefox, denyLaunch);
    const android = new androidDispatcher.AndroidDispatcher(scope, playwright.android, denyLaunch);
    const initializer = {
      chromium,
      firefox,
      webkit,
      _bidiChromium,
      _bidiFirefox,
      android,
      electron: new electronDispatcher.ElectronDispatcher(scope, playwright.electron, denyLaunch),
      utils: playwright.options.isServer ? void 0 : new localUtilsDispatcher.LocalUtilsDispatcher(scope, playwright),
      socksSupport: options.socksProxy ? new SocksSupportDispatcher(scope, playwright, options.socksProxy) : void 0
    };
    let browserDispatcher$1;
    if (options.preLaunchedBrowser) {
      const browserTypeDispatcher = initializer[options.preLaunchedBrowser.options.name];
      browserDispatcher$1 = new browserDispatcher.BrowserDispatcher(browserTypeDispatcher, options.preLaunchedBrowser, {
        ignoreStopAndKill: true,
        isolateContexts: !options.sharedBrowser
      });
      initializer.preLaunchedBrowser = browserDispatcher$1;
    }
    if (options.preLaunchedAndroidDevice)
      initializer.preConnectedAndroidDevice = new androidDispatcher.AndroidDeviceDispatcher(android, options.preLaunchedAndroidDevice);
    super(scope, playwright, "Playwright", initializer);
    this._type_Playwright = true;
    this._browserDispatcher = browserDispatcher$1;
  }
  async newRequest(params, progress) {
    const request = new fetch.GlobalAPIRequestContext(this._object, params);
    return { request: networkDispatchers.APIRequestContextDispatcher.from(this.parentScope(), request) };
  }
  async cleanup() {
    await this._browserDispatcher?.cleanupContexts();
  }
}
class SocksSupportDispatcher extends dispatcher.Dispatcher {
  constructor(scope, parent, socksProxy$1) {
    super(scope, new instrumentation.SdkObject(parent, "socksSupport"), "SocksSupport", {});
    this._type_SocksSupport = true;
    this._socksProxy = socksProxy$1;
    this._socksListeners = [
      eventsHelper.eventsHelper.addEventListener(socksProxy$1, socksProxy.SocksProxy.Events.SocksRequested, (payload) => this._dispatchEvent("socksRequested", payload)),
      eventsHelper.eventsHelper.addEventListener(socksProxy$1, socksProxy.SocksProxy.Events.SocksData, (payload) => this._dispatchEvent("socksData", payload)),
      eventsHelper.eventsHelper.addEventListener(socksProxy$1, socksProxy.SocksProxy.Events.SocksClosed, (payload) => this._dispatchEvent("socksClosed", payload))
    ];
  }
  async socksConnected(params, progress) {
    this._socksProxy?.socketConnected(params);
  }
  async socksFailed(params, progress) {
    this._socksProxy?.socketFailed(params);
  }
  async socksData(params, progress) {
    this._socksProxy?.sendSocketData(params);
  }
  async socksError(params, progress) {
    this._socksProxy?.sendSocketError(params);
  }
  async socksEnd(params, progress) {
    this._socksProxy?.sendSocketEnd(params);
  }
  _onDispose() {
    eventsHelper.eventsHelper.removeEventListeners(this._socksListeners);
  }
}

exports.PlaywrightDispatcher = PlaywrightDispatcher;
