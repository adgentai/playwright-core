'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const assert = require('../../utils/isomorphic/assert.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
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
const utilityScriptSerializers = require('../../utils/isomorphic/utilityScriptSerializers.js');
const javascript = require('../javascript.js');
const dom = require('../dom.js');
const bidiDeserializer = require('./third_party/bidiDeserializer.js');
const bidiProtocolCore = require('./third_party/bidiProtocolCore.js');
require('./third_party/bidiProtocolPermissions.js');
const bidiSerializer = require('./third_party/bidiSerializer.js');

class BidiExecutionContext {
  constructor(session, realmInfo) {
    this._session = session;
    if (realmInfo.type === "window") {
      this._target = {
        context: realmInfo.context,
        sandbox: realmInfo.sandbox
      };
    } else {
      this._target = {
        realm: realmInfo.realm
      };
    }
  }
  async rawEvaluateJSON(expression) {
    const response = await this._session.send("script.evaluate", {
      expression,
      target: this._target,
      serializationOptions: {
        maxObjectDepth: 10,
        maxDomDepth: 10
      },
      awaitPromise: true,
      userActivation: true
    });
    if (response.type === "success")
      return bidiDeserializer.BidiDeserializer.deserialize(response.result);
    if (response.type === "exception")
      throw new javascript.JavaScriptErrorInEvaluate(response.exceptionDetails.text + "\nFull val: " + JSON.stringify(response.exceptionDetails));
    throw new javascript.JavaScriptErrorInEvaluate("Unexpected response type: " + JSON.stringify(response));
  }
  async rawEvaluateHandle(context, expression) {
    const response = await this._session.send("script.evaluate", {
      expression,
      target: this._target,
      resultOwnership: bidiProtocolCore.Script.ResultOwnership.Root,
      // Necessary for the handle to be returned.
      serializationOptions: { maxObjectDepth: 0, maxDomDepth: 0 },
      awaitPromise: true,
      userActivation: true
    });
    if (response.type === "success") {
      if ("handle" in response.result)
        return createHandle(context, response.result);
      throw new javascript.JavaScriptErrorInEvaluate("Cannot get handle: " + JSON.stringify(response.result));
    }
    if (response.type === "exception")
      throw new javascript.JavaScriptErrorInEvaluate(response.exceptionDetails.text + "\nFull val: " + JSON.stringify(response.exceptionDetails));
    throw new javascript.JavaScriptErrorInEvaluate("Unexpected response type: " + JSON.stringify(response));
  }
  async evaluateWithArguments(functionDeclaration, returnByValue, utilityScript, values, handles) {
    const response = await this._session.send("script.callFunction", {
      functionDeclaration,
      target: this._target,
      arguments: [
        { handle: utilityScript._objectId },
        ...values.map(bidiSerializer.BidiSerializer.serialize),
        ...handles.map((handle) => ({ handle: handle._objectId }))
      ],
      resultOwnership: returnByValue ? void 0 : bidiProtocolCore.Script.ResultOwnership.Root,
      // Necessary for the handle to be returned.
      serializationOptions: returnByValue ? {} : { maxObjectDepth: 0, maxDomDepth: 0 },
      awaitPromise: true,
      userActivation: true
    });
    if (response.type === "exception")
      throw new javascript.JavaScriptErrorInEvaluate(response.exceptionDetails.text + "\nFull val: " + JSON.stringify(response.exceptionDetails));
    if (response.type === "success") {
      if (returnByValue)
        return utilityScriptSerializers.parseEvaluationResultValue(bidiDeserializer.BidiDeserializer.deserialize(response.result));
      return createHandle(utilityScript._context, response.result);
    }
    throw new javascript.JavaScriptErrorInEvaluate("Unexpected response type: " + JSON.stringify(response));
  }
  async getProperties(handle) {
    const names = await handle.evaluate((object) => {
      const names2 = [];
      const descriptors = Object.getOwnPropertyDescriptors(object);
      for (const name in descriptors) {
        if (descriptors[name]?.enumerable)
          names2.push(name);
      }
      return names2;
    });
    const values = await Promise.all(names.map((name) => handle.evaluateHandle((object, name2) => object[name2], name)));
    const map = /* @__PURE__ */ new Map();
    for (let i = 0; i < names.length; i++)
      map.set(names[i], values[i]);
    return map;
  }
  async releaseHandle(handle) {
    if (!handle._objectId)
      return;
    await this._session.send("script.disown", {
      target: this._target,
      handles: [handle._objectId]
    });
  }
  async nodeIdForElementHandle(handle) {
    const shared = await this._remoteValueForReference({ handle: handle._objectId });
    if (!("sharedId" in shared))
      throw new Error("Element is not a node");
    return {
      sharedId: shared.sharedId
    };
  }
  async remoteObjectForNodeId(context, nodeId) {
    const result = await this._remoteValueForReference(nodeId, true);
    if (!("handle" in result))
      throw new Error("Can't get remote object for nodeId");
    return createHandle(context, result);
  }
  async contentFrameIdForFrame(handle) {
    const contentWindow = await this._rawCallFunction("e => e.contentWindow", { handle: handle._objectId });
    if (contentWindow?.type === "window")
      return contentWindow.value.context;
    return null;
  }
  async frameIdForWindowHandle(handle) {
    if (!handle._objectId)
      throw new Error("JSHandle is not a DOM node handle");
    const contentWindow = await this._remoteValueForReference({ handle: handle._objectId });
    if (contentWindow.type === "window")
      return contentWindow.value.context;
    return null;
  }
  async _remoteValueForReference(reference, createHandle2) {
    return await this._rawCallFunction("e => e", reference, createHandle2);
  }
  async _rawCallFunction(functionDeclaration, arg, createHandle2) {
    const response = await this._session.send("script.callFunction", {
      functionDeclaration,
      target: this._target,
      arguments: [arg],
      // "Root" is necessary for the handle to be returned.
      resultOwnership: createHandle2 ? bidiProtocolCore.Script.ResultOwnership.Root : bidiProtocolCore.Script.ResultOwnership.None,
      serializationOptions: { maxObjectDepth: 0, maxDomDepth: 0 },
      awaitPromise: true,
      userActivation: true
    });
    if (response.type === "exception")
      throw new javascript.JavaScriptErrorInEvaluate(response.exceptionDetails.text + "\nFull val: " + JSON.stringify(response.exceptionDetails));
    if (response.type === "success")
      return response.result;
    throw new javascript.JavaScriptErrorInEvaluate("Unexpected response type: " + JSON.stringify(response));
  }
}
function renderPreview(remoteObject) {
  if (remoteObject.type === "undefined")
    return "undefined";
  if (remoteObject.type === "null")
    return "null";
  if ("value" in remoteObject)
    return String(remoteObject.value);
  return `<${remoteObject.type}>`;
}
function remoteObjectValue(remoteObject) {
  if (remoteObject.type === "undefined")
    return void 0;
  if (remoteObject.type === "null")
    return null;
  if (remoteObject.type === "number" && typeof remoteObject.value === "string")
    return javascript.parseUnserializableValue(remoteObject.value);
  if ("value" in remoteObject)
    return remoteObject.value;
  return void 0;
}
function createHandle(context, remoteObject) {
  if (remoteObject.type === "node") {
    assert.assert(context instanceof dom.FrameExecutionContext);
    return new dom.ElementHandle(context, remoteObject.handle);
  }
  const objectId = "handle" in remoteObject ? remoteObject.handle : void 0;
  return new javascript.JSHandle(context, remoteObject.type, renderPreview(remoteObject), objectId, remoteObjectValue(remoteObject));
}

exports.BidiExecutionContext = BidiExecutionContext;
exports.createHandle = createHandle;
