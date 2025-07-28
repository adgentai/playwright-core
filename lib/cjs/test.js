'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const index = require('./index.js');
const expect = require('./packages/playwright/src/matchers/expect.js');



exports._instrumentation = index._instrumentation;
exports.acquire = index.acquire;
exports.chromium = index.chromium;
exports.connect = index.connect;
exports.devices = index.devices;
exports.endpointURLString = index.endpointURLString;
exports.errors = index.errors;
exports.history = index.history;
exports.launch = index.launch;
exports.limits = index.limits;
exports.request = index.request;
exports.selectors = index.selectors;
exports.sessions = index.sessions;
exports.expect = expect.expect;
exports.mergeExpects = expect.mergeExpects;
