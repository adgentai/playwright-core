'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const node_async_hooks = require('node:async_hooks');

const asyncLocalStorage = new node_async_hooks.AsyncLocalStorage();
class Zone {
  constructor(asyncLocalStorage2, store) {
    this._asyncLocalStorage = asyncLocalStorage2;
    this._data = store;
  }
  with(type, data) {
    return new Zone(this._asyncLocalStorage, new Map(this._data).set(type, data));
  }
  without(type) {
    const data = type ? new Map(this._data) : /* @__PURE__ */ new Map();
    data.delete(type);
    return new Zone(this._asyncLocalStorage, data);
  }
  run(func) {
    return this._asyncLocalStorage.run(this, func);
  }
  data(type) {
    return this._data.get(type);
  }
}
const emptyZone = new Zone(asyncLocalStorage, /* @__PURE__ */ new Map());
function currentZone() {
  return asyncLocalStorage.getStore() ?? emptyZone;
}

exports.Zone = Zone;
exports.currentZone = currentZone;
exports.emptyZone = emptyZone;
