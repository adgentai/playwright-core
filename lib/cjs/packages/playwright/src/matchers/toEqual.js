'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const rtti = require('../../../playwright-core/src/utils/isomorphic/rtti.js');
require('../../../../_virtual/pixelmatch.js');
require('../../../playwright-core/src/utilsBundle.js');
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
const util = require('../util.js');
const matcherHint = require('./matcherHint.js');

const EXPECTED_LABEL = "Expected";
const RECEIVED_LABEL = "Received";
async function toEqual(matcherName, receiver, receiverType, query, expected, options = {}) {
  util.expectTypes(receiver, [receiverType], matcherName);
  const matcherOptions = {
    comment: options.contains ? "" : "deep equality",
    isNot: this.isNot,
    promise: this.promise
  };
  const timeout = options.timeout ?? this.timeout;
  const { matches: pass, received, log, timedOut } = await query(!!this.isNot, timeout);
  if (pass === !this.isNot) {
    return {
      name: matcherName,
      message: () => "",
      pass,
      expected
    };
  }
  let printedReceived;
  let printedExpected;
  let printedDiff;
  if (pass) {
    printedExpected = `Expected: not ${this.utils.printExpected(expected)}`;
    printedReceived = `Received: ${this.utils.printReceived(received)}`;
  } else if (Array.isArray(expected) && Array.isArray(received)) {
    const normalizedExpected = expected.map((exp, index) => {
      const rec = received[index];
      if (rtti.isRegExp(exp))
        return exp.test(rec) ? rec : exp;
      return exp;
    });
    printedDiff = this.utils.printDiffOrStringify(
      normalizedExpected,
      received,
      EXPECTED_LABEL,
      RECEIVED_LABEL,
      false
    );
  } else {
    printedDiff = this.utils.printDiffOrStringify(
      expected,
      received,
      EXPECTED_LABEL,
      RECEIVED_LABEL,
      false
    );
  }
  const message = () => {
    const header = matcherHint.matcherHint(this, receiver, matcherName, "locator", void 0, matcherOptions, timedOut ? timeout : void 0);
    const details = printedDiff || `${printedExpected}
${printedReceived}`;
    return `${header}${details}${util.callLogText(log)}`;
  };
  return {
    actual: received,
    expected,
    message,
    name: matcherName,
    pass,
    log,
    timeout: timedOut ? timeout : void 0
  };
}

exports.toEqual = toEqual;
