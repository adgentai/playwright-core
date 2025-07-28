'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const globals = require('../packages/playwright/src/common/globals.js');
const internal = require('../internal.js');

const requireOrImport = (file) => {
  if (file === internal.configLocation.resolvedConfigFile)
    return internal.playwrightTestConfig;
};
function setSingleTSConfig() {
}
function wrapFunctionWithLocation(func) {
  return (...args) => {
    const location = {
      file: globals.currentlyLoadingFileSuite()?._requireFile || "",
      line: 0,
      column: 0
    };
    return func(location, ...args);
  };
}

exports.requireOrImport = requireOrImport;
exports.setSingleTSConfig = setSingleTSConfig;
exports.wrapFunctionWithLocation = wrapFunctionWithLocation;
