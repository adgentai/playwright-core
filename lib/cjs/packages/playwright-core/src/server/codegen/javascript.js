'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const language = require('./language.js');
const locatorGenerators = require('../../utils/isomorphic/locatorGenerators.js');
const stringUtils = require('../../utils/isomorphic/stringUtils.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
require('../utils/debugLogger.js');
require('../../../../../bundles/fs.js');
require('node:path');
require('../../zipBundle.js');
require('../utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../utils/happyEyeballs.js');
require('../utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('../utils/profiler.js');
require('../utils/socksProxy.js');
require('node:os');
require('../utils/zones.js');
const deviceDescriptors = require('../deviceDescriptors.js');

class JavaScriptLanguageGenerator {
  constructor(isTest) {
    this.groupName = "Node.js";
    this.highlighter = "javascript";
    this.id = isTest ? "playwright-test" : "javascript";
    this.name = isTest ? "Test Runner" : "Library";
    this._isTest = isTest;
  }
  generateAction(actionInContext) {
    const action = actionInContext.action;
    if (this._isTest && (action.name === "openPage" || action.name === "closePage"))
      return "";
    const pageAlias = actionInContext.frame.pageAlias;
    const formatter = new JavaScriptFormatter(2);
    if (action.name === "openPage") {
      formatter.add(`const ${pageAlias} = await context.newPage();`);
      if (action.url && action.url !== "about:blank" && action.url !== "chrome://newtab/")
        formatter.add(`await ${pageAlias}.goto(${quote(action.url)});`);
      return formatter.format();
    }
    const locators = actionInContext.frame.framePath.map((selector) => `.${this._asLocator(selector)}.contentFrame()`);
    const subject = `${pageAlias}${locators.join("")}`;
    const signals = language.toSignalMap(action);
    if (signals.dialog) {
      formatter.add(`  ${pageAlias}.once('dialog', dialog => {
    console.log(\`Dialog message: \${dialog.message()}\`);
    dialog.dismiss().catch(() => {});
  });`);
    }
    if (signals.popup)
      formatter.add(`const ${signals.popup.popupAlias}Promise = ${pageAlias}.waitForEvent('popup');`);
    if (signals.download)
      formatter.add(`const download${signals.download.downloadAlias}Promise = ${pageAlias}.waitForEvent('download');`);
    formatter.add(wrapWithStep(actionInContext.description, this._generateActionCall(subject, actionInContext)));
    if (signals.popup)
      formatter.add(`const ${signals.popup.popupAlias} = await ${signals.popup.popupAlias}Promise;`);
    if (signals.download)
      formatter.add(`const download${signals.download.downloadAlias} = await download${signals.download.downloadAlias}Promise;`);
    return formatter.format();
  }
  _generateActionCall(subject, actionInContext) {
    const action = actionInContext.action;
    switch (action.name) {
      case "openPage":
        throw Error("Not reached");
      case "closePage":
        return `await ${subject}.close();`;
      case "click": {
        let method = "click";
        if (action.clickCount === 2)
          method = "dblclick";
        const options = language.toClickOptionsForSourceCode(action);
        const optionsString = formatOptions(options);
        return `await ${subject}.${this._asLocator(action.selector)}.${method}(${optionsString});`;
      }
      case "check":
        return `await ${subject}.${this._asLocator(action.selector)}.check();`;
      case "uncheck":
        return `await ${subject}.${this._asLocator(action.selector)}.uncheck();`;
      case "fill":
        return `await ${subject}.${this._asLocator(action.selector)}.fill(${quote(action.text)});`;
      case "setInputFiles":
        return `await ${subject}.${this._asLocator(action.selector)}.setInputFiles(${formatObject(action.files.length === 1 ? action.files[0] : action.files)});`;
      case "press": {
        const modifiers = language.toKeyboardModifiers(action.modifiers);
        const shortcut = [...modifiers, action.key].join("+");
        return `await ${subject}.${this._asLocator(action.selector)}.press(${quote(shortcut)});`;
      }
      case "navigate":
        return `await ${subject}.goto(${quote(action.url)});`;
      case "select":
        return `await ${subject}.${this._asLocator(action.selector)}.selectOption(${formatObject(action.options.length === 1 ? action.options[0] : action.options)});`;
      case "assertText":
        return `${this._isTest ? "" : "// "}await expect(${subject}.${this._asLocator(action.selector)}).${action.substring ? "toContainText" : "toHaveText"}(${quote(action.text)});`;
      case "assertChecked":
        return `${this._isTest ? "" : "// "}await expect(${subject}.${this._asLocator(action.selector)})${action.checked ? "" : ".not"}.toBeChecked();`;
      case "assertVisible":
        return `${this._isTest ? "" : "// "}await expect(${subject}.${this._asLocator(action.selector)}).toBeVisible();`;
      case "assertValue": {
        const assertion = action.value ? `toHaveValue(${quote(action.value)})` : `toBeEmpty()`;
        return `${this._isTest ? "" : "// "}await expect(${subject}.${this._asLocator(action.selector)}).${assertion};`;
      }
      case "assertSnapshot": {
        const commentIfNeeded = this._isTest ? "" : "// ";
        return `${commentIfNeeded}await expect(${subject}.${this._asLocator(action.selector)}).toMatchAriaSnapshot(${quoteMultiline(action.ariaSnapshot, `${commentIfNeeded}  `)});`;
      }
    }
  }
  _asLocator(selector) {
    return locatorGenerators.asLocator("javascript", selector);
  }
  generateHeader(options) {
    if (this._isTest)
      return this.generateTestHeader(options);
    return this.generateStandaloneHeader(options);
  }
  generateFooter(saveStorage) {
    if (this._isTest)
      return this.generateTestFooter(saveStorage);
    return this.generateStandaloneFooter(saveStorage);
  }
  generateTestHeader(options) {
    const formatter = new JavaScriptFormatter();
    const useText = formatContextOptions(options.contextOptions, options.deviceName, this._isTest);
    formatter.add(`
      import { test, expect${options.deviceName ? ", devices" : ""} } from '@playwright/test';
${useText ? "\ntest.use(" + useText + ");\n" : ""}
      test('test', async ({ page }) => {`);
    if (options.contextOptions.recordHar) {
      const url = options.contextOptions.recordHar.urlFilter;
      formatter.add(`  await page.routeFromHAR(${quote(options.contextOptions.recordHar.path)}${url ? `, ${formatOptions({ url })}` : ""});`);
    }
    return formatter.format();
  }
  generateTestFooter(saveStorage) {
    return `});`;
  }
  generateStandaloneHeader(options) {
    const formatter = new JavaScriptFormatter();
    formatter.add(`
      const { ${options.browserName}${options.deviceName ? ", devices" : ""} } = require('playwright');

      (async () => {
        const browser = await ${options.browserName}.launch(${formatObjectOrVoid(options.launchOptions)});
        const context = await browser.newContext(${formatContextOptions(options.contextOptions, options.deviceName)});`);
    if (options.contextOptions.recordHar)
      formatter.add(`        await context.routeFromHAR(${quote(options.contextOptions.recordHar.path)});`);
    return formatter.format();
  }
  generateStandaloneFooter(saveStorage) {
    const storageStateLine = saveStorage ? `
  await context.storageState({ path: ${quote(saveStorage)} });` : "";
    return `
  // ---------------------${storageStateLine}
  await context.close();
  await browser.close();
})();`;
  }
}
function formatOptions(value, hasArguments) {
  const keys = Object.keys(value);
  if (!keys.length)
    return "";
  return ("") + formatObject(value);
}
function formatObject(value, indent = "  ") {
  if (typeof value === "string")
    return quote(value);
  if (Array.isArray(value))
    return `[${value.map((o) => formatObject(o)).join(", ")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).filter((key) => value[key] !== void 0).sort();
    if (!keys.length)
      return "{}";
    const tokens = [];
    for (const key of keys)
      tokens.push(`${key}: ${formatObject(value[key])}`);
    return `{
${indent}${tokens.join(`,
${indent}`)}
}`;
  }
  return String(value);
}
function formatObjectOrVoid(value, indent = "  ") {
  const result = formatObject(value, indent);
  return result === "{}" ? "" : result;
}
function formatContextOptions(options, deviceName, isTest) {
  const device = deviceName && deviceDescriptors.deviceDescriptors[deviceName];
  options = { ...options, recordHar: void 0 };
  if (!device)
    return formatObjectOrVoid(options);
  let serializedObject = formatObjectOrVoid(language.sanitizeDeviceOptions(device, options));
  if (!serializedObject)
    serializedObject = "{\n}";
  const lines = serializedObject.split("\n");
  lines.splice(1, 0, `...devices[${quote(deviceName)}],`);
  return lines.join("\n");
}
class JavaScriptFormatter {
  constructor(offset = 0) {
    this._lines = [];
    this._baseIndent = " ".repeat(2);
    this._baseOffset = " ".repeat(offset);
  }
  prepend(text) {
    const trim = isMultilineString(text) ? (line) => line : (line) => line.trim();
    this._lines = text.trim().split("\n").map(trim).concat(this._lines);
  }
  add(text) {
    const trim = isMultilineString(text) ? (line) => line : (line) => line.trim();
    this._lines.push(...text.trim().split("\n").map(trim));
  }
  newLine() {
    this._lines.push("");
  }
  format() {
    let spaces = "";
    let previousLine = "";
    return this._lines.map((line) => {
      if (line === "")
        return line;
      if (line.startsWith("}") || line.startsWith("]"))
        spaces = spaces.substring(this._baseIndent.length);
      const extraSpaces = /^(for|while|if|try).*\(.*\)$/.test(previousLine) ? this._baseIndent : "";
      previousLine = line;
      const callCarryOver = line.startsWith(".set");
      line = spaces + extraSpaces + (callCarryOver ? this._baseIndent : "") + line;
      if (line.endsWith("{") || line.endsWith("["))
        spaces += this._baseIndent;
      return this._baseOffset + line;
    }).join("\n");
  }
}
function quote(text) {
  return stringUtils.escapeWithQuotes(text, "'");
}
function wrapWithStep(description, body) {
  return description ? `await test.step(\`${description}\`, async () => {
${body}
});` : body;
}
function quoteMultiline(text, indent = "  ") {
  const escape = (text2) => text2.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  const lines = text.split("\n");
  if (lines.length === 1)
    return "`" + escape(text) + "`";
  return "`\n" + lines.map((line) => indent + escape(line).replace(/\${/g, "\\${")).join("\n") + `
${indent}\``;
}
function isMultilineString(text) {
  return text.match(/`[\S\s]*`/)?.[0].includes("\n");
}

exports.JavaScriptFormatter = JavaScriptFormatter;
exports.JavaScriptLanguageGenerator = JavaScriptLanguageGenerator;
exports.quoteMultiline = quoteMultiline;
