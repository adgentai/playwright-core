'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const util = require('../util.js');
const matcherHint = require('./matcherHint.js');

async function toBeTruthy(matcherName, receiver, receiverType, expected, arg, query, options = {}) {
  util.expectTypes(receiver, [receiverType], matcherName);
  const matcherOptions = {
    isNot: this.isNot,
    promise: this.promise
  };
  const timeout = options.timeout ?? this.timeout;
  const { matches: pass, log, timedOut, received } = await query(!!this.isNot, timeout);
  if (pass === !this.isNot) {
    return {
      name: matcherName,
      message: () => "",
      pass,
      expected
    };
  }
  const notFound = received === matcherHint.kNoElementsFoundError ? received : void 0;
  let printedReceived;
  let printedExpected;
  if (pass) {
    printedExpected = `Expected: not ${expected}`;
    printedReceived = `Received: ${notFound ? matcherHint.kNoElementsFoundError : expected}`;
  } else {
    printedExpected = `Expected: ${expected}`;
    printedReceived = `Received: ${notFound ? matcherHint.kNoElementsFoundError : received}`;
  }
  const message = () => {
    const header = matcherHint.matcherHint(this, receiver, matcherName, "locator", arg, matcherOptions, timedOut ? timeout : void 0);
    const logText = util.callLogText(log);
    return `${header}${printedExpected}
${printedReceived}${logText}`;
  };
  return {
    message,
    pass,
    actual: received,
    name: matcherName,
    expected,
    log,
    timeout: timedOut ? timeout : void 0
  };
}

exports.toBeTruthy = toBeTruthy;
