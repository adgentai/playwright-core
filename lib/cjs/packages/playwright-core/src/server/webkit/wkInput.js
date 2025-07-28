'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const stringUtils = require('../../utils/isomorphic/stringUtils.js');
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
const input = require('../input.js');
const macEditingCommands = require('../macEditingCommands.js');

function toModifiersMask(modifiers) {
  let mask = 0;
  if (modifiers.has("Shift"))
    mask |= 1;
  if (modifiers.has("Control"))
    mask |= 2;
  if (modifiers.has("Alt"))
    mask |= 4;
  if (modifiers.has("Meta"))
    mask |= 8;
  return mask;
}
function toButtonsMask(buttons) {
  let mask = 0;
  if (buttons.has("left"))
    mask |= 1;
  if (buttons.has("right"))
    mask |= 2;
  if (buttons.has("middle"))
    mask |= 4;
  return mask;
}
class RawKeyboardImpl {
  constructor(session) {
    this._pageProxySession = session;
  }
  setSession(session) {
    this._session = session;
  }
  async keydown(progress, modifiers, keyName, description, autoRepeat) {
    const parts = [];
    for (const modifier of ["Shift", "Control", "Alt", "Meta"]) {
      if (modifiers.has(modifier))
        parts.push(modifier);
    }
    const { code, keyCode, key, text } = description;
    parts.push(code);
    const shortcut = parts.join("+");
    let commands = macEditingCommands.macEditingCommands[shortcut];
    if (stringUtils.isString(commands))
      commands = [commands];
    await progress.race(this._pageProxySession.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      modifiers: toModifiersMask(modifiers),
      windowsVirtualKeyCode: keyCode,
      code,
      key,
      text,
      unmodifiedText: text,
      autoRepeat,
      macCommands: commands,
      isKeypad: description.location === input.keypadLocation
    }));
  }
  async keyup(progress, modifiers, keyName, description) {
    const { code, key } = description;
    await progress.race(this._pageProxySession.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      modifiers: toModifiersMask(modifiers),
      key,
      windowsVirtualKeyCode: description.keyCode,
      code,
      isKeypad: description.location === input.keypadLocation
    }));
  }
  async sendText(progress, text) {
    await progress.race(this._session.send("Page.insertText", { text }));
  }
}
class RawMouseImpl {
  constructor(session) {
    this._pageProxySession = session;
  }
  setSession(session) {
    this._session = session;
  }
  async move(progress, x, y, button, buttons, modifiers, forClick) {
    await progress.race(this._pageProxySession.send("Input.dispatchMouseEvent", {
      type: "move",
      button,
      buttons: toButtonsMask(buttons),
      x,
      y,
      modifiers: toModifiersMask(modifiers)
    }));
  }
  async down(progress, x, y, button, buttons, modifiers, clickCount) {
    await progress.race(this._pageProxySession.send("Input.dispatchMouseEvent", {
      type: "down",
      button,
      buttons: toButtonsMask(buttons),
      x,
      y,
      modifiers: toModifiersMask(modifiers),
      clickCount
    }));
  }
  async up(progress, x, y, button, buttons, modifiers, clickCount) {
    await progress.race(this._pageProxySession.send("Input.dispatchMouseEvent", {
      type: "up",
      button,
      buttons: toButtonsMask(buttons),
      x,
      y,
      modifiers: toModifiersMask(modifiers),
      clickCount
    }));
  }
  async wheel(progress, x, y, buttons, modifiers, deltaX, deltaY) {
    if (this._page?.browserContext._options.isMobile)
      throw new Error("Mouse wheel is not supported in mobile WebKit");
    await this._session.send("Page.updateScrollingState");
    await progress.race(this._page.mainFrame().evaluateExpression(`new Promise(requestAnimationFrame)`, { world: "utility" }));
    await progress.race(this._pageProxySession.send("Input.dispatchWheelEvent", {
      x,
      y,
      deltaX,
      deltaY,
      modifiers: toModifiersMask(modifiers)
    }));
  }
  setPage(page) {
    this._page = page;
  }
}
class RawTouchscreenImpl {
  constructor(session) {
    this._pageProxySession = session;
  }
  async tap(progress, x, y, modifiers) {
    await progress.race(this._pageProxySession.send("Input.dispatchTapEvent", {
      x,
      y,
      modifiers: toModifiersMask(modifiers)
    }));
  }
}

exports.RawKeyboardImpl = RawKeyboardImpl;
exports.RawMouseImpl = RawMouseImpl;
exports.RawTouchscreenImpl = RawTouchscreenImpl;
