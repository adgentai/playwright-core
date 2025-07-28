import { eventsHelper } from '../utils/eventsHelper.js';
import { Browser } from '../browser.js';
import { BrowserContext, verifyGeolocation } from '../browserContext.js';
import { filterCookies, rewriteCookies } from '../network.js';
import { BidiConnection } from './bidiConnection.js';
import { bidiBytesValueToString } from './bidiNetworkManager.js';
import { BidiPage, kPlaywrightBindingChannel } from './bidiPage.js';
import { PageBinding } from '../page.js';
import { Session, BrowsingContext, Script, Network as Network$1 } from './third_party/bidiProtocolCore.js';
import { Permissions } from './third_party/bidiProtocolPermissions.js';

class BidiBrowser extends Browser {
  constructor(parent, transport, options) {
    super(parent, options);
    this._contexts = /* @__PURE__ */ new Map();
    this._bidiPages = /* @__PURE__ */ new Map();
    this._connection = new BidiConnection(transport, this._onDisconnect.bind(this), options.protocolLogger, options.browserLogsCollector);
    this._browserSession = this._connection.browserSession;
    this._eventListeners = [
      eventsHelper.addEventListener(this._browserSession, "browsingContext.contextCreated", this._onBrowsingContextCreated.bind(this)),
      eventsHelper.addEventListener(this._browserSession, "script.realmDestroyed", this._onScriptRealmDestroyed.bind(this))
    ];
  }
  static async connect(parent, transport, options) {
    const browser = new BidiBrowser(parent, transport, options);
    if (options.__testHookOnConnectToBrowser)
      await options.__testHookOnConnectToBrowser();
    let proxy;
    if (options.proxy) {
      proxy = {
        proxyType: "manual"
      };
      const url = new URL(options.proxy.server);
      switch (url.protocol) {
        case "http:":
          proxy.httpProxy = url.host;
          break;
        case "https:":
          proxy.httpsProxy = url.host;
          break;
        case "socks4:":
          proxy.socksProxy = url.host;
          proxy.socksVersion = 4;
          break;
        case "socks5:":
          proxy.socksProxy = url.host;
          proxy.socksVersion = 5;
          break;
        default:
          throw new Error("Invalid proxy server protocol: " + options.proxy.server);
      }
      if (options.proxy.bypass)
        proxy.noProxy = options.proxy.bypass.split(",");
    }
    browser._bidiSessionInfo = await browser._browserSession.send("session.new", {
      capabilities: {
        alwaysMatch: {
          acceptInsecureCerts: false,
          proxy,
          unhandledPromptBehavior: {
            default: Session.UserPromptHandlerType.Ignore
          },
          webSocketUrl: true
        }
      }
    });
    await browser._browserSession.send("session.subscribe", {
      events: [
        "browsingContext",
        "network",
        "log",
        "script"
      ]
    });
    if (options.persistent) {
      const context = new BidiBrowserContext(browser, void 0, options.persistent);
      browser._defaultContext = context;
      await context._initialize();
      const page = await browser._defaultContext.doCreateNewPage();
      await page.waitForInitializedOrError();
    }
    return browser;
  }
  _onDisconnect() {
    this._didClose();
  }
  async doCreateNewContext(options) {
    const { userContext } = await this._browserSession.send("browser.createUserContext", {
      acceptInsecureCerts: options.ignoreHTTPSErrors
    });
    const context = new BidiBrowserContext(this, userContext, options);
    await context._initialize();
    this._contexts.set(userContext, context);
    return context;
  }
  contexts() {
    return Array.from(this._contexts.values());
  }
  version() {
    return this._bidiSessionInfo.capabilities.browserVersion;
  }
  userAgent() {
    return this._bidiSessionInfo.capabilities.userAgent;
  }
  isConnected() {
    return !this._connection.isClosed();
  }
  _onBrowsingContextCreated(event) {
    if (event.parent) {
      const parentFrameId = event.parent;
      for (const page2 of this._bidiPages.values()) {
        const parentFrame = page2._page.frameManager.frame(parentFrameId);
        if (!parentFrame)
          continue;
        page2._session.addFrameBrowsingContext(event.context);
        page2._page.frameManager.frameAttached(event.context, parentFrameId);
        const frame = page2._page.frameManager.frame(event.context);
        if (frame)
          frame._url = event.url;
        return;
      }
      return;
    }
    let context = this._contexts.get(event.userContext);
    if (!context)
      context = this._defaultContext;
    if (!context)
      return;
    const session = this._connection.createMainFrameBrowsingContextSession(event.context);
    const opener = event.originalOpener && this._bidiPages.get(event.originalOpener);
    const page = new BidiPage(context, session, opener || null);
    page._page.mainFrame()._url = event.url;
    this._bidiPages.set(event.context, page);
  }
  _onBrowsingContextDestroyed(event) {
    if (event.parent) {
      this._browserSession.removeFrameBrowsingContext(event.context);
      const parentFrameId = event.parent;
      for (const page of this._bidiPages.values()) {
        const parentFrame = page._page.frameManager.frame(parentFrameId);
        if (!parentFrame)
          continue;
        page._page.frameManager.frameDetached(event.context);
        return;
      }
      return;
    }
    const bidiPage = this._bidiPages.get(event.context);
    if (!bidiPage)
      return;
    bidiPage.didClose();
    this._bidiPages.delete(event.context);
  }
  _onScriptRealmDestroyed(event) {
    for (const page of this._bidiPages.values()) {
      if (page._onRealmDestroyed(event))
        return;
    }
  }
}
class BidiBrowserContext extends BrowserContext {
  constructor(browser, browserContextId, options) {
    super(browser, options, browserContextId);
    this._originToPermissions = /* @__PURE__ */ new Map();
    this._blockingPageCreations = /* @__PURE__ */ new Set();
    this._initScriptIds = /* @__PURE__ */ new Map();
    this._authenticateProxyViaHeader();
  }
  _bidiPages() {
    return [...this._browser._bidiPages.values()].filter((bidiPage) => bidiPage._browserContext === this);
  }
  async _initialize() {
    const promises = [
      super._initialize()
    ];
    promises.push(this.doUpdateDefaultViewport());
    if (this._options.geolocation)
      promises.push(this.setGeolocation(this._options.geolocation));
    await Promise.all(promises);
  }
  possiblyUninitializedPages() {
    return this._bidiPages().map((bidiPage) => bidiPage._page);
  }
  async doCreateNewPage(markAsServerSideOnly) {
    const promise = this._createNewPageImpl(markAsServerSideOnly);
    if (markAsServerSideOnly)
      this._blockingPageCreations.add(promise);
    try {
      return await promise;
    } finally {
      this._blockingPageCreations.delete(promise);
    }
  }
  async _createNewPageImpl(markAsServerSideOnly) {
    const { context } = await this._browser._browserSession.send("browsingContext.create", {
      type: BrowsingContext.CreateType.Window,
      userContext: this._browserContextId
    });
    const page = this._browser._bidiPages.get(context)._page;
    if (markAsServerSideOnly)
      page.markAsServerSideOnly();
    return page;
  }
  async waitForBlockingPageCreations() {
    await Promise.all([...this._blockingPageCreations].map((command) => command.catch(() => {
    })));
  }
  async doGetCookies(urls) {
    const { cookies } = await this._browser._browserSession.send(
      "storage.getCookies",
      { partition: { type: "storageKey", userContext: this._browserContextId } }
    );
    return filterCookies(cookies.map((c) => {
      const copy = {
        name: c.name,
        value: bidiBytesValueToString(c.value),
        domain: c.domain,
        path: c.path,
        httpOnly: c.httpOnly,
        secure: c.secure,
        expires: c.expiry ?? -1,
        sameSite: c.sameSite ? fromBidiSameSite(c.sameSite) : "None"
      };
      return copy;
    }), urls);
  }
  async addCookies(cookies) {
    cookies = rewriteCookies(cookies);
    const promises = cookies.map((c) => {
      const cookie = {
        name: c.name,
        value: { type: "string", value: c.value },
        domain: c.domain,
        path: c.path,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite && toBidiSameSite(c.sameSite),
        expiry: c.expires === -1 || c.expires === void 0 ? void 0 : Math.round(c.expires)
      };
      return this._browser._browserSession.send(
        "storage.setCookie",
        { cookie, partition: { type: "storageKey", userContext: this._browserContextId } }
      );
    });
    await Promise.all(promises);
  }
  async doClearCookies() {
    await this._browser._browserSession.send(
      "storage.deleteCookies",
      { partition: { type: "storageKey", userContext: this._browserContextId } }
    );
  }
  async doGrantPermissions(origin, permissions) {
    const currentPermissions = this._originToPermissions.get(origin) || [];
    const toGrant = permissions.filter((permission) => !currentPermissions.includes(permission));
    this._originToPermissions.set(origin, [...currentPermissions, ...toGrant]);
    await Promise.all(toGrant.map((permission) => this._setPermission(origin, permission, Permissions.PermissionState.Granted)));
  }
  async doClearPermissions() {
    const currentPermissions = [...this._originToPermissions.entries()];
    this._originToPermissions = /* @__PURE__ */ new Map();
    await Promise.all(currentPermissions.map(([origin, permissions]) => permissions.map(
      (p) => this._setPermission(origin, p, Permissions.PermissionState.Prompt)
    )));
  }
  async _setPermission(origin, permission, state) {
    await this._browser._browserSession.send("permissions.setPermission", {
      descriptor: {
        name: permission
      },
      state,
      origin,
      userContext: this._browserContextId || "default"
    });
  }
  async setGeolocation(geolocation) {
    verifyGeolocation(geolocation);
    this._options.geolocation = geolocation;
    await this._browser._browserSession.send("emulation.setGeolocationOverride", {
      coordinates: geolocation ? {
        latitude: geolocation.latitude,
        longitude: geolocation.longitude,
        accuracy: geolocation.accuracy
      } : null,
      userContexts: [this._browserContextId || "default"]
    });
  }
  async doUpdateExtraHTTPHeaders() {
  }
  async setUserAgent(userAgent) {
  }
  async doUpdateOffline() {
  }
  async doSetHTTPCredentials(httpCredentials) {
    this._options.httpCredentials = httpCredentials;
    for (const page of this.pages())
      await page.delegate.updateHttpCredentials();
  }
  async doAddInitScript(initScript) {
    const { script } = await this._browser._browserSession.send("script.addPreloadScript", {
      // TODO: remove function call from the source.
      functionDeclaration: `() => { return ${initScript.source} }`,
      userContexts: [this._browserContextId || "default"]
    });
    this._initScriptIds.set(initScript, script);
  }
  async doRemoveInitScripts(initScripts) {
    const ids = [];
    for (const script of initScripts) {
      const id = this._initScriptIds.get(script);
      if (id)
        ids.push(id);
      this._initScriptIds.delete(script);
    }
    await Promise.all(ids.map((script) => this._browser._browserSession.send("script.removePreloadScript", { script })));
  }
  async doUpdateRequestInterception() {
  }
  async doUpdateDefaultViewport() {
    if (!this._options.viewport)
      return;
    await this._browser._browserSession.send("browsingContext.setViewport", {
      viewport: {
        width: this._options.viewport.width,
        height: this._options.viewport.height
      },
      devicePixelRatio: this._options.deviceScaleFactor || 1,
      userContexts: [this._userContextId()]
    });
  }
  async doUpdateDefaultEmulatedMedia() {
  }
  async doExposePlaywrightBinding() {
    const args = [{
      type: "channel",
      value: {
        channel: kPlaywrightBindingChannel,
        ownership: Script.ResultOwnership.Root
      }
    }];
    const functionDeclaration = `function addMainBinding(callback) { globalThis['${PageBinding.kBindingName}'] = callback; }`;
    const promises = [];
    promises.push(this._browser._browserSession.send("script.addPreloadScript", {
      functionDeclaration,
      arguments: args,
      userContexts: [this._userContextId()]
    }));
    promises.push(...this._bidiPages().map((page) => {
      const realms = [...page._realmToContext].filter(([realm, context]) => context.world === "main").map(([realm, context]) => realm);
      return Promise.all(realms.map((realm) => {
        return page._session.send("script.callFunction", {
          functionDeclaration,
          arguments: args,
          target: { realm },
          awaitPromise: false,
          userActivation: false
        });
      }));
    }));
    await Promise.all(promises);
  }
  onClosePersistent() {
  }
  async clearCache() {
  }
  async doClose(reason) {
    if (!this._browserContextId) {
      await this._browser.close({ reason });
      return;
    }
    await this._browser._browserSession.send("browser.removeUserContext", {
      userContext: this._browserContextId
    });
    this._browser._contexts.delete(this._browserContextId);
  }
  async cancelDownload(uuid) {
  }
  _userContextId() {
    if (this._browserContextId)
      return this._browserContextId;
    return "default";
  }
}
function fromBidiSameSite(sameSite) {
  switch (sameSite) {
    case "strict":
      return "Strict";
    case "lax":
      return "Lax";
    case "none":
      return "None";
  }
  return "None";
}
function toBidiSameSite(sameSite) {
  switch (sameSite) {
    case "Strict":
      return Network$1.SameSite.Strict;
    case "Lax":
      return Network$1.SameSite.Lax;
    case "None":
      return Network$1.SameSite.None;
  }
  return Network$1.SameSite.None;
}
var Network;
((Network2) => {
  ((SameSite2) => {
    SameSite2["Strict"] = "strict";
    SameSite2["Lax"] = "lax";
    SameSite2["None"] = "none";
  })(Network2.SameSite || (Network2.SameSite = {}));
})(Network || (Network = {}));

export { BidiBrowser, BidiBrowserContext, Network };
