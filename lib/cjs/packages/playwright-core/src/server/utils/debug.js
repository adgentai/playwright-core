'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const env = require('./env.js');

const _debugMode = env.getFromENV("PWDEBUG") || "";
function debugMode() {
  if (_debugMode === "console")
    return "console";
  if (_debugMode === "0" || _debugMode === "false")
    return "";
  return _debugMode ? "inspector" : "";
}
const _isUnderTest = env.getAsBooleanFromENV("PWTEST_UNDER_TEST");
function isUnderTest() {
  return _isUnderTest;
}

exports.debugMode = debugMode;
exports.isUnderTest = isUnderTest;
