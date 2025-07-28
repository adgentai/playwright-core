'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const serializers = require('../protocol/serializers.js');
const rtti = require('../utils/isomorphic/rtti.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
require('./utils/debug.js');
require('./utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../zipBundle.js');
require('./utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./utils/happyEyeballs.js');
require('./utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./utils/profiler.js');
require('./utils/socksProxy.js');
require('node:os');
require('./utils/zones.js');

class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
class TimeoutError extends CustomError {
}
class TargetClosedError extends CustomError {
  constructor(cause, logs) {
    super((cause || "Target page, context or browser has been closed") + (logs || ""));
  }
}
function isTargetClosedError(error) {
  return error instanceof TargetClosedError || error.name === "TargetClosedError";
}
function serializeError(e) {
  if (rtti.isError(e))
    return { error: { message: e.message, stack: e.stack, name: e.name } };
  return { value: serializers.serializeValue(e, (value) => ({ fallThrough: value })) };
}
function parseError(error) {
  if (!error.error) {
    if (error.value === void 0)
      throw new Error("Serialized error must have either an error or a value");
    return serializers.parseSerializedValue(error.value, void 0);
  }
  const e = new Error(error.error.message);
  e.stack = error.error.stack || "";
  e.name = error.error.name;
  return e;
}

exports.TargetClosedError = TargetClosedError;
exports.TimeoutError = TimeoutError;
exports.isTargetClosedError = isTargetClosedError;
exports.parseError = parseError;
exports.serializeError = serializeError;
