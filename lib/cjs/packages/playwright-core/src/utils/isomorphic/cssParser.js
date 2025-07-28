'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const cssTokenizer = require('./cssTokenizer.js');

class InvalidSelectorError extends Error {
}
function isInvalidSelectorError(error) {
  return error instanceof InvalidSelectorError;
}
function parseCSS(selector, customNames) {
  let tokens;
  try {
    tokens = cssTokenizer.tokenize(selector);
    if (!(tokens[tokens.length - 1] instanceof cssTokenizer.EOFToken))
      tokens.push(new cssTokenizer.EOFToken());
  } catch (e) {
    const newMessage = e.message + ` while parsing css selector "${selector}". Did you mean to CSS.escape it?`;
    const index = (e.stack || "").indexOf(e.message);
    if (index !== -1)
      e.stack = e.stack.substring(0, index) + newMessage + e.stack.substring(index + e.message.length);
    e.message = newMessage;
    throw e;
  }
  const unsupportedToken = tokens.find((token) => {
    return token instanceof cssTokenizer.AtKeywordToken || token instanceof cssTokenizer.BadStringToken || token instanceof cssTokenizer.BadURLToken || token instanceof cssTokenizer.ColumnToken || token instanceof cssTokenizer.CDOToken || token instanceof cssTokenizer.CDCToken || token instanceof cssTokenizer.SemicolonToken || // TODO: Consider using these for something, e.g. to escape complex strings.
    // For example :xpath{ (//div/bar[@attr="foo"])[2]/baz }
    // Or this way :xpath( {complex-xpath-goes-here("hello")} )
    token instanceof cssTokenizer.OpenCurlyToken || token instanceof cssTokenizer.CloseCurlyToken || // TODO: Consider treating these as strings?
    token instanceof cssTokenizer.URLToken || token instanceof cssTokenizer.PercentageToken;
  });
  if (unsupportedToken)
    throw new InvalidSelectorError(`Unsupported token "${unsupportedToken.toSource()}" while parsing css selector "${selector}". Did you mean to CSS.escape it?`);
  let pos = 0;
  const names = /* @__PURE__ */ new Set();
  function unexpected() {
    return new InvalidSelectorError(`Unexpected token "${tokens[pos].toSource()}" while parsing css selector "${selector}". Did you mean to CSS.escape it?`);
  }
  function skipWhitespace() {
    while (tokens[pos] instanceof cssTokenizer.WhitespaceToken)
      pos++;
  }
  function isIdent(p = pos) {
    return tokens[p] instanceof cssTokenizer.IdentToken;
  }
  function isString(p = pos) {
    return tokens[p] instanceof cssTokenizer.StringToken;
  }
  function isNumber(p = pos) {
    return tokens[p] instanceof cssTokenizer.NumberToken;
  }
  function isComma(p = pos) {
    return tokens[p] instanceof cssTokenizer.CommaToken;
  }
  function isOpenParen(p = pos) {
    return tokens[p] instanceof cssTokenizer.OpenParenToken;
  }
  function isCloseParen(p = pos) {
    return tokens[p] instanceof cssTokenizer.CloseParenToken;
  }
  function isFunction(p = pos) {
    return tokens[p] instanceof cssTokenizer.FunctionToken;
  }
  function isStar(p = pos) {
    return tokens[p] instanceof cssTokenizer.DelimToken && tokens[p].value === "*";
  }
  function isEOF(p = pos) {
    return tokens[p] instanceof cssTokenizer.EOFToken;
  }
  function isClauseCombinator(p = pos) {
    return tokens[p] instanceof cssTokenizer.DelimToken && [">", "+", "~"].includes(tokens[p].value);
  }
  function isSelectorClauseEnd(p = pos) {
    return isComma(p) || isCloseParen(p) || isEOF(p) || isClauseCombinator(p) || tokens[p] instanceof cssTokenizer.WhitespaceToken;
  }
  function consumeFunctionArguments() {
    const result2 = [consumeArgument()];
    while (true) {
      skipWhitespace();
      if (!isComma())
        break;
      pos++;
      result2.push(consumeArgument());
    }
    return result2;
  }
  function consumeArgument() {
    skipWhitespace();
    if (isNumber())
      return tokens[pos++].value;
    if (isString())
      return tokens[pos++].value;
    return consumeComplexSelector();
  }
  function consumeComplexSelector() {
    const result2 = { simples: [] };
    skipWhitespace();
    if (isClauseCombinator()) {
      result2.simples.push({ selector: { functions: [{ name: "scope", args: [] }] }, combinator: "" });
    } else {
      result2.simples.push({ selector: consumeSimpleSelector(), combinator: "" });
    }
    while (true) {
      skipWhitespace();
      if (isClauseCombinator()) {
        result2.simples[result2.simples.length - 1].combinator = tokens[pos++].value;
        skipWhitespace();
      } else if (isSelectorClauseEnd()) {
        break;
      }
      result2.simples.push({ combinator: "", selector: consumeSimpleSelector() });
    }
    return result2;
  }
  function consumeSimpleSelector() {
    let rawCSSString = "";
    const functions = [];
    while (!isSelectorClauseEnd()) {
      if (isIdent() || isStar()) {
        rawCSSString += tokens[pos++].toSource();
      } else if (tokens[pos] instanceof cssTokenizer.HashToken) {
        rawCSSString += tokens[pos++].toSource();
      } else if (tokens[pos] instanceof cssTokenizer.DelimToken && tokens[pos].value === ".") {
        pos++;
        if (isIdent())
          rawCSSString += "." + tokens[pos++].toSource();
        else
          throw unexpected();
      } else if (tokens[pos] instanceof cssTokenizer.ColonToken) {
        pos++;
        if (isIdent()) {
          if (!customNames.has(tokens[pos].value.toLowerCase())) {
            rawCSSString += ":" + tokens[pos++].toSource();
          } else {
            const name = tokens[pos++].value.toLowerCase();
            functions.push({ name, args: [] });
            names.add(name);
          }
        } else if (isFunction()) {
          const name = tokens[pos++].value.toLowerCase();
          if (!customNames.has(name)) {
            rawCSSString += `:${name}(${consumeBuiltinFunctionArguments()})`;
          } else {
            functions.push({ name, args: consumeFunctionArguments() });
            names.add(name);
          }
          skipWhitespace();
          if (!isCloseParen())
            throw unexpected();
          pos++;
        } else {
          throw unexpected();
        }
      } else if (tokens[pos] instanceof cssTokenizer.OpenSquareToken) {
        rawCSSString += "[";
        pos++;
        while (!(tokens[pos] instanceof cssTokenizer.CloseSquareToken) && !isEOF())
          rawCSSString += tokens[pos++].toSource();
        if (!(tokens[pos] instanceof cssTokenizer.CloseSquareToken))
          throw unexpected();
        rawCSSString += "]";
        pos++;
      } else {
        throw unexpected();
      }
    }
    if (!rawCSSString && !functions.length)
      throw unexpected();
    return { css: rawCSSString || void 0, functions };
  }
  function consumeBuiltinFunctionArguments() {
    let s = "";
    let balance = 1;
    while (!isEOF()) {
      if (isOpenParen() || isFunction())
        balance++;
      if (isCloseParen())
        balance--;
      if (!balance)
        break;
      s += tokens[pos++].toSource();
    }
    return s;
  }
  const result = consumeFunctionArguments();
  if (!isEOF())
    throw unexpected();
  if (result.some((arg) => typeof arg !== "object" || !("simples" in arg)))
    throw new InvalidSelectorError(`Error while parsing css selector "${selector}". Did you mean to CSS.escape it?`);
  return { selector: result, names: Array.from(names) };
}

exports.InvalidSelectorError = InvalidSelectorError;
exports.isInvalidSelectorError = isInvalidSelectorError;
exports.parseCSS = parseCSS;
