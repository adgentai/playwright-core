'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const artifact = require('./artifact.js');
const browserContext = require('./browserContext.js');
const download = require('./download.js');
const instrumentation = require('./instrumentation.js');
const page = require('./page.js');
const socksClientCertificatesInterceptor = require('./socksClientCertificatesInterceptor.js');
const progress = require('./progress.js');

class Browser extends instrumentation.SdkObject {
  constructor(parent, options) {
    super(parent, "browser");
    this._downloads = /* @__PURE__ */ new Map();
    this._defaultContext = null;
    this._startedClosing = false;
    this._idToVideo = /* @__PURE__ */ new Map();
    this._isCollocatedWithServer = true;
    this.attribution.browser = this;
    this.options = options;
    this.instrumentation.onBrowserOpen(this);
  }
  static {
    this.Events = {
      Context: "context",
      Disconnected: "disconnected"
    };
  }
  sdkLanguage() {
    return this.options.sdkLanguage || this.attribution.playwright.options.sdkLanguage;
  }
  newContextFromMetadata(metadata, options) {
    const controller = new progress.ProgressController(metadata, this);
    return controller.run((progress) => this.newContext(progress, options));
  }
  async newContext(progress, options) {
    browserContext.validateBrowserContextOptions(options, this.options);
    let clientCertificatesProxy;
    if (options.clientCertificates?.length) {
      clientCertificatesProxy = await progress.raceWithCleanup(socksClientCertificatesInterceptor.ClientCertificatesProxy.create(options), (proxy) => proxy.close());
      options = { ...options };
      options.proxyOverride = clientCertificatesProxy.proxySettings();
      options.internalIgnoreHTTPSErrors = true;
    }
    const context = await progress.raceWithCleanup(this.doCreateNewContext(options), (context2) => context2.close({ reason: "Failed to create context" }));
    context._clientCertificatesProxy = clientCertificatesProxy;
    if (options.__testHookBeforeSetStorageState)
      await progress.race(options.__testHookBeforeSetStorageState());
    if (options.storageState)
      await context.setStorageState(progress, options.storageState);
    this.emit(Browser.Events.Context, context);
    return context;
  }
  async newContextForReuse(progress, params) {
    const hash = browserContext.BrowserContext.reusableContextHash(params);
    if (!this._contextForReuse || hash !== this._contextForReuse.hash || !this._contextForReuse.context.canResetForReuse()) {
      if (this._contextForReuse)
        await this._contextForReuse.context.close({ reason: "Context reused" });
      this._contextForReuse = { context: await this.newContext(progress, params), hash };
      return this._contextForReuse.context;
    }
    await this._contextForReuse.context.resetForReuse(progress, params);
    return this._contextForReuse.context;
  }
  contextForReuse() {
    return this._contextForReuse?.context;
  }
  _downloadCreated(page, uuid, url, suggestedFilename) {
    const download$1 = new download.Download(page, this.options.downloadsPath || "", uuid, url, suggestedFilename);
    this._downloads.set(uuid, download$1);
  }
  _downloadFilenameSuggested(uuid, suggestedFilename) {
    const download = this._downloads.get(uuid);
    if (!download)
      return;
    download._filenameSuggested(suggestedFilename);
  }
  _downloadFinished(uuid, error) {
    const download = this._downloads.get(uuid);
    if (!download)
      return;
    download.artifact.reportFinished(error ? new Error(error) : void 0);
    this._downloads.delete(uuid);
  }
  _videoStarted(context, videoId, path, pageOrError) {
    const artifact$1 = new artifact.Artifact(context, path);
    this._idToVideo.set(videoId, { context, artifact: artifact$1 });
    pageOrError.then((page$1) => {
      if (page$1 instanceof page.Page) {
        page$1.video = artifact$1;
        page$1.emitOnContext(browserContext.BrowserContext.Events.VideoStarted, artifact$1);
        page$1.emit(page.Page.Events.Video, artifact$1);
      }
    });
  }
  _takeVideo(videoId) {
    const video = this._idToVideo.get(videoId);
    this._idToVideo.delete(videoId);
    return video?.artifact;
  }
  _didClose() {
    for (const context of this.contexts())
      context._browserClosed();
    if (this._defaultContext)
      this._defaultContext._browserClosed();
    this.emit(Browser.Events.Disconnected);
    this.instrumentation.onBrowserClose(this);
  }
  async close(options) {
    if (!this._startedClosing) {
      if (options.reason)
        this._closeReason = options.reason;
      this._startedClosing = true;
      await this.options.browserProcess.close();
    }
    if (this.isConnected())
      await new Promise((x) => this.once(Browser.Events.Disconnected, x));
  }
  async killForTests() {
    await this.options.browserProcess.kill();
  }
}

exports.Browser = Browser;
