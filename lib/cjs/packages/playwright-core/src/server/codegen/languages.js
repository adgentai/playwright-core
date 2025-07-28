'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const csharp = require('./csharp.js');
const java = require('./java.js');
const javascript = require('./javascript.js');
const jsonl = require('./jsonl.js');
const python = require('./python.js');

function languageSet() {
  return /* @__PURE__ */ new Set([
    new javascript.JavaScriptLanguageGenerator(
      /* isPlaywrightTest */
      true
    ),
    new javascript.JavaScriptLanguageGenerator(
      /* isPlaywrightTest */
      false
    ),
    new python.PythonLanguageGenerator(
      /* isAsync */
      false,
      /* isPytest */
      true
    ),
    new python.PythonLanguageGenerator(
      /* isAsync */
      false,
      /* isPytest */
      false
    ),
    new python.PythonLanguageGenerator(
      /* isAsync */
      true,
      /* isPytest */
      false
    ),
    new csharp.CSharpLanguageGenerator("mstest"),
    new csharp.CSharpLanguageGenerator("nunit"),
    new csharp.CSharpLanguageGenerator("library"),
    new java.JavaLanguageGenerator("junit"),
    new java.JavaLanguageGenerator("library"),
    new jsonl.JsonlLanguageGenerator()
  ]);
}

exports.languageSet = languageSet;
