'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const path = require('node:path');
const page = require('./page.js');
const assert = require('../utils/isomorphic/assert.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
require('./utils/debug.js');
require('./utils/debugLogger.js');
require('../../../../bundles/fs.js');
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
const artifact = require('./artifact.js');

class Download {
  constructor(page, downloadsPath, uuid, url, suggestedFilename) {
    const unaccessibleErrorMessage = page.browserContext._options.acceptDownloads === "deny" ? "Pass { acceptDownloads: true } when you are creating your browser context." : void 0;
    this.artifact = new artifact.Artifact(page, path.join(downloadsPath, uuid), unaccessibleErrorMessage, () => {
      return this._page.browserContext.cancelDownload(uuid);
    });
    this._page = page;
    this.url = url;
    this._suggestedFilename = suggestedFilename;
    page.browserContext._downloads.add(this);
    if (suggestedFilename !== void 0)
      this._fireDownloadEvent();
  }
  page() {
    return this._page;
  }
  _filenameSuggested(suggestedFilename) {
    assert.assert(this._suggestedFilename === void 0);
    this._suggestedFilename = suggestedFilename;
    this._fireDownloadEvent();
  }
  suggestedFilename() {
    return this._suggestedFilename;
  }
  _fireDownloadEvent() {
    this._page.instrumentation.onDownload(this._page, this);
    this._page.emit(page.Page.Events.Download, this);
  }
}

exports.Download = Download;
