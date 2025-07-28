'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
require('../utils/debugLogger.js');
const expectUtils = require('../utils/expectUtils.js');
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
const language = require('../codegen/language.js');
const instrumentation = require('../instrumentation.js');
const recorderUtils = require('./recorderUtils.js');
const progress = require('../progress.js');

async function performAction(pageAliases, actionInContext) {
  const callMetadata = instrumentation.serverSideCallMetadata();
  const mainFrame = recorderUtils.mainFrameForAction(pageAliases, actionInContext);
  const controller = new progress.ProgressController(callMetadata, mainFrame);
  const kActionTimeout = 5e3;
  return await controller.run((progress) => performActionImpl(progress, mainFrame, actionInContext), kActionTimeout);
}
async function performActionImpl(progress, mainFrame, actionInContext) {
  const { action } = actionInContext;
  if (action.name === "navigate") {
    await mainFrame.goto(progress, action.url);
    return;
  }
  if (action.name === "openPage")
    throw Error("Not reached");
  if (action.name === "closePage") {
    await mainFrame._page.close();
    return;
  }
  const selector = recorderUtils.buildFullSelector(actionInContext.frame.framePath, action.selector);
  if (action.name === "click") {
    const options = toClickOptions(action);
    await mainFrame.click(progress, selector, { ...options, strict: true });
    return;
  }
  if (action.name === "press") {
    const modifiers = language.toKeyboardModifiers(action.modifiers);
    const shortcut = [...modifiers, action.key].join("+");
    await mainFrame.press(progress, selector, shortcut, { strict: true });
    return;
  }
  if (action.name === "fill") {
    await mainFrame.fill(progress, selector, action.text, { strict: true });
    return;
  }
  if (action.name === "setInputFiles") {
    await mainFrame.setInputFiles(progress, selector, { selector, payloads: [], strict: true });
    return;
  }
  if (action.name === "check") {
    await mainFrame.check(progress, selector, { strict: true });
    return;
  }
  if (action.name === "uncheck") {
    await mainFrame.uncheck(progress, selector, { strict: true });
    return;
  }
  if (action.name === "select") {
    const values = action.options.map((value) => ({ value }));
    await mainFrame.selectOption(progress, selector, [], values, { strict: true });
    return;
  }
  if (action.name === "assertChecked") {
    await mainFrame.expect(progress, selector, {
      selector,
      expression: "to.be.checked",
      expectedValue: { checked: action.checked },
      isNot: !action.checked
    });
    return;
  }
  if (action.name === "assertText") {
    await mainFrame.expect(progress, selector, {
      selector,
      expression: "to.have.text",
      expectedText: expectUtils.serializeExpectedTextValues([action.text], { matchSubstring: true, normalizeWhiteSpace: true }),
      isNot: false
    });
    return;
  }
  if (action.name === "assertValue") {
    await mainFrame.expect(progress, selector, {
      selector,
      expression: "to.have.value",
      expectedValue: action.value,
      isNot: false
    });
    return;
  }
  if (action.name === "assertVisible") {
    await mainFrame.expect(progress, selector, {
      selector,
      expression: "to.be.visible",
      isNot: false
    });
    return;
  }
  throw new Error("Internal error: unexpected action " + action.name);
}
function toClickOptions(action) {
  const modifiers = language.toKeyboardModifiers(action.modifiers);
  const options = {};
  if (action.button !== "left")
    options.button = action.button;
  if (modifiers.length)
    options.modifiers = modifiers;
  if (action.clickCount > 1)
    options.clickCount = action.clickCount;
  if (action.position)
    options.position = action.position;
  return options;
}

exports.performAction = performAction;
exports.toClickOptions = toClickOptions;
