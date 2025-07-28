'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const channelOwner = require('./channelOwner.js');
const stream = require('./stream.js');
const fileUtils = require('./fileUtils.js');

class Artifact extends channelOwner.ChannelOwner {
  static from(channel) {
    return channel._object;
  }
  async pathAfterFinished() {
    if (this._connection.isRemote())
      throw new Error(`Path is not available when connecting remotely. Use saveAs() to save a local copy.`);
    return (await this._channel.pathAfterFinished()).value;
  }
  async saveAs(path) {
    if (!this._connection.isRemote()) {
      await this._channel.saveAs({ path });
      return;
    }
    const result = await this._channel.saveAsStream();
    const stream$1 = stream.Stream.from(result.stream);
    await fileUtils.mkdirIfNeeded(this._platform, path);
    await new Promise((resolve, reject) => {
      stream$1.stream().pipe(this._platform.fs().createWriteStream(path)).on("finish", resolve).on("error", reject);
    });
  }
  async failure() {
    return (await this._channel.failure()).error || null;
  }
  async createReadStream() {
    const result = await this._channel.stream();
    const stream$1 = stream.Stream.from(result.stream);
    return stream$1.stream();
  }
  async readIntoBuffer() {
    const stream = await this.createReadStream();
    return await new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => {
        chunks.push(chunk);
      });
      stream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      stream.on("error", reject);
    });
  }
  async cancel() {
    return await this._channel.cancel();
  }
  async delete() {
    return await this._channel.delete();
  }
}

exports.Artifact = Artifact;
