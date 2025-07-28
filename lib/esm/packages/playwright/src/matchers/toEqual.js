import { isRegExp } from '../../../playwright-core/src/utils/isomorphic/rtti.js';
import '../../../../_virtual/pixelmatch.js';
import '../../../playwright-core/src/utilsBundle.js';
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
import { matcherHint } from './matcherHint.js';

const EXPECTED_LABEL = "Expected";
const RECEIVED_LABEL = "Received";
async function toEqual(matcherName, receiver, receiverType, query, expected, options = {}) {
  expectTypes(receiver, [receiverType], matcherName);
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
      if (isRegExp(exp))
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
    const header = matcherHint(this, receiver, matcherName, "locator", void 0, matcherOptions, timedOut ? timeout : void 0);
    const details = printedDiff || `${printedExpected}
${printedReceived}`;
    return `${header}${details}${callLogText(log)}`;
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

export { toEqual };
