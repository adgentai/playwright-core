'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const locatorGenerators = require('../../utils/isomorphic/locatorGenerators.js');
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

class JsonlLanguageGenerator {
  constructor() {
    this.id = "jsonl";
    this.groupName = "";
    this.name = "JSONL";
    this.highlighter = "javascript";
  }
  generateAction(actionInContext) {
    const locator = actionInContext.action.selector ? JSON.parse(locatorGenerators.asLocator("jsonl", actionInContext.action.selector)) : void 0;
    const entry = {
      ...actionInContext.action,
      ...actionInContext.frame,
      locator
    };
    return JSON.stringify(entry);
  }
  generateHeader(options) {
    return JSON.stringify(options);
  }
  generateFooter(saveStorage) {
    return "";
  }
}

exports.JsonlLanguageGenerator = JsonlLanguageGenerator;
