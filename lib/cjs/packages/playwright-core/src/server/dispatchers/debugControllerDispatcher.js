'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
require('../utils/debugLogger.js');
const eventsHelper = require('../utils/eventsHelper.js');
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
const debugController = require('../debugController.js');
const dispatcher = require('./dispatcher.js');

class DebugControllerDispatcher extends dispatcher.Dispatcher {
  constructor(connection, debugController$1) {
    super(connection, debugController$1, "DebugController", {});
    this._type_DebugController = true;
    this._listeners = [
      eventsHelper.eventsHelper.addEventListener(this._object, debugController.DebugController.Events.StateChanged, (params) => {
        this._dispatchEvent("stateChanged", params);
      }),
      eventsHelper.eventsHelper.addEventListener(this._object, debugController.DebugController.Events.InspectRequested, ({ selector, locator, ariaSnapshot }) => {
        this._dispatchEvent("inspectRequested", { selector, locator, ariaSnapshot });
      }),
      eventsHelper.eventsHelper.addEventListener(this._object, debugController.DebugController.Events.SourceChanged, ({ text, header, footer, actions }) => {
        this._dispatchEvent("sourceChanged", { text, header, footer, actions });
      }),
      eventsHelper.eventsHelper.addEventListener(this._object, debugController.DebugController.Events.Paused, ({ paused }) => {
        this._dispatchEvent("paused", { paused });
      }),
      eventsHelper.eventsHelper.addEventListener(this._object, debugController.DebugController.Events.SetModeRequested, ({ mode }) => {
        this._dispatchEvent("setModeRequested", { mode });
      })
    ];
  }
  async initialize(params, progress) {
    this._object.initialize(params.codegenId, params.sdkLanguage);
  }
  async setReportStateChanged(params, progress) {
    this._object.setReportStateChanged(params.enabled);
  }
  async resetForReuse(params, progress) {
    await this._object.resetForReuse(progress);
  }
  async navigate(params, progress) {
    await this._object.navigate(progress, params.url);
  }
  async setRecorderMode(params, progress) {
    await this._object.setRecorderMode(progress, params);
  }
  async highlight(params, progress) {
    await this._object.highlight(progress, params);
  }
  async hideHighlight(params, progress) {
    await this._object.hideHighlight(progress);
  }
  async resume(params, progress) {
    await this._object.resume(progress);
  }
  async kill(params, progress) {
    this._object.kill();
  }
  async closeAllBrowsers(params, progress) {
    await this._object.closeAllBrowsers();
  }
  _onDispose() {
    eventsHelper.eventsHelper.removeEventListeners(this._listeners);
    this._object.dispose();
  }
}

exports.DebugControllerDispatcher = DebugControllerDispatcher;
