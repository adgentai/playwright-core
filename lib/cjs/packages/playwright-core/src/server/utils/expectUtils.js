'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const rtti = require('../../utils/isomorphic/rtti.js');
const stringUtils = require('../../utils/isomorphic/stringUtils.js');

function serializeExpectedTextValues(items, options = {}) {
  return items.map((i) => ({
    string: stringUtils.isString(i) ? i : void 0,
    regexSource: rtti.isRegExp(i) ? i.source : void 0,
    regexFlags: rtti.isRegExp(i) ? i.flags : void 0,
    matchSubstring: options.matchSubstring,
    ignoreCase: options.ignoreCase,
    normalizeWhiteSpace: options.normalizeWhiteSpace
  }));
}

exports.serializeExpectedTextValues = serializeExpectedTextValues;
