'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const debug = require('../utils/debug.js');
const time = require('../../utils/isomorphic/time.js');
const recorderUtils = require('./recorderUtils.js');

class RecorderSignalProcessor {
  constructor(actionSink) {
    this._lastAction = null;
    this._delegate = actionSink;
  }
  addAction(actionInContext) {
    this._lastAction = actionInContext;
    this._delegate.addAction(actionInContext);
  }
  signal(pageAlias, frame, signal) {
    const timestamp = time.monotonicTime();
    if (signal.name === "navigation" && frame._page.mainFrame() === frame) {
      const lastAction = this._lastAction;
      const signalThreshold = debug.isUnderTest() ? 500 : 5e3;
      let generateGoto = false;
      if (!lastAction)
        generateGoto = true;
      else if (lastAction.action.name !== "click" && lastAction.action.name !== "press" && lastAction.action.name !== "fill")
        generateGoto = true;
      else if (timestamp - lastAction.startTime > signalThreshold)
        generateGoto = true;
      if (generateGoto) {
        this.addAction({
          frame: {
            pageGuid: frame._page.guid,
            pageAlias,
            framePath: []
          },
          action: {
            name: "navigate",
            url: frame.url(),
            signals: []
          },
          startTime: timestamp,
          endTime: timestamp
        });
      }
      return;
    }
    recorderUtils.generateFrameSelector(frame).then((framePath) => {
      const signalInContext = {
        frame: {
          pageGuid: frame._page.guid,
          pageAlias,
          framePath
        },
        signal,
        timestamp
      };
      this._delegate.addSignal(signalInContext);
    });
  }
}

exports.RecorderSignalProcessor = RecorderSignalProcessor;
