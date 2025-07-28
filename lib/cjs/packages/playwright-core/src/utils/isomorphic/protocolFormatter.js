'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const protocolMetainfo = require('./protocolMetainfo.js');

function formatProtocolParam(params, name) {
  if (!params)
    return "";
  if (name === "url") {
    try {
      const urlObject = new URL(params[name]);
      if (urlObject.protocol === "data:")
        return urlObject.protocol;
      if (urlObject.protocol === "about:")
        return params[name];
      return urlObject.pathname + urlObject.search;
    } catch (error) {
      return params[name];
    }
  }
  if (name === "timeNumber") {
    return new Date(params[name]).toString();
  }
  return deepParam(params, name);
}
function deepParam(params, name) {
  const tokens = name.split(".");
  let current = params;
  for (const token of tokens) {
    if (typeof current !== "object" || current === null)
      return "";
    current = current[token];
  }
  if (current === void 0)
    return "";
  return String(current);
}
function renderTitleForCall(metadata) {
  const titleFormat = metadata.title ?? protocolMetainfo.methodMetainfo.get(metadata.type + "." + metadata.method)?.title ?? metadata.method;
  return titleFormat.replace(/\{([^}]+)\}/g, (_, p1) => {
    return formatProtocolParam(metadata.params, p1);
  });
}

exports.formatProtocolParam = formatProtocolParam;
exports.renderTitleForCall = renderTitleForCall;
