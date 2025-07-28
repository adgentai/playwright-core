import { Artifact } from './artifact.js';
import { validateBrowserContextOptions, BrowserContext } from './browserContext.js';
import { Download } from './download.js';
import { SdkObject } from './instrumentation.js';
import { Page } from './page.js';
import { ClientCertificatesProxy } from './socksClientCertificatesInterceptor.js';
import { ProgressController } from './progress.js';

class Browser extends SdkObject {
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
    const controller = new ProgressController(metadata, this);
    return controller.run((progress) => this.newContext(progress, options));
  }
  async newContext(progress, options) {
    validateBrowserContextOptions(options, this.options);
    let clientCertificatesProxy;
    if (options.clientCertificates?.length) {
      clientCertificatesProxy = await progress.raceWithCleanup(ClientCertificatesProxy.create(options), (proxy) => proxy.close());
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
    const hash = BrowserContext.reusableContextHash(params);
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
    const download = new Download(page, this.options.downloadsPath || "", uuid, url, suggestedFilename);
    this._downloads.set(uuid, download);
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
    const artifact = new Artifact(context, path);
    this._idToVideo.set(videoId, { context, artifact });
    pageOrError.then((page) => {
      if (page instanceof Page) {
        page.video = artifact;
        page.emitOnContext(BrowserContext.Events.VideoStarted, artifact);
        page.emit(Page.Events.Video, artifact);
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

export { Browser };
