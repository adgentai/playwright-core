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
import { expectTypes, callLogText } from '../util.js';
import { printReceivedStringContainExpectedSubstring, printReceivedStringContainExpectedResult } from './expect.js';
import { matcherHint, kNoElementsFoundError } from './matcherHint.js';
import { EXPECTED_COLOR } from '../common/expectBundle.js';

async function toMatchText(matcherName, receiver, receiverType, query, expected, options = {}) {
  expectTypes(receiver, [receiverType], matcherName);
  const matcherOptions = {
    isNot: this.isNot,
    promise: this.promise
  };
  if (!(typeof expected === "string") && !(expected && typeof expected.test === "function")) {
    throw new Error([
      matcherHint(this, receiverType === "Locator" ? receiver : void 0, matcherName, options.receiverLabel ?? receiver, expected, matcherOptions),
      `${colors.bold("Matcher error")}: ${EXPECTED_COLOR("expected")} value must be a string or regular expression`,
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
  const messagePrefix = matcherHint(this, receiverType === "Locator" ? receiver : void 0, matcherName, options.receiverLabel ?? "locator", void 0, matcherOptions, timedOut ? timeout : void 0);
  const notFound = received === kNoElementsFoundError;
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
        const formattedReceived = printReceivedStringContainExpectedSubstring(receivedString, receivedString.indexOf(expected), expected.length);
        printedReceived = `Received string: ${formattedReceived}`;
      }
    } else {
      if (notFound) {
        printedExpected = `Expected pattern: not ${this.utils.printExpected(expected)}`;
        printedReceived = `Received: ${received}`;
      } else {
        printedExpected = `Expected pattern: not ${this.utils.printExpected(expected)}`;
        const formattedReceived = printReceivedStringContainExpectedResult(receivedString, typeof expected.exec === "function" ? expected.exec(receivedString) : null);
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
    return messagePrefix + resultDetails + callLogText(log);
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

export { toMatchText };
