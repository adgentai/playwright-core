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
const crProtocolHelper = require('./crProtocolHelper.js');

class RawKeyboardImpl {
  constructor(_client, _isMac, _dragManger) {
    this._client = _client;
    this._isMac = _isMac;
    this._dragManger = _dragManger;
  }
  _commandsForCode(code, modifiers) {
    if (!this._isMac)
      return [];
    const parts = [];
    for (const modifier of ["Shift", "Control", "Alt", "Meta"]) {
      if (modifiers.has(modifier))
        parts.push(modifier);
    }
    parts.push(code);
    const shortcut = parts.join("+");
    let commands = macEditingCommands.macEditingCommands[shortcut] || [];
    if (stringUtils.isString(commands))
      commands = [commands];
    commands = commands.filter((x) => !x.startsWith("insert"));
    return commands.map((c) => c.substring(0, c.length - 1));
  }
  async keydown(progress, modifiers, keyName, description, autoRepeat) {
    const { code, key, location, text } = description;
    if (code === "Escape" && await progress.race(this._dragManger.cancelDrag()))
      return;
    const commands = this._commandsForCode(code, modifiers);
    await progress.race(this._client.send("Input.dispatchKeyEvent", {
      type: text ? "keyDown" : "rawKeyDown",
      modifiers: crProtocolHelper.toModifiersMask(modifiers),
      windowsVirtualKeyCode: description.keyCodeWithoutLocation,
      code,
      commands,
      key,
      text,
      unmodifiedText: text,
      autoRepeat,
      location,
      isKeypad: location === input.keypadLocation
    }));
  }
  async keyup(progress, modifiers, keyName, description) {
    const { code, key, location } = description;
    await progress.race(this._client.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      modifiers: crProtocolHelper.toModifiersMask(modifiers),
      key,
      windowsVirtualKeyCode: description.keyCodeWithoutLocation,
      code,
      location
    }));
  }
  async sendText(progress, text) {
    await progress.race(this._client.send("Input.insertText", { text }));
  }
}
class RawMouseImpl {
  constructor(page, client, dragManager) {
    this._page = page;
    this._client = client;
    this._dragManager = dragManager;
  }
  async move(progress, x, y, button, buttons, modifiers, forClick) {
    const actualMove = async () => {
      await progress.race(this._client.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        button,
        buttons: crProtocolHelper.toButtonsMask(buttons),
        x,
        y,
        modifiers: crProtocolHelper.toModifiersMask(modifiers),
        force: buttons.size > 0 ? 0.5 : 0
      }));
    };
    if (forClick) {
      await actualMove();
      return;
    }
    await this._dragManager.interceptDragCausedByMove(progress, x, y, button, buttons, modifiers, actualMove);
  }
  async down(progress, x, y, button, buttons, modifiers, clickCount) {
    if (this._dragManager.isDragging())
      return;
    await progress.race(this._client.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      button,
      buttons: crProtocolHelper.toButtonsMask(buttons),
      x,
      y,
      modifiers: crProtocolHelper.toModifiersMask(modifiers),
      clickCount,
      force: buttons.size > 0 ? 0.5 : 0
    }));
  }
  async up(progress, x, y, button, buttons, modifiers, clickCount) {
    if (this._dragManager.isDragging()) {
      await this._dragManager.drop(progress, x, y, modifiers);
      return;
    }
    await progress.race(this._client.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      button,
      buttons: crProtocolHelper.toButtonsMask(buttons),
      x,
      y,
      modifiers: crProtocolHelper.toModifiersMask(modifiers),
      clickCount
    }));
  }
  async wheel(progress, x, y, buttons, modifiers, deltaX, deltaY) {
    await progress.race(this._client.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x,
      y,
      modifiers: crProtocolHelper.toModifiersMask(modifiers),
      deltaX,
      deltaY
    }));
  }
}
class RawTouchscreenImpl {
  constructor(client) {
    this._client = client;
  }
  async tap(progress, x, y, modifiers) {
    await progress.race(Promise.all([
      this._client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        modifiers: crProtocolHelper.toModifiersMask(modifiers),
        touchPoints: [{
          x,
          y
        }]
      }),
      this._client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        modifiers: crProtocolHelper.toModifiersMask(modifiers),
        touchPoints: []
      })
    ]));
  }
}

exports.RawKeyboardImpl = RawKeyboardImpl;
exports.RawMouseImpl = RawMouseImpl;
exports.RawTouchscreenImpl = RawTouchscreenImpl;
