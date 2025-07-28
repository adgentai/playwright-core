'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const stringUtils = require('./stringUtils.js');

const escapedChars = /* @__PURE__ */ new Set(["$", "^", "+", ".", "*", "(", ")", "|", "\\", "?", "{", "}", "[", "]"]);
function globToRegexPattern(glob) {
  const tokens = ["^"];
  let inGroup = false;
  for (let i = 0; i < glob.length; ++i) {
    const c = glob[i];
    if (c === "\\" && i + 1 < glob.length) {
      const char = glob[++i];
      tokens.push(escapedChars.has(char) ? "\\" + char : char);
      continue;
    }
    if (c === "*") {
      const beforeDeep = glob[i - 1];
      let starCount = 1;
      while (glob[i + 1] === "*") {
        starCount++;
        i++;
      }
      const afterDeep = glob[i + 1];
      const isDeep = starCount > 1 && (beforeDeep === "/" || beforeDeep === void 0) && (afterDeep === "/" || afterDeep === void 0);
      if (isDeep) {
        tokens.push("((?:[^/]*(?:/|$))*)");
        i++;
      } else {
        tokens.push("([^/]*)");
      }
      continue;
    }
    switch (c) {
      case "{":
        inGroup = true;
        tokens.push("(");
        break;
      case "}":
        inGroup = false;
        tokens.push(")");
        break;
      case ",":
        if (inGroup) {
          tokens.push("|");
          break;
        }
        tokens.push("\\" + c);
        break;
      default:
        tokens.push(escapedChars.has(c) ? "\\" + c : c);
    }
  }
  tokens.push("$");
  return tokens.join("");
}
function isRegExp(obj) {
  return obj instanceof RegExp || Object.prototype.toString.call(obj) === "[object RegExp]";
}
function urlMatchesEqual(match1, match2) {
  if (isRegExp(match1) && isRegExp(match2))
    return match1.source === match2.source && match1.flags === match2.flags;
  return match1 === match2;
}
function urlMatches(baseURL, urlString, match, webSocketUrl) {
  if (match === void 0 || match === "")
    return true;
  if (stringUtils.isString(match))
    match = new RegExp(resolveGlobToRegexPattern(baseURL, match, webSocketUrl));
  if (isRegExp(match)) {
    const r = match.test(urlString);
    return r;
  }
  const url = parseURL(urlString);
  if (!url)
    return false;
  if (typeof match !== "function")
    throw new Error("url parameter should be string, RegExp or function");
  return match(url);
}
function resolveGlobToRegexPattern(baseURL, glob, webSocketUrl) {
  if (webSocketUrl)
    baseURL = toWebSocketBaseUrl(baseURL);
  glob = resolveGlobBase(baseURL, glob);
  return globToRegexPattern(glob);
}
function toWebSocketBaseUrl(baseURL) {
  if (baseURL && /^https?:\/\//.test(baseURL))
    baseURL = baseURL.replace(/^http/, "ws");
  return baseURL;
}
function resolveGlobBase(baseURL, match) {
  if (!match.startsWith("*")) {
    let mapToken = function(original, replacement) {
      if (original.length === 0)
        return "";
      tokenMap.set(replacement, original);
      return replacement;
    };
    const tokenMap = /* @__PURE__ */ new Map();
    match = match.replaceAll(/\\\\\?/g, "?");
    if (match.startsWith("about:") || match.startsWith("data:") || match.startsWith("chrome:") || match.startsWith("edge:") || match.startsWith("file:"))
      return match;
    const relativePath = match.split("/").map((token, index) => {
      if (token === "." || token === ".." || token === "")
        return token;
      if (index === 0 && token.endsWith(":"))
        return mapToken(token, "http:");
      const questionIndex = token.indexOf("?");
      if (questionIndex === -1)
        return mapToken(token, `$_${index}_$`);
      const newPrefix = mapToken(token.substring(0, questionIndex), `$_${index}_$`);
      const newSuffix = mapToken(token.substring(questionIndex), `?$_${index}_$`);
      return newPrefix + newSuffix;
    }).join("/");
    let resolved = constructURLBasedOnBaseURL(baseURL, relativePath);
    for (const [token, original] of tokenMap)
      resolved = resolved.replace(token, original);
    match = resolved;
  }
  return match;
}
function parseURL(url) {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
}
function constructURLBasedOnBaseURL(baseURL, givenURL) {
  try {
    return new URL(givenURL, baseURL).toString();
  } catch (e) {
    return givenURL;
  }
}

exports.constructURLBasedOnBaseURL = constructURLBasedOnBaseURL;
exports.globToRegexPattern = globToRegexPattern;
exports.resolveGlobToRegexPattern = resolveGlobToRegexPattern;
exports.urlMatches = urlMatches;
exports.urlMatchesEqual = urlMatchesEqual;
