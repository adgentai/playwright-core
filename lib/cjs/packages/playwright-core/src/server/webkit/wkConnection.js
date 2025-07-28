'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const require$$0$3 = require('node:events');
const assert = require('../../utils/isomorphic/assert.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
const debugLogger = require('../utils/debugLogger.js');
require('../../../../../bundles/fs.js');
require('node:path');
require('../../zipBundle.js');
require('../utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../utils/happyEyeballs.js');
require('../utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('../utils/profiler.js');
require('../utils/socksProxy.js');
require('node:os');
require('../utils/zones.js');
const helper = require('../helper.js');
const protocolError = require('../protocolError.js');

const kBrowserCloseMessageId = -9999;
const kPageProxyMessageReceived = Symbol("kPageProxyMessageReceived");
class WKConnection {
  constructor(transport, onDisconnect, protocolLogger, browserLogsCollector) {
    this._lastId = 0;
    this._closed = false;
    this._transport = transport;
    this._onDisconnect = onDisconnect;
    this._protocolLogger = protocolLogger;
    this._browserLogsCollector = browserLogsCollector;
    this.browserSession = new WKSession(this, "", (message) => {
      this.rawSend(message);
    });
    this._transport.onmessage = this._dispatchMessage.bind(this);
    this._transport.onclose = this._onClose.bind(this);
  }
  nextMessageId() {
    return ++this._lastId;
  }
  rawSend(message) {
    this._protocolLogger("send", message);
    this._transport.send(message);
  }
  _dispatchMessage(message) {
    this._protocolLogger("receive", message);
    if (message.id === kBrowserCloseMessageId)
      return;
    if (message.pageProxyId) {
      const payload = { message, pageProxyId: message.pageProxyId };
      this.browserSession.dispatchMessage({ method: kPageProxyMessageReceived, params: payload });
      return;
    }
    this.browserSession.dispatchMessage(message);
  }
  _onClose(reason) {
    this._closed = true;
    this._transport.onmessage = void 0;
    this._transport.onclose = void 0;
    this._browserDisconnectedLogs = helper.helper.formatBrowserLogs(this._browserLogsCollector.recentLogs(), reason);
    this.browserSession.dispose();
    this._onDisconnect();
  }
  isClosed() {
    return this._closed;
  }
  close() {
    if (!this._closed)
      this._transport.close();
  }
}
class WKSession extends require$$0$3.EventEmitter {
  constructor(connection, sessionId, rawSend) {
    super();
    this._disposed = false;
    this._callbacks = /* @__PURE__ */ new Map();
    this._crashed = false;
    this.setMaxListeners(0);
    this.connection = connection;
    this.sessionId = sessionId;
    this._rawSend = rawSend;
    this.on = super.on;
    this.off = super.removeListener;
    this.addListener = super.addListener;
    this.removeListener = super.removeListener;
    this.once = super.once;
  }
  async send(method, params) {
    if (this._crashed || this._disposed || this.connection._browserDisconnectedLogs)
      throw new protocolError.ProtocolError(this._crashed ? "crashed" : "closed", void 0, this.connection._browserDisconnectedLogs);
    const id = this.connection.nextMessageId();
    const messageObj = { id, method, params };
    this._rawSend(messageObj);
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, { resolve, reject, error: new protocolError.ProtocolError("error", method) });
    });
  }
  sendMayFail(method, params) {
    return this.send(method, params).catch((error) => debugLogger.debugLogger.log("error", error));
  }
  markAsCrashed() {
    this._crashed = true;
  }
  isDisposed() {
    return this._disposed;
  }
  dispose() {
    for (const callback of this._callbacks.values()) {
      callback.error.type = this._crashed ? "crashed" : "closed";
      callback.error.logs = this.connection._browserDisconnectedLogs;
      callback.reject(callback.error);
    }
    this._callbacks.clear();
    this._disposed = true;
  }
  dispatchMessage(object) {
    if (object.id && this._callbacks.has(object.id)) {
      const callback = this._callbacks.get(object.id);
      this._callbacks.delete(object.id);
      if (object.error) {
        callback.error.setMessage(object.error.message);
        callback.reject(callback.error);
      } else {
        callback.resolve(object.result);
      }
    } else if (object.id && !object.error) {
      assert.assert(this.isDisposed());
    } else {
      Promise.resolve().then(() => this.emit(object.method, object.params));
    }
  }
}

exports.WKConnection = WKConnection;
exports.WKSession = WKSession;
exports.kBrowserCloseMessageId = kBrowserCloseMessageId;
exports.kPageProxyMessageReceived = kPageProxyMessageReceived;
