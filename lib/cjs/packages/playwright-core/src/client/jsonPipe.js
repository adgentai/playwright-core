'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const channelOwner = require('./channelOwner.js');

class JsonPipe extends channelOwner.ChannelOwner {
  static from(jsonPipe) {
    return jsonPipe._object;
  }
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
  }
  channel() {
    return this._channel;
  }
}

exports.JsonPipe = JsonPipe;
