'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const dispatcher = require('./dispatcher.js');
const pageDispatcher = require('./pageDispatcher.js');

class DialogDispatcher extends dispatcher.Dispatcher {
  constructor(scope, dialog) {
    const page = pageDispatcher.PageDispatcher.fromNullable(scope, dialog.page().initializedOrUndefined());
    super(page || scope, dialog, "Dialog", {
      page,
      type: dialog.type(),
      message: dialog.message(),
      defaultValue: dialog.defaultValue()
    });
    this._type_Dialog = true;
  }
  async accept(params, progress) {
    await progress.race(this._object.accept(params.promptText));
  }
  async dismiss(params, progress) {
    await progress.race(this._object.dismiss());
  }
}

exports.DialogDispatcher = DialogDispatcher;
