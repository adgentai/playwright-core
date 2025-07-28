'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const expectBundleImpl = require('../../../../_virtual/expectBundleImpl.js');

const expect = expectBundleImpl.default.expect;
expectBundleImpl.default.mock;
expectBundleImpl.default.asymmetricMatchers;
expectBundleImpl.default.matcherUtils;
const EXPECTED_COLOR = expectBundleImpl.default.EXPECTED_COLOR;
const INVERTED_COLOR = expectBundleImpl.default.INVERTED_COLOR;
const RECEIVED_COLOR = expectBundleImpl.default.RECEIVED_COLOR;
const printReceived = expectBundleImpl.default.printReceived;

exports.EXPECTED_COLOR = EXPECTED_COLOR;
exports.INVERTED_COLOR = INVERTED_COLOR;
exports.RECEIVED_COLOR = RECEIVED_COLOR;
exports.expect = expect;
exports.printReceived = printReceived;
