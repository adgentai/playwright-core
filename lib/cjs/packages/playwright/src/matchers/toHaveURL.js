'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const urlMatch = require('../../../playwright-core/src/utils/isomorphic/urlMatch.js');
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
const expect = require('./expect.js');
const matcherHint = require('./matcherHint.js');
const expectBundle = require('../common/expectBundle.js');

async function toHaveURLWithPredicate(page, expected, options) {
  const matcherName = "toHaveURL";
  const expression = "page";
  const matcherOptions = {
    isNot: this.isNot,
    promise: this.promise
  };
  if (typeof expected !== "function") {
    throw new Error(
      [
        // Always display `expected` in expectation place
        matcherHint.matcherHint(this, void 0, matcherName, expression, void 0, matcherOptions),
        `${utilsBundle.colors.bold("Matcher error")}: ${expectBundle.EXPECTED_COLOR("expected")} value must be a string, regular expression, or predicate`,
        this.utils.printWithType("Expected", expected, this.utils.printExpected)
      ].join("\n\n")
    );
  }
  const timeout = options?.timeout ?? this.timeout;
  const baseURL = page.context()._options.baseURL;
  let conditionSucceeded = false;
  let lastCheckedURLString = void 0;
  try {
    await page.mainFrame().waitForURL(
      (url) => {
        lastCheckedURLString = url.toString();
        if (options?.ignoreCase) {
          return !this.isNot === urlMatch.urlMatches(
            baseURL?.toLocaleLowerCase(),
            lastCheckedURLString.toLocaleLowerCase(),
            expected
          );
        }
        return !this.isNot === urlMatch.urlMatches(baseURL, lastCheckedURLString, expected);
      },
      { timeout }
    );
    conditionSucceeded = true;
  } catch (e) {
    conditionSucceeded = false;
  }
  if (conditionSucceeded)
    return { name: matcherName, pass: !this.isNot, message: () => "" };
  return {
    name: matcherName,
    pass: this.isNot,
    message: () => toHaveURLMessage(
      this,
      matcherName,
      expression,
      expected,
      lastCheckedURLString,
      this.isNot,
      true,
      timeout
    ),
    actual: lastCheckedURLString,
    timeout
  };
}
function toHaveURLMessage(state, matcherName, expression, expected, received, pass, didTimeout, timeout) {
  const matcherOptions = {
    isNot: state.isNot,
    promise: state.promise
  };
  const receivedString = received || "";
  const messagePrefix = matcherHint.matcherHint(state, void 0, matcherName, expression, void 0, matcherOptions, timeout );
  let printedReceived;
  let printedExpected;
  let printedDiff;
  if (typeof expected === "function") {
    printedExpected = `Expected predicate to ${!state.isNot ? "succeed" : "fail"}`;
    printedReceived = `Received string: ${expectBundle.printReceived(receivedString)}`;
  } else {
    if (pass) {
      printedExpected = `Expected pattern: not ${state.utils.printExpected(expected)}`;
      const formattedReceived = expect.printReceivedStringContainExpectedResult(receivedString, null);
      printedReceived = `Received string: ${formattedReceived}`;
    } else {
      const labelExpected = `Expected ${typeof expected === "string" ? "string" : "pattern"}`;
      printedDiff = state.utils.printDiffOrStringify(expected, receivedString, labelExpected, "Received string", false);
    }
  }
  const resultDetails = printedDiff ? printedDiff : printedExpected + "\n" + printedReceived;
  return messagePrefix + resultDetails;
}

exports.toHaveURLWithPredicate = toHaveURLWithPredicate;
