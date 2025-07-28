import { urlMatches } from '../../../playwright-core/src/utils/isomorphic/urlMatch.js';
import '../../../../_virtual/pixelmatch.js';
import { colors } from '../../../playwright-core/src/utilsBundle.js';
import 'node:crypto';
import '../../../playwright-core/src/server/utils/debug.js';
import '../../../playwright-core/src/server/utils/debugLogger.js';
import '../../../../bundles/fs.js';
import 'node:path';
import '../../../playwright-core/src/zipBundle.js';
import '../../../playwright-core/src/server/utils/hostPlatform.js';
import 'node:http';
import 'node:http2';
import 'node:https';
import 'node:url';
import '../../../playwright-core/src/server/utils/happyEyeballs.js';
import '../../../playwright-core/src/server/utils/nodePlatform.js';
import 'node:child_process';
import 'node:readline';
import '../../../playwright-core/src/server/utils/profiler.js';
import '../../../playwright-core/src/server/utils/socksProxy.js';
import 'node:os';
import '../../../playwright-core/src/server/utils/zones.js';
import { printReceivedStringContainExpectedResult } from './expect.js';
import { matcherHint } from './matcherHint.js';
import { EXPECTED_COLOR, printReceived } from '../common/expectBundle.js';

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
        matcherHint(this, void 0, matcherName, expression, void 0, matcherOptions),
        `${colors.bold("Matcher error")}: ${EXPECTED_COLOR("expected")} value must be a string, regular expression, or predicate`,
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
          return !this.isNot === urlMatches(
            baseURL?.toLocaleLowerCase(),
            lastCheckedURLString.toLocaleLowerCase(),
            expected
          );
        }
        return !this.isNot === urlMatches(baseURL, lastCheckedURLString, expected);
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
  const messagePrefix = matcherHint(state, void 0, matcherName, expression, void 0, matcherOptions, timeout );
  let printedReceived;
  let printedExpected;
  let printedDiff;
  if (typeof expected === "function") {
    printedExpected = `Expected predicate to ${!state.isNot ? "succeed" : "fail"}`;
    printedReceived = `Received string: ${printReceived(receivedString)}`;
  } else {
    if (pass) {
      printedExpected = `Expected pattern: not ${state.utils.printExpected(expected)}`;
      const formattedReceived = printReceivedStringContainExpectedResult(receivedString, null);
      printedReceived = `Received string: ${formattedReceived}`;
    } else {
      const labelExpected = `Expected ${typeof expected === "string" ? "string" : "pattern"}`;
      printedDiff = state.utils.printDiffOrStringify(expected, receivedString, labelExpected, "Received string", false);
    }
  }
  const resultDetails = printedDiff ? printedDiff : printedExpected + "\n" + printedReceived;
  return messagePrefix + resultDetails;
}

export { toHaveURLWithPredicate };
