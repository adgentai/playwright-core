'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const assert = require('../utils/isomorphic/assert.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
require('./utils/debug.js');
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
const instrumentation = require('./instrumentation.js');

class Dialog extends instrumentation.SdkObject {
  constructor(page, type, message, onHandle, defaultValue) {
    super(page, "dialog");
    this._handled = false;
    this._page = page;
    this._type = type;
    this._message = message;
    this._onHandle = onHandle;
    this._defaultValue = defaultValue || "";
  }
  page() {
    return this._page;
  }
  type() {
    return this._type;
  }
  message() {
    return this._message;
  }
  defaultValue() {
    return this._defaultValue;
  }
  async accept(promptText) {
    assert.assert(!this._handled, "Cannot accept dialog which is already handled!");
    this._handled = true;
    this._page.browserContext.dialogManager.dialogWillClose(this);
    await this._onHandle(true, promptText);
  }
  async dismiss() {
    assert.assert(!this._handled, "Cannot dismiss dialog which is already handled!");
    this._handled = true;
    this._page.browserContext.dialogManager.dialogWillClose(this);
    await this._onHandle(false);
  }
  async close() {
    if (this._type === "beforeunload")
      await this.accept();
    else
      await this.dismiss();
  }
}
class DialogManager {
  constructor(instrumentation) {
    this._dialogHandlers = /* @__PURE__ */ new Set();
    this._openedDialogs = /* @__PURE__ */ new Set();
    this._instrumentation = instrumentation;
  }
  dialogDidOpen(dialog) {
    for (const frame of dialog.page().frameManager.frames())
      frame._invalidateNonStallingEvaluations("JavaScript dialog interrupted evaluation");
    this._openedDialogs.add(dialog);
    this._instrumentation.onDialog(dialog);
    let hasHandlers = false;
    for (const handler of this._dialogHandlers) {
      if (handler(dialog))
        hasHandlers = true;
    }
    if (!hasHandlers)
      dialog.close().then(() => {
      });
  }
  dialogWillClose(dialog) {
    this._openedDialogs.delete(dialog);
  }
  addDialogHandler(handler) {
    this._dialogHandlers.add(handler);
  }
  removeDialogHandler(handler) {
    this._dialogHandlers.delete(handler);
    if (!this._dialogHandlers.size) {
      for (const dialog of this._openedDialogs)
        dialog.close().catch(() => {
        });
    }
  }
  hasOpenDialogsForPage(page) {
    return [...this._openedDialogs].some((dialog) => dialog.page() === page);
  }
  async closeBeforeUnloadDialogs() {
    await Promise.all([...this._openedDialogs].map(async (dialog) => {
      if (dialog.type() === "beforeunload")
        await dialog.dismiss();
    }));
  }
}

exports.Dialog = Dialog;
exports.DialogManager = DialogManager;
