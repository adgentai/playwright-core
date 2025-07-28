'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const protocolFormatter = require('../../utils/isomorphic/protocolFormatter.js');
const stringUtils = require('../../utils/isomorphic/stringUtils.js');
const time = require('../../utils/isomorphic/time.js');
const timeoutRunner = require('../../utils/isomorphic/timeoutRunner.js');
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

function buildFullSelector(framePath, selector) {
  return [...framePath, selector].join(" >> internal:control=enter-frame >> ");
}
function metadataToCallLog(metadata, status) {
  const title = protocolFormatter.renderTitleForCall(metadata);
  if (metadata.error)
    status = "error";
  const params = {
    url: metadata.params?.url,
    selector: metadata.params?.selector
  };
  let duration = metadata.endTime ? metadata.endTime - metadata.startTime : void 0;
  if (typeof duration === "number" && metadata.pauseStartTime && metadata.pauseEndTime) {
    duration -= metadata.pauseEndTime - metadata.pauseStartTime;
    duration = Math.max(duration, 0);
  }
  const callLog = {
    id: metadata.id,
    messages: metadata.log,
    title: title ?? "",
    status,
    error: metadata.error?.error?.message,
    params,
    duration
  };
  return callLog;
}
function mainFrameForAction(pageAliases, actionInContext) {
  const pageAlias = actionInContext.frame.pageAlias;
  const page = [...pageAliases.entries()].find(([, alias]) => pageAlias === alias)?.[0];
  if (!page)
    throw new Error(`Internal error: page ${pageAlias} not found in [${[...pageAliases.values()]}]`);
  return page.mainFrame();
}
function isSameAction(a, b) {
  return a.action.name === b.action.name && a.frame.pageAlias === b.frame.pageAlias && a.frame.framePath.join("|") === b.frame.framePath.join("|");
}
function isSameSelector(action, lastAction) {
  return "selector" in action.action && "selector" in lastAction.action && action.action.selector === lastAction.action.selector;
}
function shouldMergeAction(action, lastAction) {
  if (!lastAction)
    return false;
  return isSameAction(action, lastAction) && (action.action.name === "navigate" || action.action.name === "fill" && isSameSelector(action, lastAction));
}
function collapseActions(actions) {
  const result = [];
  for (const action of actions) {
    const lastAction = result[result.length - 1];
    const shouldMerge = shouldMergeAction(action, lastAction);
    if (!shouldMerge) {
      result.push(action);
      continue;
    }
    const startTime = result[result.length - 1].startTime;
    result[result.length - 1] = action;
    result[result.length - 1].startTime = startTime;
  }
  return result;
}
async function generateFrameSelector(frame) {
  const selectorPromises = [];
  while (frame) {
    const parent = frame.parentFrame();
    if (!parent)
      break;
    selectorPromises.push(generateFrameSelectorInParent(parent, frame));
    frame = parent;
  }
  const result = await Promise.all(selectorPromises);
  return result.reverse();
}
async function generateFrameSelectorInParent(parent, frame) {
  const result = await timeoutRunner.raceAgainstDeadline(async () => {
    try {
      const frameElement = await frame.frameElement();
      if (!frameElement || !parent)
        return;
      const utility = await parent._utilityContext();
      const injected = await utility.injectedScript();
      const selector = await injected.evaluate((injected2, element) => {
        return injected2.generateSelectorSimple(element);
      }, frameElement);
      return selector;
    } catch (e) {
    }
  }, time.monotonicTime() + 2e3);
  if (!result.timedOut && result.result)
    return result.result;
  if (frame.name())
    return `iframe[name=${stringUtils.quoteCSSAttributeValue(frame.name())}]`;
  return `iframe[src=${stringUtils.quoteCSSAttributeValue(frame.url())}]`;
}

exports.buildFullSelector = buildFullSelector;
exports.collapseActions = collapseActions;
exports.generateFrameSelector = generateFrameSelector;
exports.mainFrameForAction = mainFrameForAction;
exports.metadataToCallLog = metadataToCallLog;
exports.shouldMergeAction = shouldMergeAction;
