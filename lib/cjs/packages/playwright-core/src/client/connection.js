'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const eventEmitter = require('./eventEmitter.js');
const android = require('./android.js');
const artifact = require('./artifact.js');
const browser = require('./browser.js');
const browserContext = require('./browserContext.js');
const browserType = require('./browserType.js');
const cdpSession = require('./cdpSession.js');
const channelOwner = require('./channelOwner.js');
const clientInstrumentation = require('./clientInstrumentation.js');
const dialog = require('./dialog.js');
const electron = require('./electron.js');
const elementHandle = require('./elementHandle.js');
const errors = require('./errors.js');
const fetch = require('./fetch.js');
const frame = require('./frame.js');
const jsHandle = require('./jsHandle.js');
const jsonPipe = require('./jsonPipe.js');
const localUtils = require('./localUtils.js');
const network = require('./network.js');
const page = require('./page.js');
const playwright = require('./playwright.js');
const stream = require('./stream.js');
const tracing = require('./tracing.js');
const worker = require('./worker.js');
const writableStream = require('./writableStream.js');
require('../protocol/validator.js');
const stackTrace = require('../utils/isomorphic/stackTrace.js');
const validatorPrimitives = require('../protocol/validatorPrimitives.js');

class Root extends channelOwner.ChannelOwner {
  constructor(connection) {
    super(connection, "Root", "", {});
  }
  async initialize() {
    return playwright.Playwright.from((await this._channel.initialize({
      sdkLanguage: "javascript"
    })).playwright);
  }
}
class DummyChannelOwner extends channelOwner.ChannelOwner {
}
class Connection extends eventEmitter.EventEmitter {
  constructor(platform, localUtils, instrumentation, headers = []) {
    super(platform);
    this._objects = /* @__PURE__ */ new Map();
    this.onmessage = (message) => {
    };
    this._lastId = 0;
    this._callbacks = /* @__PURE__ */ new Map();
    this._isRemote = false;
    this._rawBuffers = false;
    this._tracingCount = 0;
    this._instrumentation = instrumentation || clientInstrumentation.createInstrumentation();
    this._localUtils = localUtils;
    this._rootObject = new Root(this);
    this.headers = headers;
  }
  markAsRemote() {
    this._isRemote = true;
  }
  isRemote() {
    return this._isRemote;
  }
  useRawBuffers() {
    this._rawBuffers = true;
  }
  rawBuffers() {
    return this._rawBuffers;
  }
  localUtils() {
    return this._localUtils;
  }
  async initializePlaywright() {
    return await this._rootObject.initialize();
  }
  getObjectWithKnownName(guid) {
    return this._objects.get(guid);
  }
  setIsTracing(isTracing) {
    if (isTracing)
      this._tracingCount++;
    else
      this._tracingCount--;
  }
  async sendMessageToServer(object, method, params, options) {
    if (this._closedError)
      throw this._closedError;
    if (object._wasCollected)
      throw new Error("The object has been collected to prevent unbounded heap growth.");
    const guid = object._guid;
    const type = object._type;
    const id = ++this._lastId;
    const message = { id, guid, method, params };
    if (this._platform.isLogEnabled("channel")) {
      this._platform.log("channel", "SEND> " + JSON.stringify(message));
    }
    const location = options.frames?.[0] ? { file: options.frames[0].file, line: options.frames[0].line, column: options.frames[0].column } : void 0;
    const metadata = { title: options.title, location, internal: options.internal, stepId: options.stepId };
    if (this._tracingCount && options.frames && type !== "LocalUtils")
      this._localUtils?.addStackToTracingNoReply({ callData: { stack: options.frames ?? [], id } }).catch(() => {
      });
    this._platform.zones.empty.run(() => this.onmessage({ ...message, metadata }));
    return await new Promise((resolve, reject) => this._callbacks.set(id, { resolve, reject, title: options.title, type, method }));
  }
  _validatorFromWireContext() {
    return {
      tChannelImpl: this._tChannelImplFromWire.bind(this),
      binary: this._rawBuffers ? "buffer" : "fromBase64",
      isUnderTest: () => this._platform.isUnderTest()
    };
  }
  dispatch(message) {
    if (this._closedError)
      return;
    const { id, guid, method, params, result, error, log } = message;
    if (id) {
      if (this._platform.isLogEnabled("channel"))
        this._platform.log("channel", "<RECV " + JSON.stringify(message));
      const callback = this._callbacks.get(id);
      if (!callback)
        throw new Error(`Cannot find command to respond: ${id}`);
      this._callbacks.delete(id);
      if (error && !result) {
        const parsedError = errors.parseError(error);
        stackTrace.rewriteErrorMessage(parsedError, parsedError.message + formatCallLog(this._platform, log));
        callback.reject(parsedError);
      } else {
        const validator2 = validatorPrimitives.findValidator(callback.type, callback.method, "Result");
        callback.resolve(validator2(result, "", this._validatorFromWireContext()));
      }
      return;
    }
    if (this._platform.isLogEnabled("channel"))
      this._platform.log("channel", "<EVENT " + JSON.stringify(message));
    if (method === "__create__") {
      this._createRemoteObject(guid, params.type, params.guid, params.initializer);
      return;
    }
    const object = this._objects.get(guid);
    if (!object)
      throw new Error(`Cannot find object to "${method}": ${guid}`);
    if (method === "__adopt__") {
      const child = this._objects.get(params.guid);
      if (!child)
        throw new Error(`Unknown new child: ${params.guid}`);
      object._adopt(child);
      return;
    }
    if (method === "__dispose__") {
      object._dispose(params.reason);
      return;
    }
    const validator = validatorPrimitives.findValidator(object._type, method, "Event");
    object._channel.emit(method, validator(params, "", this._validatorFromWireContext()));
  }
  close(cause) {
    if (this._closedError)
      return;
    this._closedError = new errors.TargetClosedError(cause);
    for (const callback of this._callbacks.values())
      callback.reject(this._closedError);
    this._callbacks.clear();
    this.emit("close");
  }
  _tChannelImplFromWire(names, arg, path, context) {
    if (arg && typeof arg === "object" && typeof arg.guid === "string") {
      const object = this._objects.get(arg.guid);
      if (!object)
        throw new Error(`Object with guid ${arg.guid} was not bound in the connection`);
      if (names !== "*" && !names.includes(object._type))
        throw new validatorPrimitives.ValidationError(`${path}: expected channel ${names.toString()}`);
      return object._channel;
    }
    throw new validatorPrimitives.ValidationError(`${path}: expected channel ${names.toString()}`);
  }
  _createRemoteObject(parentGuid, type, guid, initializer) {
    const parent = this._objects.get(parentGuid);
    if (!parent)
      throw new Error(`Cannot find parent object ${parentGuid} to create ${guid}`);
    let result;
    const validator = validatorPrimitives.findValidator(type, "", "Initializer");
    initializer = validator(initializer, "", this._validatorFromWireContext());
    switch (type) {
      case "Android":
        result = new android.Android(parent, type, guid, initializer);
        break;
      case "AndroidSocket":
        result = new android.AndroidSocket(parent, type, guid, initializer);
        break;
      case "AndroidDevice":
        result = new android.AndroidDevice(parent, type, guid, initializer);
        break;
      case "APIRequestContext":
        result = new fetch.APIRequestContext(parent, type, guid, initializer);
        break;
      case "Artifact":
        result = new artifact.Artifact(parent, type, guid, initializer);
        break;
      case "BindingCall":
        result = new page.BindingCall(parent, type, guid, initializer);
        break;
      case "Browser":
        result = new browser.Browser(parent, type, guid, initializer);
        break;
      case "BrowserContext":
        result = new browserContext.BrowserContext(parent, type, guid, initializer);
        break;
      case "BrowserType":
        result = new browserType.BrowserType(parent, type, guid, initializer);
        break;
      case "CDPSession":
        result = new cdpSession.CDPSession(parent, type, guid, initializer);
        break;
      case "Dialog":
        result = new dialog.Dialog(parent, type, guid, initializer);
        break;
      case "Electron":
        result = new electron.Electron(parent, type, guid, initializer);
        break;
      case "ElectronApplication":
        result = new electron.ElectronApplication(parent, type, guid, initializer);
        break;
      case "ElementHandle":
        result = new elementHandle.ElementHandle(parent, type, guid, initializer);
        break;
      case "Frame":
        result = new frame.Frame(parent, type, guid, initializer);
        break;
      case "JSHandle":
        result = new jsHandle.JSHandle(parent, type, guid, initializer);
        break;
      case "JsonPipe":
        result = new jsonPipe.JsonPipe(parent, type, guid, initializer);
        break;
      case "LocalUtils":
        result = new localUtils.LocalUtils(parent, type, guid, initializer);
        if (!this._localUtils)
          this._localUtils = result;
        break;
      case "Page":
        result = new page.Page(parent, type, guid, initializer);
        break;
      case "Playwright":
        result = new playwright.Playwright(parent, type, guid, initializer);
        break;
      case "Request":
        result = new network.Request(parent, type, guid, initializer);
        break;
      case "Response":
        result = new network.Response(parent, type, guid, initializer);
        break;
      case "Route":
        result = new network.Route(parent, type, guid, initializer);
        break;
      case "Stream":
        result = new stream.Stream(parent, type, guid, initializer);
        break;
      case "SocksSupport":
        result = new DummyChannelOwner(parent, type, guid, initializer);
        break;
      case "Tracing":
        result = new tracing.Tracing(parent, type, guid, initializer);
        break;
      case "WebSocket":
        result = new network.WebSocket(parent, type, guid, initializer);
        break;
      case "WebSocketRoute":
        result = new network.WebSocketRoute(parent, type, guid, initializer);
        break;
      case "Worker":
        result = new worker.Worker(parent, type, guid, initializer);
        break;
      case "WritableStream":
        result = new writableStream.WritableStream(parent, type, guid, initializer);
        break;
      default:
        throw new Error("Missing type " + type);
    }
    return result;
  }
}
function formatCallLog(platform, log) {
  if (!log || !log.some((l) => !!l))
    return "";
  return `
Call log:
${platform.colors.dim(log.join("\n"))}
`;
}

exports.Connection = Connection;
