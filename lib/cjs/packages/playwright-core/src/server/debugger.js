'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const require$$0$3 = require('node:events');
const protocolMetainfo = require('../utils/isomorphic/protocolMetainfo.js');
const time = require('../utils/isomorphic/time.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
const debug = require('./utils/debug.js');
require('./utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../zipBundle.js');
require('./utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./utils/happyEyeballs.js');
require('./utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./utils/profiler.js');
require('./utils/socksProxy.js');
require('node:os');
require('./utils/zones.js');
const browserContext = require('./browserContext.js');

const symbol = Symbol("Debugger");
class Debugger extends require$$0$3.EventEmitter {
  constructor(context) {
    super();
    this._pauseOnNextStatement = false;
    this._pausedCallsMetadata = /* @__PURE__ */ new Map();
    this._muted = false;
    this._context = context;
    this._context[symbol] = this;
    this._enabled = debug.debugMode() === "inspector";
    if (this._enabled)
      this.pauseOnNextStatement();
    context.instrumentation.addListener(this, context);
    this._context.once(browserContext.BrowserContext.Events.Close, () => {
      this._context.instrumentation.removeListener(this);
    });
    this._slowMo = this._context._browser.options.slowMo;
  }
  static {
    this.Events = {
      PausedStateChanged: "pausedstatechanged"
    };
  }
  async setMuted(muted) {
    this._muted = muted;
  }
  async onBeforeCall(sdkObject, metadata) {
    if (this._muted)
      return;
    if (shouldPauseOnCall(sdkObject, metadata) || this._pauseOnNextStatement && shouldPauseBeforeStep(metadata))
      await this.pause(sdkObject, metadata);
  }
  async _doSlowMo() {
    await new Promise((f) => setTimeout(f, this._slowMo));
  }
  async onAfterCall(sdkObject, metadata) {
    if (this._slowMo && shouldSlowMo(metadata))
      await this._doSlowMo();
  }
  async onBeforeInputAction(sdkObject, metadata) {
    if (this._muted)
      return;
    if (this._enabled && this._pauseOnNextStatement)
      await this.pause(sdkObject, metadata);
  }
  async pause(sdkObject, metadata) {
    if (this._muted)
      return;
    this._enabled = true;
    metadata.pauseStartTime = time.monotonicTime();
    const result = new Promise((resolve) => {
      this._pausedCallsMetadata.set(metadata, { resolve, sdkObject });
    });
    this.emit(Debugger.Events.PausedStateChanged);
    return result;
  }
  resume(step) {
    if (!this.isPaused())
      return;
    this._pauseOnNextStatement = step;
    const endTime = time.monotonicTime();
    for (const [metadata, { resolve }] of this._pausedCallsMetadata) {
      metadata.pauseEndTime = endTime;
      resolve();
    }
    this._pausedCallsMetadata.clear();
    this.emit(Debugger.Events.PausedStateChanged);
  }
  pauseOnNextStatement() {
    this._pauseOnNextStatement = true;
  }
  isPaused(metadata) {
    if (metadata)
      return this._pausedCallsMetadata.has(metadata);
    return !!this._pausedCallsMetadata.size;
  }
  pausedDetails() {
    const result = [];
    for (const [metadata, { sdkObject }] of this._pausedCallsMetadata)
      result.push({ metadata, sdkObject });
    return result;
  }
}
function shouldPauseOnCall(sdkObject, metadata) {
  if (sdkObject.attribution.playwright.options.isServer)
    return false;
  if (!sdkObject.attribution.browser?.options.headful && !debug.isUnderTest())
    return false;
  return metadata.method === "pause";
}
function shouldPauseBeforeStep(metadata) {
  if (metadata.internal)
    return false;
  if (metadata.method === "close")
    return true;
  if (metadata.method === "waitForSelector" || metadata.method === "waitForEventInfo" || metadata.method === "querySelector" || metadata.method === "querySelectorAll")
    return false;
  const step = metadata.type + "." + metadata.method;
  const metainfo = protocolMetainfo.methodMetainfo.get(step);
  if (metainfo?.internal)
    return false;
  return !!metainfo?.snapshot && !metainfo.pausesBeforeInput;
}
function shouldSlowMo(metadata) {
  const metainfo = protocolMetainfo.methodMetainfo.get(metadata.type + "." + metadata.method);
  return !!metainfo?.slowMo;
}

exports.Debugger = Debugger;
exports.shouldSlowMo = shouldSlowMo;
