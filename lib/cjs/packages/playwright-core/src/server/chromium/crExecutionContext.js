'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const assert = require('../../utils/isomorphic/assert.js');
const crProtocolHelper = require('./crProtocolHelper.js');
const stackTrace = require('../../utils/isomorphic/stackTrace.js');
const utilityScriptSerializers = require('../../utils/isomorphic/utilityScriptSerializers.js');
const javascript = require('../javascript.js');
const dom = require('../dom.js');
const protocolError = require('../protocolError.js');

class CRExecutionContext {
  constructor(client, contextPayload) {
    this._client = client;
    this._contextId = contextPayload.id;
  }
  async rawEvaluateJSON(expression) {
    const { exceptionDetails, result: remoteObject } = await this._client.send("Runtime.evaluate", {
      expression,
      contextId: this._contextId,
      returnByValue: true
    }).catch(rewriteError);
    if (exceptionDetails)
      throw new javascript.JavaScriptErrorInEvaluate(crProtocolHelper.getExceptionMessage(exceptionDetails));
    return remoteObject.value;
  }
  async rawEvaluateHandle(context, expression) {
    const { exceptionDetails, result: remoteObject } = await this._client.send("Runtime.evaluate", {
      expression,
      contextId: this._contextId
    }).catch(rewriteError);
    if (exceptionDetails)
      throw new javascript.JavaScriptErrorInEvaluate(crProtocolHelper.getExceptionMessage(exceptionDetails));
    return createHandle(context, remoteObject);
  }
  async evaluateWithArguments(expression, returnByValue, utilityScript, values, handles) {
    const { exceptionDetails, result: remoteObject } = await this._client.send("Runtime.callFunctionOn", {
      functionDeclaration: expression,
      objectId: utilityScript._objectId,
      arguments: [
        { objectId: utilityScript._objectId },
        ...values.map((value) => ({ value })),
        ...handles.map((handle) => ({ objectId: handle._objectId }))
      ],
      returnByValue,
      awaitPromise: true,
      userGesture: true
    }).catch(rewriteError);
    if (exceptionDetails)
      throw new javascript.JavaScriptErrorInEvaluate(crProtocolHelper.getExceptionMessage(exceptionDetails));
    return returnByValue ? utilityScriptSerializers.parseEvaluationResultValue(remoteObject.value) : createHandle(utilityScript._context, remoteObject);
  }
  async getProperties(object) {
    const response = await this._client.send("Runtime.getProperties", {
      objectId: object._objectId,
      ownProperties: true
    });
    const result = /* @__PURE__ */ new Map();
    for (const property of response.result) {
      if (!property.enumerable || !property.value)
        continue;
      result.set(property.name, createHandle(object._context, property.value));
    }
    return result;
  }
  async releaseHandle(handle) {
    if (!handle._objectId)
      return;
    await crProtocolHelper.releaseObject(this._client, handle._objectId);
  }
}
function rewriteError(error) {
  if (error.message.includes("Object reference chain is too long"))
    throw new Error("Cannot serialize result: object reference chain is too long.");
  if (error.message.includes("Object couldn't be returned by value"))
    return { result: { type: "undefined" } };
  if (error instanceof TypeError && error.message.startsWith("Converting circular structure to JSON"))
    stackTrace.rewriteErrorMessage(error, error.message + " Are you passing a nested JSHandle?");
  if (!javascript.isJavaScriptErrorInEvaluate(error) && !protocolError.isSessionClosedError(error))
    throw new Error("Execution context was destroyed, most likely because of a navigation.");
  throw error;
}
function potentiallyUnserializableValue(remoteObject) {
  const value = remoteObject.value;
  const unserializableValue = remoteObject.unserializableValue;
  return unserializableValue ? javascript.parseUnserializableValue(unserializableValue) : value;
}
function renderPreview(object) {
  if (object.type === "undefined")
    return "undefined";
  if ("value" in object)
    return String(object.value);
  if (object.unserializableValue)
    return String(object.unserializableValue);
  if (object.description === "Object" && object.preview) {
    const tokens = [];
    for (const { name, value } of object.preview.properties)
      tokens.push(`${name}: ${value}`);
    return `{${tokens.join(", ")}}`;
  }
  if (object.subtype === "array" && object.preview)
    return javascript.sparseArrayToString(object.preview.properties);
  return object.description;
}
function createHandle(context, remoteObject) {
  if (remoteObject.subtype === "node") {
    assert.assert(context instanceof dom.FrameExecutionContext);
    return new dom.ElementHandle(context, remoteObject.objectId);
  }
  return new javascript.JSHandle(context, remoteObject.subtype || remoteObject.type, renderPreview(remoteObject), remoteObject.objectId, potentiallyUnserializableValue(remoteObject));
}

exports.CRExecutionContext = CRExecutionContext;
exports.createHandle = createHandle;
