'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('../../../../bundles/fs.js');
const assert = require('../utils/isomorphic/assert.js');
const manualPromise = require('../utils/isomorphic/manualPromise.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
require('./utils/debug.js');
require('./utils/debugLogger.js');
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
const errors = require('./errors.js');
const instrumentation = require('./instrumentation.js');

class Artifact extends instrumentation.SdkObject {
  constructor(parent, localPath, unaccessibleErrorMessage, cancelCallback) {
    super(parent, "artifact");
    this._finishedPromise = new manualPromise.ManualPromise();
    this._saveCallbacks = [];
    this._finished = false;
    this._deleted = false;
    this._localPath = localPath;
    this._unaccessibleErrorMessage = unaccessibleErrorMessage;
    this._cancelCallback = cancelCallback;
  }
  finishedPromise() {
    return this._finishedPromise;
  }
  localPath() {
    return this._localPath;
  }
  async localPathAfterFinished() {
    if (this._unaccessibleErrorMessage)
      throw new Error(this._unaccessibleErrorMessage);
    await this._finishedPromise;
    if (this._failureError)
      throw this._failureError;
    return this._localPath;
  }
  saveAs(saveCallback) {
    if (this._unaccessibleErrorMessage)
      throw new Error(this._unaccessibleErrorMessage);
    if (this._deleted)
      throw new Error(`File already deleted. Save before deleting.`);
    if (this._failureError)
      throw this._failureError;
    if (this._finished) {
      saveCallback(this._localPath).catch(() => {
      });
      return;
    }
    this._saveCallbacks.push(saveCallback);
  }
  async failureError() {
    if (this._unaccessibleErrorMessage)
      return this._unaccessibleErrorMessage;
    await this._finishedPromise;
    return this._failureError?.message || null;
  }
  async cancel() {
    assert.assert(this._cancelCallback !== void 0);
    return this._cancelCallback();
  }
  async delete() {
    if (this._unaccessibleErrorMessage)
      return;
    const fileName = await this.localPathAfterFinished();
    if (this._deleted)
      return;
    this._deleted = true;
    if (fileName)
      await fs.default.promises.unlink(fileName).catch((e) => {
      });
  }
  async deleteOnContextClose() {
    if (this._deleted)
      return;
    this._deleted = true;
    if (!this._unaccessibleErrorMessage)
      await fs.default.promises.unlink(this._localPath).catch((e) => {
      });
    await this.reportFinished(new errors.TargetClosedError());
  }
  async reportFinished(error) {
    if (this._finished)
      return;
    this._finished = true;
    this._failureError = error;
    if (error) {
      for (const callback of this._saveCallbacks)
        await callback("", error);
    } else {
      for (const callback of this._saveCallbacks)
        await callback(this._localPath);
    }
    this._saveCallbacks = [];
    this._finishedPromise.resolve();
  }
}

exports.Artifact = Artifact;
