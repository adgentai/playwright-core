'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
require('./utils/debug.js');
const debugLogger = require('./utils/debugLogger.js');
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
const task = require('./utils/task.js');
require('node:os');
require('./utils/zones.js');

class PipeTransport {
  constructor(pipeWrite, pipeRead) {
    this._pendingBuffers = [];
    this._waitForNextTask = task.makeWaitForNextTask();
    this._closed = false;
    this._pipeRead = pipeRead;
    this._pipeWrite = pipeWrite;
    pipeRead.on("data", (buffer) => this._dispatch(buffer));
    pipeRead.on("close", () => {
      this._closed = true;
      if (this._onclose)
        this._onclose.call(null);
    });
    pipeRead.on("error", (e) => debugLogger.debugLogger.log("error", e));
    pipeWrite.on("error", (e) => debugLogger.debugLogger.log("error", e));
    this.onmessage = void 0;
  }
  get onclose() {
    return this._onclose;
  }
  set onclose(onclose) {
    this._onclose = onclose;
    if (onclose && !this._pipeRead.readable)
      onclose();
  }
  send(message) {
    if (this._closed)
      throw new Error("Pipe has been closed");
    this._pipeWrite.write(JSON.stringify(message));
    this._pipeWrite.write("\0");
  }
  close() {
    throw new Error("unimplemented");
  }
  _dispatch(buffer) {
    let end = buffer.indexOf("\0");
    if (end === -1) {
      this._pendingBuffers.push(buffer);
      return;
    }
    this._pendingBuffers.push(buffer.slice(0, end));
    const message = Buffer.concat(this._pendingBuffers).toString();
    this._waitForNextTask(() => {
      if (this.onmessage)
        this.onmessage.call(null, JSON.parse(message));
    });
    let start = end + 1;
    end = buffer.indexOf("\0", start);
    while (end !== -1) {
      const message2 = buffer.toString(void 0, start, end);
      this._waitForNextTask(() => {
        if (this.onmessage)
          this.onmessage.call(null, JSON.parse(message2));
      });
      start = end + 1;
      end = buffer.indexOf("\0", start);
    }
    this._pendingBuffers = [buffer.slice(start)];
  }
}

exports.PipeTransport = PipeTransport;
