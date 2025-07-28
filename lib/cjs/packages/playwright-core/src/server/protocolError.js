'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const stackTrace = require('../utils/isomorphic/stackTrace.js');

class ProtocolError extends Error {
  constructor(type, method, logs) {
    super();
    this.type = type;
    this.method = method;
    this.logs = logs;
  }
  setMessage(message) {
    stackTrace.rewriteErrorMessage(this, `Protocol error (${this.method}): ${message}`);
  }
  browserLogMessage() {
    return this.logs ? "\nBrowser logs:\n" + this.logs : "";
  }
}
function isProtocolError(e) {
  return e instanceof ProtocolError;
}
function isSessionClosedError(e) {
  return e instanceof ProtocolError && (e.type === "closed" || e.type === "crashed");
}

exports.ProtocolError = ProtocolError;
exports.isProtocolError = isProtocolError;
exports.isSessionClosedError = isSessionClosedError;
