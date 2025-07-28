'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const require$$0$3 = require('node:events');
const eventsHelper = require('../utils/eventsHelper.js');
require('../../protocol/validator.js');
const assert = require('../../utils/isomorphic/assert.js');
const stackTrace = require('../../utils/isomorphic/stackTrace.js');
const protocolMetainfo = require('../../utils/isomorphic/protocolMetainfo.js');
const time = require('../../utils/isomorphic/time.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
const debug = require('../utils/debug.js');
require('../utils/debugLogger.js');
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
const errors = require('../errors.js');
const instrumentation = require('../instrumentation.js');
const protocolError = require('../protocolError.js');
const callLog = require('../callLog.js');
const progress = require('../progress.js');
const validatorPrimitives = require('../../protocol/validatorPrimitives.js');

const metadataValidator = validatorPrimitives.createMetadataValidator();
function maxDispatchersForBucket(gcBucket) {
  return {
    "JSHandle": 1e5,
    "ElementHandle": 1e5
  }[gcBucket] ?? 1e4;
}
class Dispatcher extends require$$0$3.EventEmitter {
  constructor(parent, object, type, initializer, gcBucket) {
    super();
    this._dispatchers = /* @__PURE__ */ new Map();
    this._disposed = false;
    this._eventListeners = [];
    this._activeProgressControllers = /* @__PURE__ */ new Set();
    this.connection = parent instanceof DispatcherConnection ? parent : parent.connection;
    this._parent = parent instanceof DispatcherConnection ? void 0 : parent;
    const guid = object.guid;
    this._guid = guid;
    this._type = type;
    this._object = object;
    this._gcBucket = gcBucket ?? type;
    this.connection.registerDispatcher(this);
    if (this._parent) {
      assert.assert(!this._parent._dispatchers.has(guid));
      this._parent._dispatchers.set(guid, this);
    }
    if (this._parent)
      this.connection.sendCreate(this._parent, type, guid, initializer);
    this.connection.maybeDisposeStaleDispatchers(this._gcBucket);
  }
  parentScope() {
    return this._parent;
  }
  addObjectListener(eventName, handler) {
    this._eventListeners.push(eventsHelper.eventsHelper.addEventListener(this._object, eventName, handler));
  }
  adopt(child) {
    if (child._parent === this)
      return;
    const oldParent = child._parent;
    oldParent._dispatchers.delete(child._guid);
    this._dispatchers.set(child._guid, child);
    child._parent = this;
    this.connection.sendAdopt(this, child);
  }
  async _runCommand(callMetadata, method, validParams) {
    const controller = new progress.ProgressController(callMetadata, this._object);
    this._activeProgressControllers.add(controller);
    try {
      return await controller.run((progress) => this[method](validParams, progress), validParams?.timeout);
    } finally {
      this._activeProgressControllers.delete(controller);
    }
  }
  _dispatchEvent(method, params) {
    if (this._disposed) {
      if (debug.isUnderTest())
        throw new Error(`${this._guid} is sending "${String(method)}" event after being disposed`);
      return;
    }
    this.connection.sendEvent(this, method, params);
  }
  _dispose(reason) {
    this._disposeRecursively(new errors.TargetClosedError());
    this.connection.sendDispose(this, reason);
  }
  _onDispose() {
  }
  async stopPendingOperations(error) {
    const controllers = [];
    const collect = (dispatcher) => {
      controllers.push(...dispatcher._activeProgressControllers);
      for (const child of [...dispatcher._dispatchers.values()])
        collect(child);
    };
    collect(this);
    await Promise.all(controllers.map((controller) => controller.abort(error)));
  }
  _disposeRecursively(error) {
    assert.assert(!this._disposed, `${this._guid} is disposed more than once`);
    for (const controller of this._activeProgressControllers) {
      if (!controller.metadata.potentiallyClosesScope)
        controller.abort(error).catch(() => {
        });
    }
    this._onDispose();
    this._disposed = true;
    eventsHelper.eventsHelper.removeEventListeners(this._eventListeners);
    this._parent?._dispatchers.delete(this._guid);
    const list = this.connection._dispatchersByBucket.get(this._gcBucket);
    list?.delete(this._guid);
    this.connection._dispatcherByGuid.delete(this._guid);
    this.connection._dispatcherByObject.delete(this._object);
    for (const dispatcher of [...this._dispatchers.values()])
      dispatcher._disposeRecursively(error);
    this._dispatchers.clear();
  }
  _debugScopeState() {
    return {
      _guid: this._guid,
      objects: Array.from(this._dispatchers.values()).map((o) => o._debugScopeState())
    };
  }
  async waitForEventInfo() {
  }
}
class RootDispatcher extends Dispatcher {
  constructor(connection, createPlaywright) {
    super(connection, instrumentation.createRootSdkObject(), "Root", {});
    this.createPlaywright = createPlaywright;
    this._initialized = false;
  }
  async initialize(params, progress) {
    assert.assert(this.createPlaywright);
    assert.assert(!this._initialized);
    this._initialized = true;
    return {
      playwright: await this.createPlaywright(this, params)
    };
  }
}
class DispatcherConnection {
  constructor(isLocal) {
    this._dispatcherByGuid = /* @__PURE__ */ new Map();
    this._dispatcherByObject = /* @__PURE__ */ new Map();
    this._dispatchersByBucket = /* @__PURE__ */ new Map();
    this.onmessage = (message) => {
    };
    this._waitOperations = /* @__PURE__ */ new Map();
    this._isLocal = !!isLocal;
  }
  sendEvent(dispatcher, event, params) {
    const validator = validatorPrimitives.findValidator(dispatcher._type, event, "Event");
    params = validator(params, "", this._validatorToWireContext());
    this.onmessage({ guid: dispatcher._guid, method: event, params });
  }
  sendCreate(parent, type, guid, initializer) {
    const validator = validatorPrimitives.findValidator(type, "", "Initializer");
    initializer = validator(initializer, "", this._validatorToWireContext());
    this.onmessage({ guid: parent._guid, method: "__create__", params: { type, initializer, guid } });
  }
  sendAdopt(parent, dispatcher) {
    this.onmessage({ guid: parent._guid, method: "__adopt__", params: { guid: dispatcher._guid } });
  }
  sendDispose(dispatcher, reason) {
    this.onmessage({ guid: dispatcher._guid, method: "__dispose__", params: { reason } });
  }
  _validatorToWireContext() {
    return {
      tChannelImpl: this._tChannelImplToWire.bind(this),
      binary: this._isLocal ? "buffer" : "toBase64",
      isUnderTest: debug.isUnderTest
    };
  }
  _validatorFromWireContext() {
    return {
      tChannelImpl: this._tChannelImplFromWire.bind(this),
      binary: this._isLocal ? "buffer" : "fromBase64",
      isUnderTest: debug.isUnderTest
    };
  }
  _tChannelImplFromWire(names, arg, path, context) {
    if (arg && typeof arg === "object" && typeof arg.guid === "string") {
      const guid = arg.guid;
      const dispatcher = this._dispatcherByGuid.get(guid);
      if (!dispatcher)
        throw new validatorPrimitives.ValidationError(`${path}: no object with guid ${guid}`);
      if (names !== "*" && !names.includes(dispatcher._type))
        throw new validatorPrimitives.ValidationError(`${path}: object with guid ${guid} has type ${dispatcher._type}, expected ${names.toString()}`);
      return dispatcher;
    }
    throw new validatorPrimitives.ValidationError(`${path}: expected guid for ${names.toString()}`);
  }
  _tChannelImplToWire(names, arg, path, context) {
    if (arg instanceof Dispatcher) {
      if (names !== "*" && !names.includes(arg._type))
        throw new validatorPrimitives.ValidationError(`${path}: dispatcher with guid ${arg._guid} has type ${arg._type}, expected ${names.toString()}`);
      return { guid: arg._guid };
    }
    throw new validatorPrimitives.ValidationError(`${path}: expected dispatcher ${names.toString()}`);
  }
  existingDispatcher(object) {
    return this._dispatcherByObject.get(object);
  }
  registerDispatcher(dispatcher) {
    assert.assert(!this._dispatcherByGuid.has(dispatcher._guid));
    this._dispatcherByGuid.set(dispatcher._guid, dispatcher);
    this._dispatcherByObject.set(dispatcher._object, dispatcher);
    let list = this._dispatchersByBucket.get(dispatcher._gcBucket);
    if (!list) {
      list = /* @__PURE__ */ new Set();
      this._dispatchersByBucket.set(dispatcher._gcBucket, list);
    }
    list.add(dispatcher._guid);
  }
  maybeDisposeStaleDispatchers(gcBucket) {
    const maxDispatchers = maxDispatchersForBucket(gcBucket);
    const list = this._dispatchersByBucket.get(gcBucket);
    if (!list || list.size <= maxDispatchers)
      return;
    const dispatchersArray = [...list];
    const disposeCount = maxDispatchers / 10 | 0;
    this._dispatchersByBucket.set(gcBucket, new Set(dispatchersArray.slice(disposeCount)));
    for (let i = 0; i < disposeCount; ++i) {
      const d = this._dispatcherByGuid.get(dispatchersArray[i]);
      if (!d)
        continue;
      d._dispose("gc");
    }
  }
  async dispatch(message) {
    const { id, guid, method, params, metadata } = message;
    const dispatcher = this._dispatcherByGuid.get(guid);
    if (!dispatcher) {
      this.onmessage({ id, error: errors.serializeError(new errors.TargetClosedError()) });
      return;
    }
    let validParams;
    let validMetadata;
    try {
      const validator = validatorPrimitives.findValidator(dispatcher._type, method, "Params");
      const validatorContext = this._validatorFromWireContext();
      validParams = validator(params, "", validatorContext);
      validMetadata = metadataValidator(metadata, "", validatorContext);
      if (typeof dispatcher[method] !== "function")
        throw new Error(`Mismatching dispatcher: "${dispatcher._type}" does not implement "${method}"`);
    } catch (e) {
      this.onmessage({ id, error: errors.serializeError(e) });
      return;
    }
    if (protocolMetainfo.methodMetainfo.get(dispatcher._type + "." + method)?.internal) {
      validMetadata.internal = true;
    }
    const sdkObject = dispatcher._object;
    const callMetadata = {
      id: `call@${id}`,
      location: validMetadata.location,
      title: validMetadata.title,
      internal: validMetadata.internal,
      stepId: validMetadata.stepId,
      objectId: sdkObject.guid,
      pageId: sdkObject.attribution?.page?.guid,
      frameId: sdkObject.attribution?.frame?.guid,
      startTime: time.monotonicTime(),
      endTime: 0,
      type: dispatcher._type,
      method,
      params: params || {},
      log: []
    };
    if (params?.info?.waitId) {
      const info = params.info;
      switch (info.phase) {
        case "before": {
          this._waitOperations.set(info.waitId, callMetadata);
          await sdkObject.instrumentation.onBeforeCall(sdkObject, callMetadata);
          this.onmessage({ id });
          return;
        }
        case "log": {
          const originalMetadata = this._waitOperations.get(info.waitId);
          originalMetadata.log.push(info.message);
          sdkObject.instrumentation.onCallLog(sdkObject, originalMetadata, "api", info.message);
          this.onmessage({ id });
          return;
        }
        case "after": {
          const originalMetadata = this._waitOperations.get(info.waitId);
          originalMetadata.endTime = time.monotonicTime();
          originalMetadata.error = info.error ? { error: { name: "Error", message: info.error } } : void 0;
          this._waitOperations.delete(info.waitId);
          await sdkObject.instrumentation.onAfterCall(sdkObject, originalMetadata);
          this.onmessage({ id });
          return;
        }
      }
    }
    await sdkObject.instrumentation.onBeforeCall(sdkObject, callMetadata);
    const response = { id };
    try {
      const result = await dispatcher._runCommand(callMetadata, method, validParams);
      const validator = validatorPrimitives.findValidator(dispatcher._type, method, "Result");
      response.result = validator(result, "", this._validatorToWireContext());
      callMetadata.result = result;
    } catch (e) {
      if (errors.isTargetClosedError(e)) {
        const reason = closeReason(sdkObject);
        if (reason)
          stackTrace.rewriteErrorMessage(e, reason);
      } else if (protocolError.isProtocolError(e)) {
        if (e.type === "closed")
          e = new errors.TargetClosedError(closeReason(sdkObject), e.browserLogMessage());
        else if (e.type === "crashed")
          stackTrace.rewriteErrorMessage(e, "Target crashed " + e.browserLogMessage());
      }
      response.error = errors.serializeError(e);
      callMetadata.error = response.error;
    } finally {
      callMetadata.endTime = time.monotonicTime();
      await sdkObject.instrumentation.onAfterCall(sdkObject, callMetadata);
    }
    if (response.error)
      response.log = callLog.compressCallLog(callMetadata.log);
    this.onmessage(response);
  }
}
function closeReason(sdkObject) {
  return sdkObject.attribution.page?.closeReason || sdkObject.attribution.context?._closeReason || sdkObject.attribution.browser?._closeReason;
}

exports.Dispatcher = Dispatcher;
exports.DispatcherConnection = DispatcherConnection;
exports.RootDispatcher = RootDispatcher;
