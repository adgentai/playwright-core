'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const input = require('../input.js');
const bidiKeyboard = require('./third_party/bidiKeyboard.js');
const bidiProtocolCore = require('./third_party/bidiProtocolCore.js');
require('./third_party/bidiProtocolPermissions.js');

class RawKeyboardImpl {
  constructor(session) {
    this._session = session;
  }
  setSession(session) {
    this._session = session;
  }
  async keydown(progress, modifiers, keyName, description, autoRepeat) {
    keyName = input.resolveSmartModifierString(keyName);
    const actions = [];
    actions.push({ type: "keyDown", value: bidiKeyboard.getBidiKeyValue(keyName) });
    await this._performActions(progress, actions);
  }
  async keyup(progress, modifiers, keyName, description) {
    keyName = input.resolveSmartModifierString(keyName);
    const actions = [];
    actions.push({ type: "keyUp", value: bidiKeyboard.getBidiKeyValue(keyName) });
    await this._performActions(progress, actions);
  }
  async sendText(progress, text) {
    const actions = [];
    for (const char of text) {
      const value = bidiKeyboard.getBidiKeyValue(char);
      actions.push({ type: "keyDown", value });
      actions.push({ type: "keyUp", value });
    }
    await this._performActions(progress, actions);
  }
  async _performActions(progress, actions) {
    await progress.race(this._session.send("input.performActions", {
      context: this._session.sessionId,
      actions: [
        {
          type: "key",
          id: "pw_keyboard",
          actions
        }
      ]
    }));
  }
}
class RawMouseImpl {
  constructor(session) {
    this._session = session;
  }
  async move(progress, x, y, button, buttons, modifiers, forClick) {
    await this._performActions(progress, [{ type: "pointerMove", x, y }]);
  }
  async down(progress, x, y, button, buttons, modifiers, clickCount) {
    await this._performActions(progress, [{ type: "pointerDown", button: toBidiButton(button) }]);
  }
  async up(progress, x, y, button, buttons, modifiers, clickCount) {
    await this._performActions(progress, [{ type: "pointerUp", button: toBidiButton(button) }]);
  }
  async wheel(progress, x, y, buttons, modifiers, deltaX, deltaY) {
    x = Math.floor(x);
    y = Math.floor(y);
    await progress.race(this._session.send("input.performActions", {
      context: this._session.sessionId,
      actions: [
        {
          type: "wheel",
          id: "pw_mouse_wheel",
          actions: [{ type: "scroll", x, y, deltaX, deltaY }]
        }
      ]
    }));
  }
  async _performActions(progress, actions) {
    await progress.race(this._session.send("input.performActions", {
      context: this._session.sessionId,
      actions: [
        {
          type: "pointer",
          id: "pw_mouse",
          parameters: {
            pointerType: bidiProtocolCore.Input.PointerType.Mouse
          },
          actions
        }
      ]
    }));
  }
}
class RawTouchscreenImpl {
  constructor(session) {
    this._session = session;
  }
  async tap(progress, x, y, modifiers) {
  }
}
function toBidiButton(button) {
  switch (button) {
    case "left":
      return 0;
    case "right":
      return 2;
    case "middle":
      return 1;
  }
  throw new Error("Unknown button: " + button);
}

exports.RawKeyboardImpl = RawKeyboardImpl;
exports.RawMouseImpl = RawMouseImpl;
exports.RawTouchscreenImpl = RawTouchscreenImpl;
