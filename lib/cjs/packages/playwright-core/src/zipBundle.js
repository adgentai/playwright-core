'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const zipBundleImpl = require('../../../_virtual/zipBundleImpl.js');

const yazl = zipBundleImpl.default.yazl;
const yauzl = zipBundleImpl.default.yauzl;
const extract = zipBundleImpl.default.extract;

exports.extract = extract;
exports.yauzl = yauzl;
exports.yazl = yazl;
