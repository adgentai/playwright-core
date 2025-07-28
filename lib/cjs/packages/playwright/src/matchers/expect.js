'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const stringUtils = require('../../../playwright-core/src/utils/isomorphic/stringUtils.js');
const stackTrace = require('../../../playwright-core/src/utils/isomorphic/stackTrace.js');
const timeoutRunner = require('../../../playwright-core/src/utils/isomorphic/timeoutRunner.js');
require('../../../../_virtual/pixelmatch.js');
require('../../../playwright-core/src/utilsBundle.js');
const crypto = require('../../../playwright-core/src/server/utils/crypto.js');
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
const zones = require('../../../playwright-core/src/server/utils/zones.js');
const matcherHint = require('./matcherHint.js');
const matchers = require('./matchers.js');
const toMatchAriaSnapshot = require('./toMatchAriaSnapshot.js');
const toMatchSnapshot = require('./toMatchSnapshot.js');
const expectBundle = require('../common/expectBundle.js');
const globals = require('../common/globals.js');
const util = require('../util.js');
const testInfo = require('../worker/testInfo.js');

const printSubstring = (val) => val.replace(/"|\\/g, "\\$&");
const printReceivedStringContainExpectedSubstring = (received, start, length) => expectBundle.RECEIVED_COLOR(
  '"' + printSubstring(received.slice(0, start)) + expectBundle.INVERTED_COLOR(printSubstring(received.slice(start, start + length))) + printSubstring(received.slice(start + length)) + '"'
);
const printReceivedStringContainExpectedResult = (received, result) => result === null ? expectBundle.printReceived(received) : printReceivedStringContainExpectedSubstring(
  received,
  result.index,
  result[0].length
);
function createMatchers(actual, info, prefix) {
  return new Proxy(expectBundle.expect(actual), new ExpectMetaInfoProxyHandler(info, prefix));
}
const userMatchersSymbol = Symbol("userMatchers");
function qualifiedMatcherName(qualifier, matcherName) {
  return qualifier.join(":") + "$" + matcherName;
}
function createExpect(info, prefix, userMatchers) {
  const expectInstance = new Proxy(expectBundle.expect, {
    apply: function(target, thisArg, argumentsList) {
      const [actual, messageOrOptions] = argumentsList;
      const message = stringUtils.isString(messageOrOptions) ? messageOrOptions : messageOrOptions?.message || info.message;
      const newInfo = { ...info, message };
      if (newInfo.poll) {
        if (typeof actual !== "function")
          throw new Error("`expect.poll()` accepts only function as a first argument");
        newInfo.poll.generator = actual;
      }
      return createMatchers(actual, newInfo, prefix);
    },
    get: function(target, property) {
      if (property === "configure")
        return configure;
      if (property === "extend") {
        return (matchers) => {
          const qualifier = [...prefix, crypto.createGuid()];
          const wrappedMatchers = {};
          for (const [name, matcher] of Object.entries(matchers)) {
            wrappedMatchers[name] = wrapPlaywrightMatcherToPassNiceThis(matcher);
            const key = qualifiedMatcherName(qualifier, name);
            wrappedMatchers[key] = wrappedMatchers[name];
            Object.defineProperty(wrappedMatchers[key], "name", { value: name });
          }
          expectBundle.expect.extend(wrappedMatchers);
          return createExpect(info, qualifier, { ...userMatchers, ...matchers });
        };
      }
      if (property === "soft") {
        return (actual, messageOrOptions) => {
          return configure({ soft: true })(actual, messageOrOptions);
        };
      }
      if (property === userMatchersSymbol)
        return userMatchers;
      if (property === "poll") {
        return (actual, messageOrOptions) => {
          const poll = stringUtils.isString(messageOrOptions) ? {} : messageOrOptions || {};
          return configure({ _poll: poll })(actual, messageOrOptions);
        };
      }
      return expectBundle.expect[property];
    }
  });
  const configure = (configuration) => {
    const newInfo = { ...info };
    if ("message" in configuration)
      newInfo.message = configuration.message;
    if ("timeout" in configuration)
      newInfo.timeout = configuration.timeout;
    if ("soft" in configuration)
      newInfo.isSoft = configuration.soft;
    if ("_poll" in configuration) {
      newInfo.poll = configuration._poll ? { ...info.poll, generator: () => {
      } } : void 0;
      if (typeof configuration._poll === "object") {
        newInfo.poll.timeout = configuration._poll.timeout ?? newInfo.poll.timeout;
        newInfo.poll.intervals = configuration._poll.intervals ?? newInfo.poll.intervals;
      }
    }
    return createExpect(newInfo, prefix, userMatchers);
  };
  return expectInstance;
}
let matcherCallContext;
function setMatcherCallContext(context) {
  matcherCallContext = context;
}
function takeMatcherCallContext() {
  try {
    return matcherCallContext;
  } finally {
    matcherCallContext = void 0;
  }
}
const defaultExpectTimeout = 5e3;
function wrapPlaywrightMatcherToPassNiceThis(matcher) {
  return function(...args) {
    const { isNot, promise, utils } = this;
    const context = takeMatcherCallContext();
    const timeout = context?.expectInfo.timeout ?? context?.testInfo?._projectInternal?.expect?.timeout ?? defaultExpectTimeout;
    const newThis = {
      isNot,
      promise,
      utils,
      timeout,
      _stepInfo: context?.step
    };
    newThis.equals = throwUnsupportedExpectMatcherError;
    return matcher.call(newThis, ...args);
  };
}
function throwUnsupportedExpectMatcherError() {
  throw new Error("It looks like you are using custom expect matchers that are not compatible with Playwright. See https://aka.ms/playwright/expect-compatibility");
}
expectBundle.expect.setState({ expand: false });
const customAsyncMatchers = {
  toBeAttached: matchers.toBeAttached,
  toBeChecked: matchers.toBeChecked,
  toBeDisabled: matchers.toBeDisabled,
  toBeEditable: matchers.toBeEditable,
  toBeEmpty: matchers.toBeEmpty,
  toBeEnabled: matchers.toBeEnabled,
  toBeFocused: matchers.toBeFocused,
  toBeHidden: matchers.toBeHidden,
  toBeInViewport: matchers.toBeInViewport,
  toBeOK: matchers.toBeOK,
  toBeVisible: matchers.toBeVisible,
  toContainText: matchers.toContainText,
  toContainClass: matchers.toContainClass,
  toHaveAccessibleDescription: matchers.toHaveAccessibleDescription,
  toHaveAccessibleName: matchers.toHaveAccessibleName,
  toHaveAccessibleErrorMessage: matchers.toHaveAccessibleErrorMessage,
  toHaveAttribute: matchers.toHaveAttribute,
  toHaveClass: matchers.toHaveClass,
  toHaveCount: matchers.toHaveCount,
  toHaveCSS: matchers.toHaveCSS,
  toHaveId: matchers.toHaveId,
  toHaveJSProperty: matchers.toHaveJSProperty,
  toHaveRole: matchers.toHaveRole,
  toHaveText: matchers.toHaveText,
  toHaveTitle: matchers.toHaveTitle,
  toHaveURL: matchers.toHaveURL,
  toHaveValue: matchers.toHaveValue,
  toHaveValues: matchers.toHaveValues,
  toHaveScreenshot: toMatchSnapshot.toHaveScreenshot,
  toMatchAriaSnapshot: toMatchAriaSnapshot.toMatchAriaSnapshot,
  toPass: matchers.toPass
};
const customMatchers = {
  ...customAsyncMatchers,
  toMatchSnapshot: toMatchSnapshot.toMatchSnapshot
};
class ExpectMetaInfoProxyHandler {
  constructor(info, prefix) {
    this._info = { ...info };
    this._prefix = prefix;
  }
  get(target, matcherName, receiver) {
    let matcher = Reflect.get(target, matcherName, receiver);
    if (typeof matcherName !== "string")
      return matcher;
    let resolvedMatcherName = matcherName;
    for (let i = this._prefix.length; i > 0; i--) {
      const qualifiedName = qualifiedMatcherName(this._prefix.slice(0, i), matcherName);
      if (Reflect.has(target, qualifiedName)) {
        matcher = Reflect.get(target, qualifiedName, receiver);
        resolvedMatcherName = qualifiedName;
        break;
      }
    }
    if (matcher === void 0)
      throw new Error(`expect: Property '${matcherName}' not found.`);
    if (typeof matcher !== "function") {
      if (matcherName === "not")
        this._info.isNot = !this._info.isNot;
      return new Proxy(matcher, this);
    }
    if (this._info.poll) {
      if (customAsyncMatchers[matcherName] || matcherName === "resolves" || matcherName === "rejects")
        throw new Error(`\`expect.poll()\` does not support "${matcherName}" matcher.`);
      matcher = (...args) => pollMatcher(resolvedMatcherName, this._info, this._prefix, ...args);
    }
    return (...args) => {
      const testInfo = globals.currentTestInfo();
      setMatcherCallContext({ expectInfo: this._info, testInfo });
      if (!testInfo)
        return matcher.call(target, ...args);
      const customMessage = this._info.message || "";
      const argsSuffix = computeArgsSuffix(matcherName, args);
      const defaultTitle = `${this._info.poll ? "poll " : ""}${this._info.isSoft ? "soft " : ""}${this._info.isNot ? "not " : ""}${matcherName}${argsSuffix}`;
      const title = customMessage || defaultTitle;
      const apiName = `expect${this._info.poll ? ".poll " : ""}${this._info.isSoft ? ".soft " : ""}${this._info.isNot ? ".not" : ""}.${matcherName}${argsSuffix}`;
      const stackFrames = util.filteredStackTrace(stackTrace.captureRawStack());
      const category = matcherName === "toPass" || this._info.poll ? "test.step" : "expect";
      const formattedTitle = category === "expect" ? title : `Expect "${title}"`;
      const stepInfo = {
        category,
        apiName,
        title: formattedTitle,
        params: args[0] ? { expected: args[0] } : void 0,
        infectParentStepsWithError: this._info.isSoft
      };
      const step = testInfo._addStep(stepInfo);
      const reportStepError = (e) => {
        const jestError = matcherHint.isJestError(e) ? e : null;
        const error = jestError ? new matcherHint.ExpectError(jestError, customMessage, stackFrames) : e;
        if (jestError?.matcherResult.suggestedRebaseline) {
          step.complete({ suggestedRebaseline: jestError?.matcherResult.suggestedRebaseline });
          return;
        }
        step.complete({ error });
        if (this._info.isSoft)
          testInfo._failWithError(error);
        else
          throw error;
      };
      const finalizer = () => {
        step.complete({});
      };
      try {
        setMatcherCallContext({ expectInfo: this._info, testInfo, step: step.info });
        const callback = () => matcher.call(target, ...args);
        const result = zones.currentZone().with("stepZone", step).run(callback);
        if (result instanceof Promise)
          return result.then(finalizer).catch(reportStepError);
        finalizer();
        return result;
      } catch (e) {
        reportStepError(e);
      }
    };
  }
}
async function pollMatcher(qualifiedMatcherName2, info, prefix, ...args) {
  const testInfo$1 = globals.currentTestInfo();
  const poll = info.poll;
  const timeout = poll.timeout ?? info.timeout ?? testInfo$1?._projectInternal?.expect?.timeout ?? defaultExpectTimeout;
  const { deadline, timeoutMessage } = testInfo$1 ? testInfo$1._deadlineForMatcher(timeout) : testInfo.TestInfoImpl._defaultDeadlineForMatcher(timeout);
  const result = await timeoutRunner.pollAgainstDeadline(async () => {
    if (testInfo$1 && globals.currentTestInfo() !== testInfo$1)
      return { continuePolling: false, result: void 0 };
    const innerInfo = {
      ...info,
      isSoft: false,
      // soft is outside of poll, not inside
      poll: void 0
    };
    const value = await poll.generator();
    try {
      let matchers = createMatchers(value, innerInfo, prefix);
      if (info.isNot)
        matchers = matchers.not;
      matchers[qualifiedMatcherName2](...args);
      return { continuePolling: false, result: void 0 };
    } catch (error) {
      return { continuePolling: true, result: error };
    }
  }, deadline, poll.intervals ?? [100, 250, 500, 1e3]);
  if (result.timedOut) {
    const message = result.result ? [
      result.result.message,
      "",
      `Call Log:`,
      `- ${timeoutMessage}`
    ].join("\n") : timeoutMessage;
    throw new Error(message);
  }
}
function computeArgsSuffix(matcherName, args) {
  let value = "";
  if (matcherName === "toHaveScreenshot")
    value = toMatchSnapshot.toHaveScreenshotStepTitle(...args);
  return value ? `(${value})` : "";
}
const expect = createExpect({}, [], {}).extend(customMatchers);
function mergeExpects(...expects) {
  let merged = expect;
  for (const e of expects) {
    const internals = e[userMatchersSymbol];
    if (!internals)
      continue;
    merged = merged.extend(internals);
  }
  return merged;
}

exports.expect = expect;
exports.mergeExpects = mergeExpects;
exports.printReceivedStringContainExpectedResult = printReceivedStringContainExpectedResult;
exports.printReceivedStringContainExpectedSubstring = printReceivedStringContainExpectedSubstring;
