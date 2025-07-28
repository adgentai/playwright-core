'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const dispatcher = require('./dispatcher.js');
const manualPromise = require('../../utils/isomorphic/manualPromise.js');
const instrumentation = require('../instrumentation.js');

class StreamSdkObject extends instrumentation.SdkObject {
  constructor(parent, stream) {
    super(parent, "stream");
    this.stream = stream;
  }
}
class StreamDispatcher extends dispatcher.Dispatcher {
  constructor(scope, stream) {
    super(scope, new StreamSdkObject(scope._object, stream), "Stream", {});
    this._type_Stream = true;
    this._ended = false;
    stream.once("end", () => this._ended = true);
    stream.once("error", () => this._ended = true);
  }
  async read(params, progress) {
    const stream = this._object.stream;
    if (this._ended)
      return { binary: Buffer.from("") };
    if (!stream.readableLength) {
      const readyPromise = new manualPromise.ManualPromise();
      const done = () => readyPromise.resolve();
      stream.on("readable", done);
      stream.on("end", done);
      stream.on("error", done);
      await progress.race(readyPromise).finally(() => {
        stream.off("readable", done);
        stream.off("end", done);
        stream.off("error", done);
      });
    }
    const buffer = stream.read(Math.min(stream.readableLength, params.size || stream.readableLength));
    return { binary: buffer || Buffer.from("") };
  }
  async close(params, progress) {
    this._object.stream.destroy();
  }
}

exports.StreamDispatcher = StreamDispatcher;
