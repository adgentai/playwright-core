'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const channelOwner = require('./channelOwner.js');

class Stream extends channelOwner.ChannelOwner {
  static from(Stream2) {
    return Stream2._object;
  }
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
  }
  stream() {
    return this._platform.streamReadable(this._channel);
  }
}

exports.Stream = Stream;
