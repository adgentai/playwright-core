'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

function assert(value, message) {
  if (!value)
    throw new Error(message || "Assertion error");
}

exports.assert = assert;
