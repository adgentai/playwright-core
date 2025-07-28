import { stringifyStackFrames } from '../../../playwright-core/src/utils/isomorphic/stackTrace.js';
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

const kNoElementsFoundError = "<element(s) not found>";
function matcherHint(state, locator, matcherName, expression, actual, matcherOptions, timeout) {
  let header = state.utils.matcherHint(matcherName, expression, actual, matcherOptions).replace(/ \/\/ deep equality/, "") + "\n\n";
  if (timeout)
    header = colors.red(`Timed out ${timeout}ms waiting for `) + header;
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
    this.stack = this.name + ": " + this.message + "\n" + stringifyStackFrames(stackFrames).join("\n");
  }
}
function isJestError(e) {
  return e instanceof Error && "matcherResult" in e;
}

export { ExpectError, isJestError, kNoElementsFoundError, matcherHint };
