'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

require('../server/registry/index.js');
const dispatcher = require('../server/dispatchers/dispatcher.js');
const playwrightDispatcher = require('../server/dispatchers/playwrightDispatcher.js');
const time = require('../utils/isomorphic/time.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
require('../server/utils/debug.js');
const debugLogger = require('../server/utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../zipBundle.js');
require('../server/utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../server/utils/happyEyeballs.js');
require('../server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
const profiler = require('../server/utils/profiler.js');
require('../server/utils/socksProxy.js');
require('node:os');
require('../server/utils/zones.js');
const android = require('../server/android/android.js');
require('node:events');
require('node:net');
require('../server/browserContext.js');
require('../server/helper.js');
require('node:stream');
require('node:tls');
require('../../../../cloudflare/webSocketTransport.js');
require('../server/bidi/bidiBrowser.js');
require('../server/chromium/chromium.js');
require('../server/debugController.js');
require('../server/electron/electron.js');
const browser = require('../server/browser.js');
require('../protocol/serializers.js');
require('../server/network.js');
require('../server/page.js');
require('../server/firefox/ffAccessibility.js');
require('../server/webkit/wkAccessibility.js');
require('../server/input.js');
const debugControllerDispatcher = require('../server/dispatchers/debugControllerDispatcher.js');

class PlaywrightConnection {
  constructor(semaphore, ws, controller, playwright, initialize, id) {
    this._cleanups = [];
    this._disconnected = false;
    this._ws = ws;
    this._semaphore = semaphore;
    this._id = id;
    this._profileName = (/* @__PURE__ */ new Date()).toISOString();
    const lock = this._semaphore.acquire();
    this._dispatcherConnection = new dispatcher.DispatcherConnection();
    this._dispatcherConnection.onmessage = async (message) => {
      await lock;
      if (ws.readyState !== ws.CLOSING) {
        const messageString = JSON.stringify(message);
        if (debugLogger.debugLogger.isEnabled("server:channel"))
          debugLogger.debugLogger.log("server:channel", `[${this._id}] ${time.monotonicTime() * 1e3} SEND ► ${messageString}`);
        if (debugLogger.debugLogger.isEnabled("server:metadata"))
          this.logServerMetadata(message, messageString, "SEND");
        ws.send(messageString);
      }
    };
    ws.on("message", async (message) => {
      await lock;
      const messageString = Buffer.from(message).toString();
      const jsonMessage = JSON.parse(messageString);
      if (debugLogger.debugLogger.isEnabled("server:channel"))
        debugLogger.debugLogger.log("server:channel", `[${this._id}] ${time.monotonicTime() * 1e3} ◀ RECV ${messageString}`);
      if (debugLogger.debugLogger.isEnabled("server:metadata"))
        this.logServerMetadata(jsonMessage, messageString, "RECV");
      this._dispatcherConnection.dispatch(jsonMessage);
    });
    ws.on("close", () => this._onDisconnect());
    ws.on("error", (error) => this._onDisconnect(error));
    if (controller) {
      debugLogger.debugLogger.log("server", `[${this._id}] engaged reuse controller mode`);
      this._root = new debugControllerDispatcher.DebugControllerDispatcher(this._dispatcherConnection, playwright.debugController);
      return;
    }
    this._root = new dispatcher.RootDispatcher(this._dispatcherConnection, async (scope, params) => {
      await profiler.startProfiling();
      const options = await initialize();
      if (options.preLaunchedBrowser) {
        const browser$1 = options.preLaunchedBrowser;
        browser$1.options.sdkLanguage = params.sdkLanguage;
        browser$1.on(browser.Browser.Events.Disconnected, () => {
          this.close({ code: 1001, reason: "Browser closed" });
        });
      }
      if (options.preLaunchedAndroidDevice) {
        const androidDevice = options.preLaunchedAndroidDevice;
        androidDevice.on(android.AndroidDevice.Events.Close, () => {
          this.close({ code: 1001, reason: "Android device disconnected" });
        });
      }
      if (options.dispose)
        this._cleanups.push(options.dispose);
      const dispatcher = new playwrightDispatcher.PlaywrightDispatcher(scope, playwright, options);
      this._cleanups.push(() => dispatcher.cleanup());
      return dispatcher;
    });
  }
  async _onDisconnect(error) {
    this._disconnected = true;
    debugLogger.debugLogger.log("server", `[${this._id}] disconnected. error: ${error}`);
    await this._root.stopPendingOperations(new Error("Disconnected")).catch(() => {
    });
    this._root._dispose();
    debugLogger.debugLogger.log("server", `[${this._id}] starting cleanup`);
    for (const cleanup of this._cleanups)
      await cleanup().catch(() => {
      });
    await profiler.stopProfiling(this._profileName);
    this._semaphore.release();
    debugLogger.debugLogger.log("server", `[${this._id}] finished cleanup`);
  }
  logServerMetadata(message, messageString, direction) {
    const serverLogMetadata = {
      wallTime: Date.now(),
      id: message.id,
      guid: message.guid,
      method: message.method,
      payloadSizeInBytes: Buffer.byteLength(messageString, "utf-8")
    };
    debugLogger.debugLogger.log("server:metadata", (direction === "SEND" ? "SEND ► " : "◀ RECV ") + JSON.stringify(serverLogMetadata));
  }
  async close(reason) {
    if (this._disconnected)
      return;
    debugLogger.debugLogger.log("server", `[${this._id}] force closing connection: ${reason?.reason || ""} (${reason?.code || 0})`);
    try {
      this._ws.close(reason?.code, reason?.reason);
    } catch (e) {
    }
  }
}

exports.PlaywrightConnection = PlaywrightConnection;
