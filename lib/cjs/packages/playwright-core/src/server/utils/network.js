'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const http = require('node:http');
require('node:http2');
const https = require('node:https');
const url = require('node:url');
const utilsBundle = require('../../utilsBundle.js');
const happyEyeballs = require('./happyEyeballs.js');

const NET_DEFAULT_TIMEOUT = 3e4;
function httpRequest(params, onResponse, onError) {
  const parsedUrl = url.parse(params.url);
  let options = {
    ...parsedUrl,
    agent: parsedUrl.protocol === "https:" ? happyEyeballs.httpsHappyEyeballsAgent : happyEyeballs.httpHappyEyeballsAgent,
    method: params.method || "GET",
    headers: params.headers
  };
  if (params.rejectUnauthorized !== void 0)
    options.rejectUnauthorized = params.rejectUnauthorized;
  const proxyURL = utilsBundle.getProxyForUrl(params.url);
  if (proxyURL) {
    const parsedProxyURL = url.parse(proxyURL);
    if (params.url.startsWith("http:")) {
      options = {
        path: parsedUrl.href,
        host: parsedProxyURL.hostname,
        port: parsedProxyURL.port,
        headers: options.headers,
        method: options.method
      };
    } else {
      parsedProxyURL.secureProxy = parsedProxyURL.protocol === "https:";
      options.agent = new utilsBundle.HttpsProxyAgent(parsedProxyURL);
      options.rejectUnauthorized = false;
    }
  }
  let cancelRequest;
  const requestCallback = (res) => {
    const statusCode = res.statusCode || 0;
    if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
      request.destroy();
      cancelRequest = httpRequest({ ...params, url: new URL(res.headers.location, params.url).toString() }, onResponse, onError).cancel;
    } else {
      onResponse(res);
    }
  };
  const request = options.protocol === "https:" ? https.request(options, requestCallback) : http.request(options, requestCallback);
  request.on("error", onError);
  if (params.socketTimeout !== void 0) {
    request.setTimeout(params.socketTimeout, () => {
      onError(new Error(`Request to ${params.url} timed out after ${params.socketTimeout}ms`));
      request.abort();
    });
  }
  cancelRequest = (e) => request.destroy(e);
  request.end(params.data);
  return { cancel: (e) => cancelRequest(e) };
}
function fetchData(progress, params, onError) {
  const promise = new Promise((resolve, reject) => {
    const { cancel } = httpRequest(params, async (response) => {
      if (response.statusCode !== 200) {
        const error = onError ? await onError(params, response) : new Error(`fetch failed: server returned code ${response.statusCode}. URL: ${params.url}`);
        reject(error);
        return;
      }
      let body = "";
      response.on("data", (chunk) => body += chunk);
      response.on("error", (error) => reject(error));
      response.on("end", () => resolve(body));
    }, reject);
    progress?.cleanupWhenAborted(cancel);
  });
  return progress ? progress.race(promise) : promise;
}
function shouldBypassProxy(url2, bypass) {
  if (!bypass)
    return false;
  const domains = bypass.split(",").map((s) => {
    s = s.trim();
    if (!s.startsWith("."))
      s = "." + s;
    return s;
  });
  const domain = "." + url2.hostname;
  return domains.some((d) => domain.endsWith(d));
}
function createProxyAgent(proxy, forUrl) {
  if (!proxy)
    return;
  if (forUrl && proxy.bypass && shouldBypassProxy(forUrl, proxy.bypass))
    return;
  let proxyServer = proxy.server.trim();
  if (!/^\w+:\/\//.test(proxyServer))
    proxyServer = "http://" + proxyServer;
  const proxyOpts = url.parse(proxyServer);
  if (proxyOpts.protocol?.startsWith("socks")) {
    return new utilsBundle.SocksProxyAgent({
      host: proxyOpts.hostname,
      port: proxyOpts.port || void 0
    });
  }
  if (proxy.username)
    proxyOpts.auth = `${proxy.username}:${proxy.password || ""}`;
  if (forUrl && ["ws:", "wss:"].includes(forUrl.protocol)) {
    return new utilsBundle.HttpsProxyAgent(proxyOpts);
  }
  return new utilsBundle.HttpsProxyAgent(proxyOpts);
}
function createHttpServer(...args) {
  const server = http.createServer(...args);
  decorateServer(server);
  return server;
}
function decorateServer(server) {
  const sockets = /* @__PURE__ */ new Set();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });
  const close = server.close;
  server.close = (callback) => {
    for (const socket of sockets)
      socket.destroy();
    sockets.clear();
    return close.call(server, callback);
  };
}

exports.NET_DEFAULT_TIMEOUT = NET_DEFAULT_TIMEOUT;
exports.createHttpServer = createHttpServer;
exports.createProxyAgent = createProxyAgent;
exports.fetchData = fetchData;
exports.httpRequest = httpRequest;
