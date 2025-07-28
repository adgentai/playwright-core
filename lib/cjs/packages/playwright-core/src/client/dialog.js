'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const channelOwner = require('./channelOwner.js');
const page = require('./page.js');

class Dialog extends channelOwner.ChannelOwner {
  static from(dialog) {
    return dialog._object;
  }
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    this._page = page.Page.fromNullable(initializer.page);
  }
  page() {
    return this._page;
  }
  type() {
    return this._initializer.type;
  }
  message() {
    return this._initializer.message;
  }
  defaultValue() {
    return this._initializer.defaultValue;
  }
  async accept(promptText) {
    await this._channel.accept({ promptText });
  }
  async dismiss() {
    await this._channel.dismiss();
  }
}

exports.Dialog = Dialog;
