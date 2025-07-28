'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const require$$0$2 = require('node:util');

function stdioChunkToParams(chunk) {
  if (chunk instanceof Uint8Array)
    return { buffer: Buffer.from(chunk).toString("base64") };
  if (typeof chunk !== "string")
    return { text: require$$0$2.inspect(chunk) };
  return { text: chunk };
}

exports.stdioChunkToParams = stdioChunkToParams;
