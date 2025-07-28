'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const channelOwner = require('./channelOwner.js');

class WritableStream extends channelOwner.ChannelOwner {
  static from(Stream) {
    return Stream._object;
  }
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
  }
  stream() {
    return this._platform.streamWritable(this._channel);
  }
}

exports.WritableStream = WritableStream;
