'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const assert = require('../../utils/isomorphic/assert.js');
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

class WKProvisionalPage {
  constructor(session, page) {
    this._sessionListeners = [];
    this._mainFrameId = null;
    this._session = session;
    this._wkPage = page;
    this._coopNavigationRequest = page._page.mainFrame().pendingDocument()?.request;
    const overrideFrameId = (handler) => {
      return (payload) => {
        if (payload.frameId)
          payload.frameId = this._wkPage._page.frameManager.mainFrame()._id;
        handler(payload);
      };
    };
    const wkPage = this._wkPage;
    this._sessionListeners = [
      eventsHelper.eventsHelper.addEventListener(session, "Network.requestWillBeSent", overrideFrameId((e) => this._onRequestWillBeSent(e))),
      eventsHelper.eventsHelper.addEventListener(session, "Network.requestIntercepted", overrideFrameId((e) => wkPage._onRequestIntercepted(session, e))),
      eventsHelper.eventsHelper.addEventListener(session, "Network.responseReceived", overrideFrameId((e) => wkPage._onResponseReceived(session, e))),
      eventsHelper.eventsHelper.addEventListener(session, "Network.loadingFinished", overrideFrameId((e) => this._onLoadingFinished(e))),
      eventsHelper.eventsHelper.addEventListener(session, "Network.loadingFailed", overrideFrameId((e) => this._onLoadingFailed(e)))
    ];
    this.initializationPromise = this._wkPage._initializeSession(session, true, ({ frameTree }) => this._handleFrameTree(frameTree));
  }
  coopNavigationRequest() {
    return this._coopNavigationRequest;
  }
  dispose() {
    eventsHelper.eventsHelper.removeEventListeners(this._sessionListeners);
  }
  commit() {
    assert.assert(this._mainFrameId);
    this._wkPage._onFrameAttached(this._mainFrameId, null);
  }
  _onRequestWillBeSent(event) {
    if (this._coopNavigationRequest && this._coopNavigationRequest.url() === event.request.url) {
      this._wkPage._adoptRequestFromNewProcess(this._coopNavigationRequest, this._session, event.requestId);
      return;
    }
    this._wkPage._onRequestWillBeSent(this._session, event);
  }
  _onLoadingFinished(event) {
    this._coopNavigationRequest = void 0;
    this._wkPage._onLoadingFinished(event);
  }
  _onLoadingFailed(event) {
    this._coopNavigationRequest = void 0;
    this._wkPage._onLoadingFailed(this._session, event);
  }
  _handleFrameTree(frameTree) {
    assert.assert(!frameTree.frame.parentId);
    this._mainFrameId = frameTree.frame.id;
  }
}

exports.WKProvisionalPage = WKProvisionalPage;
