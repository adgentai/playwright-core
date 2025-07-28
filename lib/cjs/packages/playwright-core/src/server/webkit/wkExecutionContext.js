'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const javascript = require('../javascript.js');
const dom = require('../dom.js');
const protocolError = require('../protocolError.js');
const assert = require('../../utils/isomorphic/assert.js');
const utilityScriptSerializers = require('../../utils/isomorphic/utilityScriptSerializers.js');

class WKExecutionContext {
  constructor(session, contextId) {
    this._session = session;
    this._contextId = contextId;
  }
  async rawEvaluateJSON(expression) {
    try {
      const response = await this._session.send("Runtime.evaluate", {
        expression,
        contextId: this._contextId,
        returnByValue: true
      });
      if (response.wasThrown)
        throw new javascript.JavaScriptErrorInEvaluate(response.result.description);
      return response.result.value;
    } catch (error) {
      throw rewriteError(error);
    }
  }
  async rawEvaluateHandle(context, expression) {
    try {
      const response = await this._session.send("Runtime.evaluate", {
        expression,
        contextId: this._contextId,
        returnByValue: false
      });
      if (response.wasThrown)
        throw new javascript.JavaScriptErrorInEvaluate(response.result.description);
      return createHandle(context, response.result);
    } catch (error) {
      throw rewriteError(error);
    }
  }
  async evaluateWithArguments(expression, returnByValue, utilityScript, values, handles) {
    try {
      const response = await this._session.send("Runtime.callFunctionOn", {
        functionDeclaration: expression,
        objectId: utilityScript._objectId,
        arguments: [
          { objectId: utilityScript._objectId },
          ...values.map((value) => ({ value })),
          ...handles.map((handle) => ({ objectId: handle._objectId }))
        ],
        returnByValue,
        emulateUserGesture: true,
        awaitPromise: true
      });
      if (response.wasThrown)
        throw new javascript.JavaScriptErrorInEvaluate(response.result.description);
      if (returnByValue)
        return utilityScriptSerializers.parseEvaluationResultValue(response.result.value);
      return createHandle(utilityScript._context, response.result);
    } catch (error) {
      throw rewriteError(error);
    }
  }
  async getProperties(object) {
    const response = await this._session.send("Runtime.getProperties", {
      objectId: object._objectId,
      ownProperties: true
    });
    const result = /* @__PURE__ */ new Map();
    for (const property of response.properties) {
      if (!property.enumerable || !property.value)
        continue;
      result.set(property.name, createHandle(object._context, property.value));
    }
    return result;
  }
  async releaseHandle(handle) {
    if (!handle._objectId)
      return;
    await this._session.send("Runtime.releaseObject", { objectId: handle._objectId });
  }
}
function potentiallyUnserializableValue(remoteObject) {
  const value = remoteObject.value;
  const isUnserializable = remoteObject.type === "number" && ["NaN", "-Infinity", "Infinity", "-0"].includes(remoteObject.description);
  return isUnserializable ? javascript.parseUnserializableValue(remoteObject.description) : value;
}
function rewriteError(error) {
  if (error.message.includes("Object has too long reference chain"))
    throw new Error("Cannot serialize result: object reference chain is too long.");
  if (!javascript.isJavaScriptErrorInEvaluate(error) && !protocolError.isSessionClosedError(error))
    return new Error("Execution context was destroyed, most likely because of a navigation.");
  return error;
}
function renderPreview(object) {
  if (object.type === "undefined")
    return "undefined";
  if ("value" in object)
    return String(object.value);
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
  const isPromise = remoteObject.className === "Promise";
  return new javascript.JSHandle(context, isPromise ? "promise" : remoteObject.subtype || remoteObject.type, renderPreview(remoteObject), remoteObject.objectId, potentiallyUnserializableValue(remoteObject));
}

exports.WKExecutionContext = WKExecutionContext;
exports.createHandle = createHandle;
