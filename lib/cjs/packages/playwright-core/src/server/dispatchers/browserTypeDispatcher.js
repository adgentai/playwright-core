'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const browserContextDispatcher = require('./browserContextDispatcher.js');
const browserDispatcher = require('./browserDispatcher.js');
const dispatcher = require('./dispatcher.js');

class BrowserTypeDispatcher extends dispatcher.Dispatcher {
  constructor(scope, browserType, denyLaunch) {
    super(scope, browserType, "BrowserType", {
      executablePath: browserType.executablePath(),
      name: browserType.name()
    });
    this._type_BrowserType = true;
    this._denyLaunch = denyLaunch;
  }
  async launch(params, progress) {
    if (this._denyLaunch)
      throw new Error(`Launching more browsers is not allowed.`);
    const browser = await this._object.launch(progress, params);
    return { browser: new browserDispatcher.BrowserDispatcher(this, browser) };
  }
  async launchPersistentContext(params, progress) {
    if (this._denyLaunch)
      throw new Error(`Launching more browsers is not allowed.`);
    const browserContext = await this._object.launchPersistentContext(progress, params.userDataDir, params);
    const browserDispatcher$1 = new browserDispatcher.BrowserDispatcher(this, browserContext._browser);
    const contextDispatcher = browserContextDispatcher.BrowserContextDispatcher.from(browserDispatcher$1, browserContext);
    return { browser: browserDispatcher$1, context: contextDispatcher };
  }
  async connectOverCDP(params, progress) {
    if (this._denyLaunch)
      throw new Error(`Launching more browsers is not allowed.`);
    const browser = await this._object.connectOverCDP(progress, params.endpointURL, params);
    const browserDispatcher$1 = new browserDispatcher.BrowserDispatcher(this, browser);
    return {
      browser: browserDispatcher$1,
      defaultContext: browser._defaultContext ? browserContextDispatcher.BrowserContextDispatcher.from(browserDispatcher$1, browser._defaultContext) : void 0
    };
  }
}

exports.BrowserTypeDispatcher = BrowserTypeDispatcher;
