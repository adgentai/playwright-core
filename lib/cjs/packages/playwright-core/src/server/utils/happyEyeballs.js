'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const require$$0$8 = require('node:dns');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const tls = require('node:tls');
const assert = require('../../utils/isomorphic/assert.js');
const manualPromise = require('../../utils/isomorphic/manualPromise.js');
const time = require('../../utils/isomorphic/time.js');

const connectionAttemptDelayMs = 300;
const kDNSLookupAt = Symbol("kDNSLookupAt");
const kTCPConnectionAt = Symbol("kTCPConnectionAt");
class HttpHappyEyeballsAgent extends http.Agent {
  createConnection(options, oncreate) {
    if (net.isIP(clientRequestArgsToHostName(options)))
      return net.createConnection(options);
    createConnectionAsync(
      options,
      oncreate,
      /* useTLS */
      false
    ).catch((err) => oncreate?.(err));
  }
}
class HttpsHappyEyeballsAgent extends https.Agent {
  createConnection(options, oncreate) {
    if (net.isIP(clientRequestArgsToHostName(options)))
      return tls.connect(options);
    createConnectionAsync(
      options,
      oncreate,
      /* useTLS */
      true
    ).catch((err) => oncreate?.(err));
  }
}
const httpsHappyEyeballsAgent = new HttpsHappyEyeballsAgent({ keepAlive: true });
const httpHappyEyeballsAgent = new HttpHappyEyeballsAgent({ keepAlive: true });
async function createSocket(host, port) {
  return new Promise((resolve, reject) => {
    if (net.isIP(host)) {
      const socket = net.createConnection({ host, port });
      socket.on("connect", () => resolve(socket));
      socket.on("error", (error) => reject(error));
    } else {
      createConnectionAsync(
        { host, port },
        (err, socket) => {
          if (err)
            reject(err);
          if (socket)
            resolve(socket);
        },
        /* useTLS */
        false
      ).catch((err) => reject(err));
    }
  });
}
async function createTLSSocket(options) {
  return new Promise((resolve, reject) => {
    assert.assert(options.host, "host is required");
    if (net.isIP(options.host)) {
      const socket = tls.connect(options);
      socket.on("secureConnect", () => resolve(socket));
      socket.on("error", (error) => reject(error));
    } else {
      createConnectionAsync(options, (err, socket) => {
        if (err)
          reject(err);
        if (socket) {
          socket.on("secureConnect", () => resolve(socket));
          socket.on("error", (error) => reject(error));
        }
      }, true).catch((err) => reject(err));
    }
  });
}
async function createConnectionAsync(options, oncreate, useTLS) {
  const lookup = options.__testHookLookup || lookupAddresses;
  const hostname = clientRequestArgsToHostName(options);
  const addresses = await lookup(hostname);
  const dnsLookupAt = time.monotonicTime();
  const sockets = /* @__PURE__ */ new Set();
  let firstError;
  let errorCount = 0;
  const handleError = (socket, err) => {
    if (!sockets.delete(socket))
      return;
    ++errorCount;
    firstError ??= err;
    if (errorCount === addresses.length)
      oncreate?.(firstError);
  };
  const connected = new manualPromise.ManualPromise();
  for (const { address } of addresses) {
    const socket = useTLS ? tls.connect({
      ...options,
      port: options.port,
      host: address,
      servername: hostname
    }) : net.createConnection({
      ...options,
      port: options.port,
      host: address
    });
    socket[kDNSLookupAt] = dnsLookupAt;
    socket.on("connect", () => {
      socket[kTCPConnectionAt] = time.monotonicTime();
      connected.resolve();
      oncreate?.(null, socket);
      sockets.delete(socket);
      for (const s of sockets)
        s.destroy();
      sockets.clear();
    });
    socket.on("timeout", () => {
      socket.destroy();
      handleError(socket, new Error("Connection timeout"));
    });
    socket.on("error", (e) => handleError(socket, e));
    sockets.add(socket);
    await Promise.race([
      connected,
      new Promise((f) => setTimeout(f, connectionAttemptDelayMs))
    ]);
    if (connected.isDone())
      break;
  }
}
async function lookupAddresses(hostname) {
  const addresses = await require$$0$8.promises.lookup(hostname, { all: true, family: 0, verbatim: true });
  let firstFamily = addresses.filter(({ family }) => family === 6);
  let secondFamily = addresses.filter(({ family }) => family === 4);
  if (firstFamily.length && firstFamily[0] !== addresses[0]) {
    const tmp = firstFamily;
    firstFamily = secondFamily;
    secondFamily = tmp;
  }
  const result = [];
  for (let i = 0; i < Math.max(firstFamily.length, secondFamily.length); i++) {
    if (firstFamily[i])
      result.push(firstFamily[i]);
    if (secondFamily[i])
      result.push(secondFamily[i]);
  }
  return result;
}
function clientRequestArgsToHostName(options) {
  if (options.hostname)
    return options.hostname;
  if (options.host)
    return options.host;
  throw new Error("Either options.hostname or options.host must be provided");
}
function timingForSocket(socket) {
  return {
    dnsLookupAt: socket[kDNSLookupAt],
    tcpConnectionAt: socket[kTCPConnectionAt]
  };
}

exports.createConnectionAsync = createConnectionAsync;
exports.createSocket = createSocket;
exports.createTLSSocket = createTLSSocket;
exports.httpHappyEyeballsAgent = httpHappyEyeballsAgent;
exports.httpsHappyEyeballsAgent = httpsHappyEyeballsAgent;
exports.timingForSocket = timingForSocket;
