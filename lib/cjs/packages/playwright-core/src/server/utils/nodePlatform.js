'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const require$$0 = require('node:inspector');
const crypto = require('node:crypto');
const fs = require('../../../../../bundles/fs.js');
const path = require('node:path');
const require$$0$2 = require('node:util');
const require$$6 = require('node:stream');
const require$$0$3 = require('node:events');
const utilsBundle = require('../../utilsBundle.js');
const debugLogger = require('./debugLogger.js');
const zones = require('./zones.js');
const debug = require('./debug.js');

function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
  if (e) {
    for (const k in e) {
      if (k !== 'default') {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}

const require$$0$2__namespace = /*#__PURE__*/_interopNamespaceDefault(require$$0$2);

const pipelineAsync = require$$0$2__namespace.promisify(require$$6.pipeline);
class NodeZone {
  constructor(zone) {
    this._zone = zone;
  }
  push(data) {
    return new NodeZone(this._zone.with("apiZone", data));
  }
  pop() {
    return new NodeZone(this._zone.without("apiZone"));
  }
  run(func) {
    return this._zone.run(func);
  }
  data() {
    return this._zone.data("apiZone");
  }
}
let boxedStackPrefixes = [];
const coreDir = path.dirname(".");
const nodePlatform = {
  name: "node",
  boxedStackPrefixes: () => {
    if (process.env.PWDEBUGIMPL)
      return [];
    return [coreDir, ...boxedStackPrefixes];
  },
  calculateSha1: (text) => {
    const sha1 = crypto.createHash("sha1");
    sha1.update(text);
    return Promise.resolve(sha1.digest("hex"));
  },
  colors: utilsBundle.colors,
  coreDir,
  createGuid: () => crypto.randomBytes(16).toString("hex"),
  defaultMaxListeners: () => require$$0$3.EventEmitter.defaultMaxListeners,
  fs: () => fs.default,
  env: process.env,
  inspectCustom: require$$0$2__namespace.inspect.custom,
  isDebugMode: () => !!debug.debugMode(),
  isJSDebuggerAttached: () => !!require$$0.url(),
  isLogEnabled(name) {
    return debugLogger.debugLogger.isEnabled(name);
  },
  isUnderTest: () => debug.isUnderTest(),
  log(name, message) {
    debugLogger.debugLogger.log(name, message);
  },
  path: () => path,
  pathSeparator: path.sep,
  showInternalStackFrames: () => !!process.env.PWDEBUGIMPL,
  async streamFile(path2, stream) {
    await pipelineAsync(fs.default.createReadStream(path2), stream);
  },
  streamReadable: (channel) => {
    return new ReadableStreamImpl(channel);
  },
  streamWritable: (channel) => {
    return new WritableStreamImpl(channel);
  },
  zones: {
    current: () => new NodeZone(zones.currentZone()),
    empty: new NodeZone(zones.emptyZone)
  }
};
class ReadableStreamImpl extends require$$6.Readable {
  constructor(channel) {
    super();
    this._channel = channel;
  }
  async _read() {
    const result = await this._channel.read({ size: 1024 * 1024 });
    if (result.binary.byteLength)
      this.push(result.binary);
    else
      this.push(null);
  }
  _destroy(error, callback) {
    this._channel.close().catch((e) => null);
    super._destroy(error, callback);
  }
}
class WritableStreamImpl extends require$$6.Writable {
  constructor(channel) {
    super();
    this._channel = channel;
  }
  async _write(chunk, encoding, callback) {
    const error = await this._channel.write({ binary: typeof chunk === "string" ? Buffer.from(chunk) : chunk }).catch((e) => e);
    callback(error || null);
  }
  async _final(callback) {
    const error = await this._channel.close().catch((e) => e);
    callback(error || null);
  }
}

exports.nodePlatform = nodePlatform;
