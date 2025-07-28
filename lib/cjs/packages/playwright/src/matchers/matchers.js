'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const stringUtils = require('../../../playwright-core/src/utils/isomorphic/stringUtils.js');
const mimeType = require('../../../playwright-core/src/utils/isomorphic/mimeType.js');
const rtti = require('../../../playwright-core/src/utils/isomorphic/rtti.js');
const timeoutRunner = require('../../../playwright-core/src/utils/isomorphic/timeoutRunner.js');
const urlMatch = require('../../../playwright-core/src/utils/isomorphic/urlMatch.js');
require('../../../../_virtual/pixelmatch.js');
const utilsBundle = require('../../../playwright-core/src/utilsBundle.js');
require('node:crypto');
require('../../../playwright-core/src/server/utils/debug.js');
require('../../../playwright-core/src/server/utils/debugLogger.js');
const expectUtils = require('../../../playwright-core/src/server/utils/expectUtils.js');
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
const toBeTruthy = require('./toBeTruthy.js');
const toEqual = require('./toEqual.js');
const toHaveURL$1 = require('./toHaveURL.js');
const toMatchText = require('./toMatchText.js');
const config = require('../common/config.js');
const globals = require('../common/globals.js');
const testInfo = require('../worker/testInfo.js');

function toBeAttached(locator, options) {
  const attached = !options || options.attached === void 0 || options.attached;
  const expected = attached ? "attached" : "detached";
  const arg = attached ? "" : "{ attached: false }";
  return toBeTruthy.toBeTruthy.call(this, "toBeAttached", locator, "Locator", expected, arg, async (isNot, timeout) => {
    return await locator._expect(attached ? "to.be.attached" : "to.be.detached", { isNot, timeout });
  }, options);
}
function toBeChecked(locator, options) {
  const checked = options?.checked;
  const indeterminate = options?.indeterminate;
  const expectedValue = {
    checked,
    indeterminate
  };
  let expected;
  let arg;
  if (options?.indeterminate) {
    expected = "indeterminate";
    arg = `{ indeterminate: true }`;
  } else {
    expected = options?.checked === false ? "unchecked" : "checked";
    arg = options?.checked === false ? `{ checked: false }` : "";
  }
  return toBeTruthy.toBeTruthy.call(this, "toBeChecked", locator, "Locator", expected, arg, async (isNot, timeout) => {
    return await locator._expect("to.be.checked", { isNot, timeout, expectedValue });
  }, options);
}
function toBeDisabled(locator, options) {
  return toBeTruthy.toBeTruthy.call(this, "toBeDisabled", locator, "Locator", "disabled", "", async (isNot, timeout) => {
    return await locator._expect("to.be.disabled", { isNot, timeout });
  }, options);
}
function toBeEditable(locator, options) {
  const editable = !options || options.editable === void 0 || options.editable;
  const expected = editable ? "editable" : "readOnly";
  const arg = editable ? "" : "{ editable: false }";
  return toBeTruthy.toBeTruthy.call(this, "toBeEditable", locator, "Locator", expected, arg, async (isNot, timeout) => {
    return await locator._expect(editable ? "to.be.editable" : "to.be.readonly", { isNot, timeout });
  }, options);
}
function toBeEmpty(locator, options) {
  return toBeTruthy.toBeTruthy.call(this, "toBeEmpty", locator, "Locator", "empty", "", async (isNot, timeout) => {
    return await locator._expect("to.be.empty", { isNot, timeout });
  }, options);
}
function toBeEnabled(locator, options) {
  const enabled = !options || options.enabled === void 0 || options.enabled;
  const expected = enabled ? "enabled" : "disabled";
  const arg = enabled ? "" : "{ enabled: false }";
  return toBeTruthy.toBeTruthy.call(this, "toBeEnabled", locator, "Locator", expected, arg, async (isNot, timeout) => {
    return await locator._expect(enabled ? "to.be.enabled" : "to.be.disabled", { isNot, timeout });
  }, options);
}
function toBeFocused(locator, options) {
  return toBeTruthy.toBeTruthy.call(this, "toBeFocused", locator, "Locator", "focused", "", async (isNot, timeout) => {
    return await locator._expect("to.be.focused", { isNot, timeout });
  }, options);
}
function toBeHidden(locator, options) {
  return toBeTruthy.toBeTruthy.call(this, "toBeHidden", locator, "Locator", "hidden", "", async (isNot, timeout) => {
    return await locator._expect("to.be.hidden", { isNot, timeout });
  }, options);
}
function toBeVisible(locator, options) {
  const visible = !options || options.visible === void 0 || options.visible;
  const expected = visible ? "visible" : "hidden";
  const arg = visible ? "" : "{ visible: false }";
  return toBeTruthy.toBeTruthy.call(this, "toBeVisible", locator, "Locator", expected, arg, async (isNot, timeout) => {
    return await locator._expect(visible ? "to.be.visible" : "to.be.hidden", { isNot, timeout });
  }, options);
}
function toBeInViewport(locator, options) {
  return toBeTruthy.toBeTruthy.call(this, "toBeInViewport", locator, "Locator", "in viewport", "", async (isNot, timeout) => {
    return await locator._expect("to.be.in.viewport", { isNot, expectedNumber: options?.ratio, timeout });
  }, options);
}
function toContainText(locator, expected, options = {}) {
  if (Array.isArray(expected)) {
    return toEqual.toEqual.call(this, "toContainText", locator, "Locator", async (isNot, timeout) => {
      const expectedText = expectUtils.serializeExpectedTextValues(expected, { matchSubstring: true, normalizeWhiteSpace: true, ignoreCase: options.ignoreCase });
      return await locator._expect("to.contain.text.array", { expectedText, isNot, useInnerText: options.useInnerText, timeout });
    }, expected, { ...options, contains: true });
  } else {
    return toMatchText.toMatchText.call(this, "toContainText", locator, "Locator", async (isNot, timeout) => {
      const expectedText = expectUtils.serializeExpectedTextValues([expected], { matchSubstring: true, normalizeWhiteSpace: true, ignoreCase: options.ignoreCase });
      return await locator._expect("to.have.text", { expectedText, isNot, useInnerText: options.useInnerText, timeout });
    }, expected, options);
  }
}
function toHaveAccessibleDescription(locator, expected, options) {
  return toMatchText.toMatchText.call(this, "toHaveAccessibleDescription", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected], { ignoreCase: options?.ignoreCase, normalizeWhiteSpace: true });
    return await locator._expect("to.have.accessible.description", { expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveAccessibleName(locator, expected, options) {
  return toMatchText.toMatchText.call(this, "toHaveAccessibleName", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected], { ignoreCase: options?.ignoreCase, normalizeWhiteSpace: true });
    return await locator._expect("to.have.accessible.name", { expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveAccessibleErrorMessage(locator, expected, options) {
  return toMatchText.toMatchText.call(this, "toHaveAccessibleErrorMessage", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected], { ignoreCase: options?.ignoreCase, normalizeWhiteSpace: true });
    return await locator._expect("to.have.accessible.error.message", { expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveAttribute(locator, name, expected, options) {
  if (!options) {
    if (typeof expected === "object" && !rtti.isRegExp(expected)) {
      options = expected;
      expected = void 0;
    }
  }
  if (expected === void 0) {
    return toBeTruthy.toBeTruthy.call(this, "toHaveAttribute", locator, "Locator", "have attribute", "", async (isNot, timeout) => {
      return await locator._expect("to.have.attribute", { expressionArg: name, isNot, timeout });
    }, options);
  }
  return toMatchText.toMatchText.call(this, "toHaveAttribute", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected], { ignoreCase: options?.ignoreCase });
    return await locator._expect("to.have.attribute.value", { expressionArg: name, expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveClass(locator, expected, options) {
  if (Array.isArray(expected)) {
    return toEqual.toEqual.call(this, "toHaveClass", locator, "Locator", async (isNot, timeout) => {
      const expectedText = expectUtils.serializeExpectedTextValues(expected);
      return await locator._expect("to.have.class.array", { expectedText, isNot, timeout });
    }, expected, options);
  } else {
    return toMatchText.toMatchText.call(this, "toHaveClass", locator, "Locator", async (isNot, timeout) => {
      const expectedText = expectUtils.serializeExpectedTextValues([expected]);
      return await locator._expect("to.have.class", { expectedText, isNot, timeout });
    }, expected, options);
  }
}
function toContainClass(locator, expected, options) {
  if (Array.isArray(expected)) {
    if (expected.some((e) => rtti.isRegExp(e)))
      throw new Error(`"expected" argument in toContainClass cannot contain RegExp values`);
    return toEqual.toEqual.call(this, "toContainClass", locator, "Locator", async (isNot, timeout) => {
      const expectedText = expectUtils.serializeExpectedTextValues(expected);
      return await locator._expect("to.contain.class.array", { expectedText, isNot, timeout });
    }, expected, options);
  } else {
    if (rtti.isRegExp(expected))
      throw new Error(`"expected" argument in toContainClass cannot be a RegExp value`);
    return toMatchText.toMatchText.call(this, "toContainClass", locator, "Locator", async (isNot, timeout) => {
      const expectedText = expectUtils.serializeExpectedTextValues([expected]);
      return await locator._expect("to.contain.class", { expectedText, isNot, timeout });
    }, expected, options);
  }
}
function toHaveCount(locator, expected, options) {
  return toEqual.toEqual.call(this, "toHaveCount", locator, "Locator", async (isNot, timeout) => {
    return await locator._expect("to.have.count", { expectedNumber: expected, isNot, timeout });
  }, expected, options);
}
function toHaveCSS(locator, name, expected, options) {
  return toMatchText.toMatchText.call(this, "toHaveCSS", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected]);
    return await locator._expect("to.have.css", { expressionArg: name, expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveId(locator, expected, options) {
  return toMatchText.toMatchText.call(this, "toHaveId", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected]);
    return await locator._expect("to.have.id", { expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveJSProperty(locator, name, expected, options) {
  return toEqual.toEqual.call(this, "toHaveJSProperty", locator, "Locator", async (isNot, timeout) => {
    return await locator._expect("to.have.property", { expressionArg: name, expectedValue: expected, isNot, timeout });
  }, expected, options);
}
function toHaveRole(locator, expected, options) {
  if (!stringUtils.isString(expected))
    throw new Error(`"role" argument in toHaveRole must be a string`);
  return toMatchText.toMatchText.call(this, "toHaveRole", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected]);
    return await locator._expect("to.have.role", { expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveText(locator, expected, options = {}) {
  if (Array.isArray(expected)) {
    return toEqual.toEqual.call(this, "toHaveText", locator, "Locator", async (isNot, timeout) => {
      const expectedText = expectUtils.serializeExpectedTextValues(expected, { normalizeWhiteSpace: true, ignoreCase: options.ignoreCase });
      return await locator._expect("to.have.text.array", { expectedText, isNot, useInnerText: options?.useInnerText, timeout });
    }, expected, options);
  } else {
    return toMatchText.toMatchText.call(this, "toHaveText", locator, "Locator", async (isNot, timeout) => {
      const expectedText = expectUtils.serializeExpectedTextValues([expected], { normalizeWhiteSpace: true, ignoreCase: options.ignoreCase });
      return await locator._expect("to.have.text", { expectedText, isNot, useInnerText: options?.useInnerText, timeout });
    }, expected, options);
  }
}
function toHaveValue(locator, expected, options) {
  return toMatchText.toMatchText.call(this, "toHaveValue", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected]);
    return await locator._expect("to.have.value", { expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveValues(locator, expected, options) {
  return toEqual.toEqual.call(this, "toHaveValues", locator, "Locator", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues(expected);
    return await locator._expect("to.have.values", { expectedText, isNot, timeout });
  }, expected, options);
}
function toHaveTitle(page, expected, options = {}) {
  return toMatchText.toMatchText.call(this, "toHaveTitle", page, "Page", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected], { normalizeWhiteSpace: true });
    return await page.mainFrame()._expect("to.have.title", { expectedText, isNot, timeout });
  }, expected, { receiverLabel: "page", ...options });
}
function toHaveURL(page, expected, options) {
  if (typeof expected === "function")
    return toHaveURL$1.toHaveURLWithPredicate.call(this, page, expected, options);
  const baseURL = page.context()._options.baseURL;
  expected = typeof expected === "string" ? urlMatch.constructURLBasedOnBaseURL(baseURL, expected) : expected;
  return toMatchText.toMatchText.call(this, "toHaveURL", page, "Page", async (isNot, timeout) => {
    const expectedText = expectUtils.serializeExpectedTextValues([expected], { ignoreCase: options?.ignoreCase });
    return await page.mainFrame()._expect("to.have.url", { expectedText, isNot, timeout });
  }, expected, { receiverLabel: "page", ...options });
}
async function toBeOK(response) {
  const matcherName = "toBeOK";
  util.expectTypes(response, ["APIResponse"], matcherName);
  const contentType = response.headers()["content-type"];
  const isTextEncoding = contentType && mimeType.isTextualMimeType(contentType);
  const [log, text] = this.isNot === response.ok() ? await Promise.all([
    response._fetchLog(),
    isTextEncoding ? response.text() : null
  ]) : [];
  const message = () => this.utils.matcherHint(matcherName, void 0, "", { isNot: this.isNot }) + util.callLogText(log) + (text === null ? "" : `
Response text:
${utilsBundle.colors.dim(text?.substring(0, 1e3) || "")}`);
  const pass = response.ok();
  return { message, pass };
}
async function toPass(callback, options = {}) {
  const testInfo$1 = globals.currentTestInfo();
  const timeout = config.takeFirst(options.timeout, testInfo$1?._projectInternal.expect?.toPass?.timeout, 0);
  const intervals = config.takeFirst(options.intervals, testInfo$1?._projectInternal.expect?.toPass?.intervals, [100, 250, 500, 1e3]);
  const { deadline, timeoutMessage } = testInfo$1 ? testInfo$1._deadlineForMatcher(timeout) : testInfo.TestInfoImpl._defaultDeadlineForMatcher(timeout);
  const result = await timeoutRunner.pollAgainstDeadline(async () => {
    if (testInfo$1 && globals.currentTestInfo() !== testInfo$1)
      return { continuePolling: false, result: void 0 };
    try {
      await callback();
      return { continuePolling: !!this.isNot, result: void 0 };
    } catch (e) {
      return { continuePolling: !this.isNot, result: e };
    }
  }, deadline, intervals);
  if (result.timedOut) {
    const message = result.result ? [
      result.result.message,
      "",
      `Call Log:`,
      `- ${timeoutMessage}`
    ].join("\n") : timeoutMessage;
    return { message: () => message, pass: !!this.isNot };
  }
  return { pass: !this.isNot, message: () => "" };
}

exports.toBeAttached = toBeAttached;
exports.toBeChecked = toBeChecked;
exports.toBeDisabled = toBeDisabled;
exports.toBeEditable = toBeEditable;
exports.toBeEmpty = toBeEmpty;
exports.toBeEnabled = toBeEnabled;
exports.toBeFocused = toBeFocused;
exports.toBeHidden = toBeHidden;
exports.toBeInViewport = toBeInViewport;
exports.toBeOK = toBeOK;
exports.toBeVisible = toBeVisible;
exports.toContainClass = toContainClass;
exports.toContainText = toContainText;
exports.toHaveAccessibleDescription = toHaveAccessibleDescription;
exports.toHaveAccessibleErrorMessage = toHaveAccessibleErrorMessage;
exports.toHaveAccessibleName = toHaveAccessibleName;
exports.toHaveAttribute = toHaveAttribute;
exports.toHaveCSS = toHaveCSS;
exports.toHaveClass = toHaveClass;
exports.toHaveCount = toHaveCount;
exports.toHaveId = toHaveId;
exports.toHaveJSProperty = toHaveJSProperty;
exports.toHaveRole = toHaveRole;
exports.toHaveText = toHaveText;
exports.toHaveTitle = toHaveTitle;
exports.toHaveURL = toHaveURL;
exports.toHaveValue = toHaveValue;
exports.toHaveValues = toHaveValues;
exports.toPass = toPass;
