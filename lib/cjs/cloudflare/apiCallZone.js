'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const node_async_hooks = require('node:async_hooks');

const apiCallZone = new node_async_hooks.AsyncLocalStorage();

exports.apiCallZone = apiCallZone;
