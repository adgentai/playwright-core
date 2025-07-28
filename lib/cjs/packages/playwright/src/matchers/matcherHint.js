'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const stackTrace = require('../../../playwright-core/src/utils/isomorphic/stackTrace.js');
require('../../../../_virtual/pixelmatch.js');
const utilsBundle = require('../../../playwright-core/src/utilsBundle.js');
require('node:crypto');
require('../../../playwright-core/src/server/utils/debug.js');
require('../../../playwright-core/src/server/utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../../../playwright-core/src/zipBundle.js');
require('../../../playwright-core/src/server/utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../../../playwright-core/src/server/utils/happyEyeballs.js');
require('../../../playwright-core/src/server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('../../../playwright-core/src/server/utils/profiler.js');
require('../../../playwright-core/src/server/utils/socksProxy.js');
require('node:os');
require('../../../playwright-core/src/server/utils/zones.js');

const kNoElementsFoundError = "<element(s) not found>";
function matcherHint(state, locator, matcherName, expression, actual, matcherOptions, timeout) {
  let header = state.utils.matcherHint(matcherName, expression, actual, matcherOptions).replace(/ \/\/ deep equality/, "") + "\n\n";
  if (timeout)
    header = utilsBundle.colors.red(`Timed out ${timeout}ms waiting for `) + header;
  if (locator)
    header += `Locator: ${String(locator)}
`;
  return header;
}
class ExpectError extends Error {
  constructor(jestError, customMessage, stackFrames) {
    super("");
    this.name = jestError.name;
    this.message = jestError.message;
    this.matcherResult = jestError.matcherResult;
    if (customMessage)
      this.message = customMessage + "\n\n" + this.message;
    this.stack = this.name + ": " + this.message + "\n" + stackTrace.stringifyStackFrames(stackFrames).join("\n");
  }
}
function isJestError(e) {
  return e instanceof Error && "matcherResult" in e;
}

exports.ExpectError = ExpectError;
exports.isJestError = isJestError;
exports.kNoElementsFoundError = kNoElementsFoundError;
exports.matcherHint = matcherHint;
