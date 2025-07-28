'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const assert = require('../../utils/isomorphic/assert.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
const debugLogger = require('../utils/debugLogger.js');
const eventsHelper = require('../utils/eventsHelper.js');
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
const instrumentation = require('../instrumentation.js');

const ConnectionEvents = {
  Disconnected: Symbol("ConnectionEvents.Disconnected")
};
const kBrowserCloseMessageId = -9999;
class CRConnection extends instrumentation.SdkObject {
  constructor(parent, transport, protocolLogger, browserLogsCollector) {
    super(parent, "cr-connection");
    this._lastId = 0;
    this._sessions = /* @__PURE__ */ new Map();
    this._closed = false;
    this.setMaxListeners(0);
    this._transport = transport;
    this._protocolLogger = protocolLogger;
    this._browserLogsCollector = browserLogsCollector;
    this.rootSession = new CRSession(this, null, "");
    this._sessions.set("", this.rootSession);
    this._transport.onmessage = this._onMessage.bind(this);
    this._transport.onclose = this._onClose.bind(this);
  }
  _rawSend(sessionId, method, params) {
    const id = ++this._lastId;
    const message = { id, method, params };
    if (sessionId)
      message.sessionId = sessionId;
    this._protocolLogger("send", message);
    this._transport.send(message);
    return id;
  }
  async _onMessage(message) {
    this._protocolLogger("receive", message);
    if (message.id === kBrowserCloseMessageId)
      return;
    const session = this._sessions.get(message.sessionId || "");
    if (session)
      session._onMessage(message);
  }
  _onClose(reason) {
    this._closed = true;
    this._transport.onmessage = void 0;
    this._transport.onclose = void 0;
    this._browserDisconnectedLogs = helper.helper.formatBrowserLogs(this._browserLogsCollector.recentLogs(), reason);
    this.rootSession.dispose();
    Promise.resolve().then(() => this.emit(ConnectionEvents.Disconnected));
  }
  close() {
    if (!this._closed)
      this._transport.close();
  }
  async createBrowserSession() {
    const { sessionId } = await this.rootSession.send("Target.attachToBrowserTarget");
    return new CDPSession(this.rootSession, sessionId);
  }
}
class CRSession extends instrumentation.SdkObject {
  constructor(connection, parentSession, sessionId, eventListener) {
    super(connection, "cr-session");
    this._callbacks = /* @__PURE__ */ new Map();
    this._crashed = false;
    this._closed = false;
    this.setMaxListeners(0);
    this._connection = connection;
    this._parentSession = parentSession;
    this._sessionId = sessionId;
    this._eventListener = eventListener;
    this.on = super.on;
    this.addListener = super.addListener;
    this.off = super.removeListener;
    this.removeListener = super.removeListener;
    this.once = super.once;
  }
  _markAsCrashed() {
    this._crashed = true;
  }
  createChildSession(sessionId, eventListener) {
    const session = new CRSession(this._connection, this, sessionId, eventListener);
    this._connection._sessions.set(sessionId, session);
    return session;
  }
  async send(method, params) {
    if (this._crashed || this._closed || this._connection._closed || this._connection._browserDisconnectedLogs)
      throw new protocolError.ProtocolError(this._crashed ? "crashed" : "closed", void 0, this._connection._browserDisconnectedLogs);
    const id = this._connection._rawSend(this._sessionId, method, params);
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, { resolve, reject, error: new protocolError.ProtocolError("error", method) });
    });
  }
  _sendMayFail(method, params) {
    return this.send(method, params).catch((error) => debugLogger.debugLogger.log("error", error));
  }
  _onMessage(object) {
    if (object.id && this._callbacks.has(object.id)) {
      const callback = this._callbacks.get(object.id);
      this._callbacks.delete(object.id);
      if (object.error) {
        callback.error.setMessage(object.error.message);
        callback.reject(callback.error);
      } else {
        callback.resolve(object.result);
      }
    } else if (object.id && object.error?.code === -32001) ; else {
      assert.assert(!object.id, object?.error?.message || void 0);
      Promise.resolve().then(() => {
        if (this._eventListener)
          this._eventListener(object.method, object.params);
        this.emit(object.method, object.params);
      });
    }
  }
  async detach() {
    if (this._closed)
      throw new Error(`Session already detached. Most likely the page has been closed.`);
    if (!this._parentSession)
      throw new Error("Root session cannot be closed");
    await this._sendMayFail("Runtime.runIfWaitingForDebugger");
    await this._parentSession.send("Target.detachFromTarget", { sessionId: this._sessionId });
    this.dispose();
  }
  dispose() {
    this._closed = true;
    this._connection._sessions.delete(this._sessionId);
    for (const callback of this._callbacks.values()) {
      callback.error.setMessage(`Internal server error, session closed.`);
      callback.error.type = this._crashed ? "crashed" : "closed";
      callback.error.logs = this._connection._browserDisconnectedLogs;
      callback.reject(callback.error);
    }
    this._callbacks.clear();
  }
}
class CDPSession extends instrumentation.SdkObject {
  constructor(parentSession, sessionId) {
    super(parentSession, "cdp-session");
    this._listeners = [];
    this._session = parentSession.createChildSession(sessionId, (method, params) => this.emit(CDPSession.Events.Event, { method, params }));
    this._listeners = [eventsHelper.eventsHelper.addEventListener(parentSession, "Target.detachedFromTarget", (event) => {
      if (event.sessionId === sessionId)
        this._onClose();
    })];
  }
  static {
    this.Events = {
      Event: "event",
      Closed: "close"
    };
  }
  async send(method, params) {
    return await this._session.send(method, params);
  }
  async detach() {
    return await this._session.detach();
  }
  async attachToTarget(targetId) {
    const { sessionId } = await this.send("Target.attachToTarget", { targetId, flatten: true });
    return new CDPSession(this._session, sessionId);
  }
  _onClose() {
    eventsHelper.eventsHelper.removeEventListeners(this._listeners);
    this._session.dispose();
    this.emit(CDPSession.Events.Closed);
  }
}

exports.CDPSession = CDPSession;
exports.CRConnection = CRConnection;
exports.CRSession = CRSession;
exports.ConnectionEvents = ConnectionEvents;
exports.kBrowserCloseMessageId = kBrowserCloseMessageId;
