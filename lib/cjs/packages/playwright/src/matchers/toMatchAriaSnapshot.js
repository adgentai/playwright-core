'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('../../../../bundles/fs.js');
const path = require('node:path');
const stringUtils = require('../../../playwright-core/src/utils/isomorphic/stringUtils.js');
require('../../../../_virtual/pixelmatch.js');
require('../../../playwright-core/src/utilsBundle.js');
require('node:crypto');
require('../../../playwright-core/src/server/utils/debug.js');
require('../../../playwright-core/src/server/utils/debugLogger.js');
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
const matcherHint = require('./matcherHint.js');
const expectBundle = require('../common/expectBundle.js');
const util = require('../util.js');
const expect = require('./expect.js');
const globals = require('../common/globals.js');

async function toMatchAriaSnapshot(receiver, expectedParam, options = {}) {
  const matcherName = "toMatchAriaSnapshot";
  const testInfo = globals.currentTestInfo();
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
  if (stringUtils.isString(expectedParam)) {
    expected = expectedParam;
    timeout = options.timeout ?? this.timeout;
  } else {
    const legacyPath = testInfo._resolveSnapshotPaths("aria", expectedParam?.name, "dontUpdateSnapshotIndex", ".yml").absoluteSnapshotPath;
    expectedPath = testInfo._resolveSnapshotPaths("aria", expectedParam?.name, "updateSnapshotIndex").absoluteSnapshotPath;
    if (!await util.fileExistsAsync(expectedPath) && await util.fileExistsAsync(legacyPath))
      expectedPath = legacyPath;
    expected = await fs.default.promises.readFile(expectedPath, "utf8").catch(() => "");
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
  const messagePrefix = matcherHint.matcherHint(this, receiver, matcherName, "locator", void 0, matcherOptions, timedOut ? timeout : void 0);
  const notFound = typedReceived === matcherHint.kNoElementsFoundError;
  if (notFound) {
    return {
      pass: this.isNot,
      message: () => messagePrefix + `Expected: ${this.utils.printExpected(expected)}
Received: ${expectBundle.EXPECTED_COLOR("<element not found>")}` + util.callLogText(log),
      name: "toMatchAriaSnapshot",
      expected
    };
  }
  const receivedText = typedReceived.raw;
  const message = () => {
    if (pass) {
      if (notFound)
        return messagePrefix + `Expected: not ${this.utils.printExpected(expected)}
Received: ${receivedText}` + util.callLogText(log);
      const printedReceived = expect.printReceivedStringContainExpectedSubstring(receivedText, receivedText.indexOf(expected), expected.length);
      return messagePrefix + `Expected: not ${this.utils.printExpected(expected)}
Received: ${printedReceived}` + util.callLogText(log);
    } else {
      const labelExpected = `Expected`;
      if (notFound)
        return messagePrefix + `${labelExpected}: ${this.utils.printExpected(expected)}
Received: ${receivedText}` + util.callLogText(log);
      return messagePrefix + this.utils.printDiffOrStringify(expected, receivedText, labelExpected, "Received", false) + util.callLogText(log);
    }
  };
  if (!this.isNot) {
    if (updateSnapshots === "all" || updateSnapshots === "changed" && pass === this.isNot || generateMissingBaseline) {
      if (expectedPath) {
        await fs.default.promises.mkdir(path.dirname(expectedPath), { recursive: true });
        await fs.default.promises.writeFile(expectedPath, typedReceived.regex, "utf8");
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
${stringUtils.escapeTemplateString(indent(typedReceived.regex, "{indent}  "))}
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

exports.toMatchAriaSnapshot = toMatchAriaSnapshot;
