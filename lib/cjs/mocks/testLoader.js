'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const internal = require('../internal.js');

async function loadTestFile(file) {
  const suite = internal._rootSuites.find((s) => s._requireFile === file);
  if (!suite)
    throw new Error(`Test file not found: ${file}`);
  return suite;
}

exports.loadTestFile = loadTestFile;
