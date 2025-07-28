'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const browser = require('../browser.js');
const browserContextDispatcher = require('./browserContextDispatcher.js');
const cdpSessionDispatcher = require('./cdpSessionDispatcher.js');
const dispatcher = require('./dispatcher.js');
const browserContext = require('../browserContext.js');
const artifactDispatcher = require('./artifactDispatcher.js');

class BrowserDispatcher extends dispatcher.Dispatcher {
  constructor(scope, browser$1, options = {}) {
    super(scope, browser$1, "Browser", { version: browser$1.version(), name: browser$1.options.name });
    this._type_Browser = true;
    this._isolatedContexts = /* @__PURE__ */ new Set();
    this._options = options;
    if (!options.isolateContexts) {
      this.addObjectListener(browser.Browser.Events.Context, (context) => this._dispatchEvent("context", { context: browserContextDispatcher.BrowserContextDispatcher.from(this, context) }));
      this.addObjectListener(browser.Browser.Events.Disconnected, () => this._didClose());
      if (browser$1._defaultContext)
        this._dispatchEvent("context", { context: browserContextDispatcher.BrowserContextDispatcher.from(this, browser$1._defaultContext) });
      for (const context of browser$1.contexts())
        this._dispatchEvent("context", { context: browserContextDispatcher.BrowserContextDispatcher.from(this, context) });
    }
  }
  _didClose() {
    this._dispatchEvent("close");
    this._dispose();
  }
  async newContext(params, progress) {
    if (!this._options.isolateContexts) {
      const context2 = await this._object.newContext(progress, params);
      const contextDispatcher2 = browserContextDispatcher.BrowserContextDispatcher.from(this, context2);
      return { context: contextDispatcher2 };
    }
    if (params.recordVideo)
      params.recordVideo.dir = this._object.options.artifactsDir;
    const context = await this._object.newContext(progress, params);
    this._isolatedContexts.add(context);
    context.on(browserContext.BrowserContext.Events.Close, () => this._isolatedContexts.delete(context));
    const contextDispatcher = browserContextDispatcher.BrowserContextDispatcher.from(this, context);
    this._dispatchEvent("context", { context: contextDispatcher });
    return { context: contextDispatcher };
  }
  async newContextForReuse(params, progress) {
    const context = await this._object.newContextForReuse(progress, params);
    const contextDispatcher = browserContextDispatcher.BrowserContextDispatcher.from(this, context);
    this._dispatchEvent("context", { context: contextDispatcher });
    return { context: contextDispatcher };
  }
  async disconnectFromReusedContext(params, progress) {
    const context = this._object.contextForReuse();
    const contextDispatcher = context ? this.connection.existingDispatcher(context) : void 0;
    if (contextDispatcher) {
      await contextDispatcher.stopPendingOperations(new Error(params.reason));
      contextDispatcher._dispose();
    }
  }
  async close(params, progress) {
    if (this._options.ignoreStopAndKill)
      return;
    progress.metadata.potentiallyClosesScope = true;
    await this._object.close(params);
  }
  async killForTests(params, progress) {
    if (this._options.ignoreStopAndKill)
      return;
    progress.metadata.potentiallyClosesScope = true;
    await this._object.killForTests();
  }
  async defaultUserAgentForTest() {
    return { userAgent: this._object.userAgent() };
  }
  async newBrowserCDPSession(params, progress) {
    if (!this._object.options.isChromium)
      throw new Error(`CDP session is only available in Chromium`);
    const crBrowser = this._object;
    return { session: new cdpSessionDispatcher.CDPSessionDispatcher(this, await crBrowser.newBrowserCDPSession()) };
  }
  async startTracing(params, progress) {
    if (!this._object.options.isChromium)
      throw new Error(`Tracing is only available in Chromium`);
    const crBrowser = this._object;
    await crBrowser.startTracing(params.page ? params.page._object : void 0, params);
  }
  async stopTracing(params, progress) {
    if (!this._object.options.isChromium)
      throw new Error(`Tracing is only available in Chromium`);
    const crBrowser = this._object;
    return { artifact: artifactDispatcher.ArtifactDispatcher.from(this, await crBrowser.stopTracing()) };
  }
  async cleanupContexts() {
    await Promise.all(Array.from(this._isolatedContexts).map((context) => context.close({ reason: "Global context cleanup (connection terminated)" })));
  }
}

exports.BrowserDispatcher = BrowserDispatcher;
