'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const assert = require('../../utils/isomorphic/assert.js');
const stackTrace = require('../../utils/isomorphic/stackTrace.js');
const utilityScriptSerializers = require('../../utils/isomorphic/utilityScriptSerializers.js');
const javascript = require('../javascript.js');
const dom = require('../dom.js');
const protocolError = require('../protocolError.js');

class FFExecutionContext {
  constructor(session, executionContextId) {
    this._session = session;
    this._executionContextId = executionContextId;
  }
  async rawEvaluateJSON(expression) {
    const payload = await this._session.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      executionContextId: this._executionContextId
    }).catch(rewriteError);
    checkException(payload.exceptionDetails);
    return payload.result.value;
  }
  async rawEvaluateHandle(context, expression) {
    const payload = await this._session.send("Runtime.evaluate", {
      expression,
      returnByValue: false,
      executionContextId: this._executionContextId
    }).catch(rewriteError);
    checkException(payload.exceptionDetails);
    return createHandle(context, payload.result);
  }
  async evaluateWithArguments(expression, returnByValue, utilityScript, values, handles) {
    const payload = await this._session.send("Runtime.callFunction", {
      functionDeclaration: expression,
      args: [
        { objectId: utilityScript._objectId, value: void 0 },
        ...values.map((value) => ({ value })),
        ...handles.map((handle) => ({ objectId: handle._objectId, value: void 0 }))
      ],
      returnByValue,
      executionContextId: this._executionContextId
    }).catch(rewriteError);
    checkException(payload.exceptionDetails);
    if (returnByValue)
      return utilityScriptSerializers.parseEvaluationResultValue(payload.result.value);
    return createHandle(utilityScript._context, payload.result);
  }
  async getProperties(object) {
    const response = await this._session.send("Runtime.getObjectProperties", {
      executionContextId: this._executionContextId,
      objectId: object._objectId
    });
    const result = /* @__PURE__ */ new Map();
    for (const property of response.properties)
      result.set(property.name, createHandle(object._context, property.value));
    return result;
  }
  async releaseHandle(handle) {
    if (!handle._objectId)
      return;
    await this._session.send("Runtime.disposeObject", {
      executionContextId: this._executionContextId,
      objectId: handle._objectId
    });
  }
}
function checkException(exceptionDetails) {
  if (!exceptionDetails)
    return;
  if (exceptionDetails.value)
    throw new javascript.JavaScriptErrorInEvaluate(JSON.stringify(exceptionDetails.value));
  else
    throw new javascript.JavaScriptErrorInEvaluate(exceptionDetails.text + (exceptionDetails.stack ? "\n" + exceptionDetails.stack : ""));
}
function rewriteError(error) {
  if (error.message.includes("cyclic object value") || error.message.includes("Object is not serializable"))
    return { result: { type: "undefined", value: void 0 } };
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
  if (object.unserializableValue)
    return String(object.unserializableValue);
  if (object.type === "symbol")
    return "Symbol()";
  if (object.subtype === "regexp")
    return "RegExp";
  if (object.subtype === "weakmap")
    return "WeakMap";
  if (object.subtype === "weakset")
    return "WeakSet";
  if (object.subtype)
    return object.subtype[0].toUpperCase() + object.subtype.slice(1);
  if ("value" in object)
    return String(object.value);
}
function createHandle(context, remoteObject) {
  if (remoteObject.subtype === "node") {
    assert.assert(context instanceof dom.FrameExecutionContext);
    return new dom.ElementHandle(context, remoteObject.objectId);
  }
  return new javascript.JSHandle(context, remoteObject.subtype || remoteObject.type || "", renderPreview(remoteObject), remoteObject.objectId, potentiallyUnserializableValue(remoteObject));
}

exports.FFExecutionContext = FFExecutionContext;
exports.createHandle = createHandle;
