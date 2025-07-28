'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const channelOwner = require('./channelOwner.js');
const errors = require('./errors.js');
const events = require('./events.js');
const jsHandle = require('./jsHandle.js');
const manualPromise = require('../utils/isomorphic/manualPromise.js');

class Worker extends channelOwner.ChannelOwner {
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    // Set for service workers.
    this._closedScope = new manualPromise.LongStandingScope();
    this._channel.on("close", () => {
      if (this._page)
        this._page._workers.delete(this);
      if (this._context)
        this._context._serviceWorkers.delete(this);
      this.emit(events.Events.Worker.Close, this);
    });
    this.once(events.Events.Worker.Close, () => this._closedScope.close(this._page?._closeErrorWithReason() || new errors.TargetClosedError()));
  }
  static from(worker) {
    return worker._object;
  }
  url() {
    return this._initializer.url;
  }
  async evaluate(pageFunction, arg) {
    jsHandle.assertMaxArguments(arguments.length, 2);
    const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.parseResult(result.value);
  }
  async evaluateHandle(pageFunction, arg) {
    jsHandle.assertMaxArguments(arguments.length, 2);
    const result = await this._channel.evaluateExpressionHandle({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.JSHandle.from(result.handle);
  }
}

exports.Worker = Worker;
