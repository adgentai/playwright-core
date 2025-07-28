import { assert } from '../../utils/isomorphic/assert.js';
import '../../../../../_virtual/pixelmatch.js';
import '../../utilsBundle.js';
import 'node:crypto';
import '../utils/debug.js';
import '../utils/debugLogger.js';
import '../../../../../bundles/fs.js';
import 'node:path';
import '../../zipBundle.js';
import '../utils/hostPlatform.js';
import 'node:http';
import 'node:http2';
import 'node:https';
import 'node:url';
import '../utils/happyEyeballs.js';
import '../utils/nodePlatform.js';
import 'node:child_process';
import 'node:readline';
import '../utils/profiler.js';
import '../utils/socksProxy.js';
import 'node:os';
import '../utils/zones.js';
import { parseEvaluationResultValue } from '../../utils/isomorphic/utilityScriptSerializers.js';
import { JavaScriptErrorInEvaluate, JSHandle, parseUnserializableValue } from '../javascript.js';
import { FrameExecutionContext, ElementHandle } from '../dom.js';
import { BidiDeserializer } from './third_party/bidiDeserializer.js';
import { Script } from './third_party/bidiProtocolCore.js';
import './third_party/bidiProtocolPermissions.js';
import { BidiSerializer } from './third_party/bidiSerializer.js';

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
      return BidiDeserializer.deserialize(response.result);
    if (response.type === "exception")
      throw new JavaScriptErrorInEvaluate(response.exceptionDetails.text + "\nFull val: " + JSON.stringify(response.exceptionDetails));
    throw new JavaScriptErrorInEvaluate("Unexpected response type: " + JSON.stringify(response));
  }
  async rawEvaluateHandle(context, expression) {
    const response = await this._session.send("script.evaluate", {
      expression,
      target: this._target,
      resultOwnership: Script.ResultOwnership.Root,
      // Necessary for the handle to be returned.
      serializationOptions: { maxObjectDepth: 0, maxDomDepth: 0 },
      awaitPromise: true,
      userActivation: true
    });
    if (response.type === "success") {
      if ("handle" in response.result)
        return createHandle(context, response.result);
      throw new JavaScriptErrorInEvaluate("Cannot get handle: " + JSON.stringify(response.result));
    }
    if (response.type === "exception")
      throw new JavaScriptErrorInEvaluate(response.exceptionDetails.text + "\nFull val: " + JSON.stringify(response.exceptionDetails));
    throw new JavaScriptErrorInEvaluate("Unexpected response type: " + JSON.stringify(response));
  }
  async evaluateWithArguments(functionDeclaration, returnByValue, utilityScript, values, handles) {
    const response = await this._session.send("script.callFunction", {
      functionDeclaration,
      target: this._target,
      arguments: [
        { handle: utilityScript._objectId },
        ...values.map(BidiSerializer.serialize),
        ...handles.map((handle) => ({ handle: handle._objectId }))
      ],
      resultOwnership: returnByValue ? void 0 : Script.ResultOwnership.Root,
      // Necessary for the handle to be returned.
      serializationOptions: returnByValue ? {} : { maxObjectDepth: 0, maxDomDepth: 0 },
      awaitPromise: true,
      userActivation: true
    });
    if (response.type === "exception")
      throw new JavaScriptErrorInEvaluate(response.exceptionDetails.text + "\nFull val: " + JSON.stringify(response.exceptionDetails));
    if (response.type === "success") {
      if (returnByValue)
        return parseEvaluationResultValue(BidiDeserializer.deserialize(response.result));
      return createHandle(utilityScript._context, response.result);
    }
    throw new JavaScriptErrorInEvaluate("Unexpected response type: " + JSON.stringify(response));
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
      resultOwnership: createHandle2 ? Script.ResultOwnership.Root : Script.ResultOwnership.None,
      serializationOptions: { maxObjectDepth: 0, maxDomDepth: 0 },
      awaitPromise: true,
      userActivation: true
    });
    if (response.type === "exception")
      throw new JavaScriptErrorInEvaluate(response.exceptionDetails.text + "\nFull val: " + JSON.stringify(response.exceptionDetails));
    if (response.type === "success")
      return response.result;
    throw new JavaScriptErrorInEvaluate("Unexpected response type: " + JSON.stringify(response));
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
    return parseUnserializableValue(remoteObject.value);
  if ("value" in remoteObject)
    return remoteObject.value;
  return void 0;
}
function createHandle(context, remoteObject) {
  if (remoteObject.type === "node") {
    assert(context instanceof FrameExecutionContext);
    return new ElementHandle(context, remoteObject.handle);
  }
  const objectId = "handle" in remoteObject ? remoteObject.handle : void 0;
  return new JSHandle(context, remoteObject.type, renderPreview(remoteObject), objectId, remoteObjectValue(remoteObject));
}

export { BidiExecutionContext, createHandle };
