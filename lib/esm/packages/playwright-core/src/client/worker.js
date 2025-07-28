import { ChannelOwner } from './channelOwner.js';
import { TargetClosedError } from './errors.js';
import { Events } from './events.js';
import { assertMaxArguments, serializeArgument, parseResult, JSHandle } from './jsHandle.js';
import { LongStandingScope } from '../utils/isomorphic/manualPromise.js';

class Worker extends ChannelOwner {
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    // Set for service workers.
    this._closedScope = new LongStandingScope();
    this._channel.on("close", () => {
      if (this._page)
        this._page._workers.delete(this);
      if (this._context)
        this._context._serviceWorkers.delete(this);
      this.emit(Events.Worker.Close, this);
    });
    this.once(Events.Worker.Close, () => this._closedScope.close(this._page?._closeErrorWithReason() || new TargetClosedError()));
  }
  static from(worker) {
    return worker._object;
  }
  url() {
    return this._initializer.url;
  }
  async evaluate(pageFunction, arg) {
    assertMaxArguments(arguments.length, 2);
    const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: serializeArgument(arg) });
    return parseResult(result.value);
  }
  async evaluateHandle(pageFunction, arg) {
    assertMaxArguments(arguments.length, 2);
    const result = await this._channel.evaluateExpressionHandle({ expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: serializeArgument(arg) });
    return JSHandle.from(result.handle);
  }
}

export { Worker };
