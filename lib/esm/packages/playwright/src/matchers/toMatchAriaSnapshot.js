import fs from '../../../../bundles/fs.js';
import path from 'node:path';
import { isString, escapeTemplateString } from '../../../playwright-core/src/utils/isomorphic/stringUtils.js';
import '../../../../_virtual/pixelmatch.js';
import '../../../playwright-core/src/utilsBundle.js';
import 'node:crypto';
import '../../../playwright-core/src/server/utils/debug.js';
import '../../../playwright-core/src/server/utils/debugLogger.js';
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
import { matcherHint, kNoElementsFoundError } from './matcherHint.js';
import { EXPECTED_COLOR } from '../common/expectBundle.js';
import { fileExistsAsync, callLogText } from '../util.js';
import { printReceivedStringContainExpectedSubstring } from './expect.js';
import { currentTestInfo } from '../common/globals.js';

async function toMatchAriaSnapshot(receiver, expectedParam, options = {}) {
  const matcherName = "toMatchAriaSnapshot";
  const testInfo = currentTestInfo();
  if (!testInfo)
    throw new Error(`toMatchAriaSnapshot() must be called during the test`);
  if (testInfo._projectInternal.ignoreSnapshots)
    return { pass: !this.isNot, message: () => "", name: "toMatchAriaSnapshot", expected: "" };
  const updateSnapshots = testInfo.config.updateSnapshots;
  const matcherOptions = {
    isNot: this.isNot,
    promise: this.promise
  };
  let expected;
  let timeout;
  let expectedPath;
  if (isString(expectedParam)) {
    expected = expectedParam;
    timeout = options.timeout ?? this.timeout;
  } else {
    const legacyPath = testInfo._resolveSnapshotPaths("aria", expectedParam?.name, "dontUpdateSnapshotIndex", ".yml").absoluteSnapshotPath;
    expectedPath = testInfo._resolveSnapshotPaths("aria", expectedParam?.name, "updateSnapshotIndex").absoluteSnapshotPath;
    if (!await fileExistsAsync(expectedPath) && await fileExistsAsync(legacyPath))
      expectedPath = legacyPath;
    expected = await fs.promises.readFile(expectedPath, "utf8").catch(() => "");
    timeout = expectedParam?.timeout ?? this.timeout;
  }
  const generateMissingBaseline = updateSnapshots === "missing" && !expected;
  if (generateMissingBaseline) {
    if (this.isNot) {
      const message2 = `Matchers using ".not" can't generate new baselines`;
      return { pass: this.isNot, message: () => message2, name: "toMatchAriaSnapshot" };
    } else {
      expected = `- none "Generating new baseline"`;
    }
  }
  expected = unshift(expected);
  const { matches: pass, received, log, timedOut } = await receiver._expect("to.match.aria", { expectedValue: expected, isNot: this.isNot, timeout });
  const typedReceived = received;
  const messagePrefix = matcherHint(this, receiver, matcherName, "locator", void 0, matcherOptions, timedOut ? timeout : void 0);
  const notFound = typedReceived === kNoElementsFoundError;
  if (notFound) {
    return {
      pass: this.isNot,
      message: () => messagePrefix + `Expected: ${this.utils.printExpected(expected)}
Received: ${EXPECTED_COLOR("<element not found>")}` + callLogText(log),
      name: "toMatchAriaSnapshot",
      expected
    };
  }
  const receivedText = typedReceived.raw;
  const message = () => {
    if (pass) {
      if (notFound)
        return messagePrefix + `Expected: not ${this.utils.printExpected(expected)}
Received: ${receivedText}` + callLogText(log);
      const printedReceived = printReceivedStringContainExpectedSubstring(receivedText, receivedText.indexOf(expected), expected.length);
      return messagePrefix + `Expected: not ${this.utils.printExpected(expected)}
Received: ${printedReceived}` + callLogText(log);
    } else {
      const labelExpected = `Expected`;
      if (notFound)
        return messagePrefix + `${labelExpected}: ${this.utils.printExpected(expected)}
Received: ${receivedText}` + callLogText(log);
      return messagePrefix + this.utils.printDiffOrStringify(expected, receivedText, labelExpected, "Received", false) + callLogText(log);
    }
  };
  if (!this.isNot) {
    if (updateSnapshots === "all" || updateSnapshots === "changed" && pass === this.isNot || generateMissingBaseline) {
      if (expectedPath) {
        await fs.promises.mkdir(path.dirname(expectedPath), { recursive: true });
        await fs.promises.writeFile(expectedPath, typedReceived.regex, "utf8");
        const relativePath = path.relative(process.cwd(), expectedPath);
        if (updateSnapshots === "missing") {
          const message2 = `A snapshot doesn't exist at ${relativePath}, writing actual.`;
          testInfo._hasNonRetriableError = true;
          testInfo._failWithError(new Error(message2));
        } else {
          const message2 = `A snapshot is generated at ${relativePath}.`;
          console.log(message2);
        }
        return { pass: true, message: () => "", name: "toMatchAriaSnapshot" };
      } else {
        const suggestedRebaseline = `\`
${escapeTemplateString(indent(typedReceived.regex, "{indent}  "))}
{indent}\``;
        if (updateSnapshots === "missing") {
          const message2 = "A snapshot is not provided, generating new baseline.";
          testInfo._hasNonRetriableError = true;
          testInfo._failWithError(new Error(message2));
        }
        return { pass: false, message: () => "", name: "toMatchAriaSnapshot", suggestedRebaseline };
      }
    }
  }
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
function unshift(snapshot) {
  const lines = snapshot.split("\n");
  let whitespacePrefixLength = 100;
  for (const line of lines) {
    if (!line.trim())
      continue;
    const match = line.match(/^(\s*)/);
    if (match && match[1].length < whitespacePrefixLength)
      whitespacePrefixLength = match[1].length;
  }
  return lines.filter((t) => t.trim()).map((line) => line.substring(whitespacePrefixLength)).join("\n");
}
function indent(snapshot, indent2) {
  return snapshot.split("\n").map((line) => indent2 + line).join("\n");
}

export { toMatchAriaSnapshot };
