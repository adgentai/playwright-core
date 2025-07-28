'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

let currentTestInfoValue = null;
function setCurrentTestInfo(testInfo) {
  currentTestInfoValue = testInfo;
}
function currentTestInfo() {
  return currentTestInfoValue;
}
let currentFileSuite;
function setCurrentlyLoadingFileSuite(suite) {
  currentFileSuite = suite;
}
function currentlyLoadingFileSuite() {
  return currentFileSuite;
}

exports.currentTestInfo = currentTestInfo;
exports.currentlyLoadingFileSuite = currentlyLoadingFileSuite;
exports.setCurrentTestInfo = setCurrentTestInfo;
exports.setCurrentlyLoadingFileSuite = setCurrentlyLoadingFileSuite;
