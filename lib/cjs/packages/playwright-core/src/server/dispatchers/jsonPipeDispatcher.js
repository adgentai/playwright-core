'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const dispatcher = require('./dispatcher.js');
const instrumentation = require('../instrumentation.js');

class JsonPipeDispatcher extends dispatcher.Dispatcher {
  constructor(scope) {
    super(scope, new instrumentation.SdkObject(scope._object, "jsonPipe"), "JsonPipe", {});
    this._type_JsonPipe = true;
  }
  async send(params, progress) {
    this.emit("message", params.message);
  }
  async close(params, progress) {
    this.emit("close");
    if (!this._disposed) {
      this._dispatchEvent("closed", {});
      this._dispose();
    }
  }
  dispatch(message) {
    if (!this._disposed)
      this._dispatchEvent("message", { message });
  }
  wasClosed(reason) {
    if (!this._disposed) {
      this._dispatchEvent("closed", { reason });
      this._dispose();
    }
  }
  dispose() {
    this._dispose();
  }
}

exports.JsonPipeDispatcher = JsonPipeDispatcher;
