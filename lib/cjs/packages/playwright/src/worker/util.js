'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const util = require('../util.js');

function testInfoError(error) {
  return util.serializeError(error);
}

exports.testInfoError = testInfoError;
