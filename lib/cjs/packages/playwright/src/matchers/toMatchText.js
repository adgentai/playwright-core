'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

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
const util = require('../util.js');
const expect = require('./expect.js');
const matcherHint = require('./matcherHint.js');
const expectBundle = require('../common/expectBundle.js');

async function toMatchText(matcherName, receiver, receiverType, query, expected, options = {}) {
  util.expectTypes(receiver, [receiverType], matcherName);
  const matcherOptions = {
    isNot: this.isNot,
    promise: this.promise
  };
  if (!(typeof expected === "string") && !(expected && typeof expected.test === "function")) {
    throw new Error([
      matcherHint.matcherHint(this, receiverType === "Locator" ? receiver : void 0, matcherName, options.receiverLabel ?? receiver, expected, matcherOptions),
      `${utilsBundle.colors.bold("Matcher error")}: ${expectBundle.EXPECTED_COLOR("expected")} value must be a string or regular expression`,
      this.utils.printWithType("Expected", expected, this.utils.printExpected)
    ].join("\n\n"));
  }
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
  const stringSubstring = options.matchSubstring ? "substring" : "string";
  const receivedString = received || "";
  const messagePrefix = matcherHint.matcherHint(this, receiverType === "Locator" ? receiver : void 0, matcherName, options.receiverLabel ?? "locator", void 0, matcherOptions, timedOut ? timeout : void 0);
  const notFound = received === matcherHint.kNoElementsFoundError;
  let printedReceived;
  let printedExpected;
  let printedDiff;
  if (pass) {
    if (typeof expected === "string") {
      if (notFound) {
        printedExpected = `Expected ${stringSubstring}: not ${this.utils.printExpected(expected)}`;
        printedReceived = `Received: ${received}`;
      } else {
        printedExpected = `Expected ${stringSubstring}: not ${this.utils.printExpected(expected)}`;
        const formattedReceived = expect.printReceivedStringContainExpectedSubstring(receivedString, receivedString.indexOf(expected), expected.length);
        printedReceived = `Received string: ${formattedReceived}`;
      }
    } else {
      if (notFound) {
        printedExpected = `Expected pattern: not ${this.utils.printExpected(expected)}`;
        printedReceived = `Received: ${received}`;
      } else {
        printedExpected = `Expected pattern: not ${this.utils.printExpected(expected)}`;
        const formattedReceived = expect.printReceivedStringContainExpectedResult(receivedString, typeof expected.exec === "function" ? expected.exec(receivedString) : null);
        printedReceived = `Received string: ${formattedReceived}`;
      }
    }
  } else {
    const labelExpected = `Expected ${typeof expected === "string" ? stringSubstring : "pattern"}`;
    if (notFound) {
      printedExpected = `${labelExpected}: ${this.utils.printExpected(expected)}`;
      printedReceived = `Received: ${received}`;
    } else {
      printedDiff = this.utils.printDiffOrStringify(expected, receivedString, labelExpected, "Received string", false);
    }
  }
  const message = () => {
    const resultDetails = printedDiff ? printedDiff : printedExpected + "\n" + printedReceived;
    return messagePrefix + resultDetails + util.callLogText(log);
  };
  return {
    name: matcherName,
    expected,
    message,
    pass,
    actual: received,
    log,
    timeout: timedOut ? timeout : void 0
  };
}

exports.toMatchText = toMatchText;
