'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const clientHelper = require('./clientHelper.js');
const locator = require('./locator.js');

class Selectors {
  constructor(platform) {
    this._selectorEngines = [];
    this._contextsForSelectors = /* @__PURE__ */ new Set();
    this._platform = platform;
  }
  async register(name, script, options = {}) {
    if (this._selectorEngines.some((engine) => engine.name === name))
      throw new Error(`selectors.register: "${name}" selector engine has been already registered`);
    const source = await clientHelper.evaluationScript(this._platform, script, void 0, false);
    const selectorEngine = { ...options, name, source };
    for (const context of this._contextsForSelectors)
      await context._channel.registerSelectorEngine({ selectorEngine });
    this._selectorEngines.push(selectorEngine);
  }
  setTestIdAttribute(attributeName) {
    this._testIdAttributeName = attributeName;
    locator.setTestIdAttribute(attributeName);
    for (const context of this._contextsForSelectors)
      context._channel.setTestIdAttributeName({ testIdAttributeName: attributeName }).catch(() => {
      });
  }
  _withSelectorOptions(options) {
    return { ...options, selectorEngines: this._selectorEngines, testIdAttributeName: this._testIdAttributeName };
  }
}

exports.Selectors = Selectors;
