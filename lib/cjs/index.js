'use strict';

Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: 'Module' } });

require('./patch.js');
const inProcessFactory = require('./packages/playwright-core/src/inProcessFactory.js');
const crConnection = require('./packages/playwright-core/src/server/chromium/crConnection.js');
const cloudflare_workers = require('cloudflare:workers');
const time = require('./packages/playwright-core/src/utils/isomorphic/time.js');
const webSocketTransport = require('./cloudflare/webSocketTransport.js');
const wrapClientApis = require('./cloudflare/wrapClientApis.js');
const unsupportedOperations = require('./cloudflare/unsupportedOperations.js');
const _package = require('./packages/playwright-cloudflare/package.json.js');

function resetMonotonicTime() {
  if (time.timeOrigin() === 0 && Date.now() !== 0)
    time.setTimeOrigin(Date.now());
}
const playwright = inProcessFactory.createInProcessPlaywright();
unsupportedOperations.unsupportedOperations(playwright);
wrapClientApis.wrapClientApis();
const HTTP_FAKE_HOST = "http://fake.host";
const WS_FAKE_HOST = "ws://fake.host";
const originalConnectOverCDP = playwright.chromium.connectOverCDP;
playwright.chromium.connectOverCDP = (endpointURLOrOptions) => {
  const wsEndpoint = typeof endpointURLOrOptions === "string" ? endpointURLOrOptions : endpointURLOrOptions.wsEndpoint ?? endpointURLOrOptions.endpointURL;
  if (!wsEndpoint)
    throw new Error("No wsEndpoint provided");
  const wsUrl = new URL(wsEndpoint);
  if (!wsUrl.searchParams.has("persistent"))
    wsUrl.searchParams.set("persistent", "true");
  return wsUrl.searchParams.has("browser_session") ? connect(wsUrl.toString()) : launch(wsUrl.toString());
};
async function connectDevtools(endpoint, options) {
  resetMonotonicTime();
  const url = new URL(`${HTTP_FAKE_HOST}/v1/connectDevtools`);
  url.searchParams.set("browser_session", options.sessionId);
  if (options.persistent)
    url.searchParams.set("persistent", "true");
  const response = await getBrowserBinding(endpoint).fetch(url, {
    headers: {
      "Upgrade": "websocket",
      "cf-brapi-client": `@cloudflare/playwright@${_package.version}`
    }
  });
  const webSocket = response.webSocket;
  webSocket.accept();
  return webSocket;
}
function extractOptions(endpoint) {
  if (typeof endpoint === "string" || endpoint instanceof URL) {
    const url = endpoint instanceof URL ? endpoint : new URL(endpoint);
    const sessionId = url.searchParams.get("browser_session") ?? void 0;
    const keepAlive = url.searchParams.has("keep_alive") ? parseInt(url.searchParams.get("keep_alive"), 10) : void 0;
    const persistent = url.searchParams.has("persistent");
    return { sessionId, keep_alive: keepAlive, persistent };
  }
  return {};
}
function endpointURLString(binding, options) {
  const bindingKey = typeof binding === "string" ? binding : Object.keys(cloudflare_workers.env).find((key) => cloudflare_workers.env[key] === binding);
  if (!bindingKey || !(bindingKey in cloudflare_workers.env))
    throw new Error(`No binding found for ${binding}`);
  const url = new URL(`${HTTP_FAKE_HOST}/v1/connectDevtools`);
  url.searchParams.set("browser_binding", bindingKey);
  if (options?.sessionId)
    url.searchParams.set("browser_session", options.sessionId);
  if (options?.persistent)
    url.searchParams.set("persistent", "true");
  if (options?.keepAlive)
    url.searchParams.set("keep_alive", options.keepAlive.toString());
  return url.toString();
}
async function createBrowser(transport, options) {
  return await webSocketTransport.transportZone.run(transport, async () => {
    const url = new URL(WS_FAKE_HOST);
    if (options?.persistent)
      url.searchParams.set("persistent", "true");
    const browser = await originalConnectOverCDP.call(playwright.chromium, url.toString(), {});
    browser.sessionId = () => transport.sessionId;
    return browser;
  });
}
function getBrowserBinding(endpoint) {
  if (typeof endpoint === "string" || endpoint instanceof URL) {
    const url = endpoint instanceof URL ? endpoint : new URL(endpoint);
    const binding = url.searchParams.get("browser_binding");
    if (!binding || !(binding in cloudflare_workers.env))
      throw new Error(`No binding found for ${binding}`);
    return cloudflare_workers.env[binding];
  }
  return endpoint;
}
async function connect(endpoint, sessionIdOrOptions) {
  const extraOptions = typeof sessionIdOrOptions === "string" ? { sessionId: sessionIdOrOptions } : sessionIdOrOptions ?? {};
  const options = { ...extractOptions(endpoint), ...extraOptions };
  if (!options.sessionId)
    throw new Error(`Session ID is required for connect()`);
  const webSocket = await connectDevtools(getBrowserBinding(endpoint), options);
  const transport = new webSocketTransport.WebSocketTransport(webSocket, options.sessionId);
  return await createBrowser(transport, options);
}
async function launch(endpoint, launchOptions) {
  const { sessionId } = await acquire(endpoint, launchOptions);
  const options = { ...extractOptions(endpoint), ...launchOptions, sessionId };
  const webSocket = await connectDevtools(getBrowserBinding(endpoint), options);
  const transport = new webSocketTransport.WebSocketTransport(webSocket, sessionId);
  const browser = await createBrowser(transport, options);
  const browserImpl = browser._toImpl();
  const doClose = async () => {
    const message = { method: "Browser.close", id: crConnection.kBrowserCloseMessageId, params: {} };
    transport.send(message);
  };
  browserImpl.options.browserProcess = { close: doClose, kill: doClose };
  return browser;
}
async function acquire(endpoint, options) {
  options = { ...extractOptions(endpoint), ...options };
  let acquireUrl = `${HTTP_FAKE_HOST}/v1/acquire`;
  if (options?.keep_alive)
    acquireUrl = `${acquireUrl}?keep_alive=${options.keep_alive}`;
  const res = await getBrowserBinding(endpoint).fetch(acquireUrl);
  const status = res.status;
  const text = await res.text();
  if (status !== 200) {
    throw new Error(
      `Unable to create new browser: code: ${status}: message: ${text}`
    );
  }
  const response = JSON.parse(text);
  return response;
}
async function sessions(endpoint) {
  const res = await getBrowserBinding(endpoint).fetch(`${HTTP_FAKE_HOST}/v1/sessions`);
  const status = res.status;
  const text = await res.text();
  if (status !== 200) {
    throw new Error(
      `Unable to fetch new sessions: code: ${status}: message: ${text}`
    );
  }
  const data = JSON.parse(text);
  return data.sessions;
}
async function history(endpoint) {
  const res = await getBrowserBinding(endpoint).fetch(`${HTTP_FAKE_HOST}/v1/history`);
  const status = res.status;
  const text = await res.text();
  if (status !== 200) {
    throw new Error(
      `Unable to fetch account history: code: ${status}: message: ${text}`
    );
  }
  const data = JSON.parse(text);
  return data.history;
}
async function limits(endpoint) {
  const res = await getBrowserBinding(endpoint).fetch(`${HTTP_FAKE_HOST}/v1/limits`);
  const status = res.status;
  const text = await res.text();
  if (status !== 200) {
    throw new Error(
      `Unable to fetch account limits: code: ${status}: message: ${text}`
    );
  }
  const data = JSON.parse(text);
  return data;
}
const chromium = playwright.chromium;
const selectors = playwright.selectors;
const devices = playwright.devices;
const errors = playwright.errors;
const request = playwright.request;
const _instrumentation = playwright._instrumentation;
const playwright$1 = {
  chromium,
  selectors,
  devices,
  errors,
  request,
  _instrumentation,
  endpointURLString,
  launch,
  connect,
  sessions,
  history,
  acquire,
  limits
};

exports._instrumentation = _instrumentation;
exports.acquire = acquire;
exports.chromium = chromium;
exports.connect = connect;
exports.default = playwright$1;
exports.devices = devices;
exports.endpointURLString = endpointURLString;
exports.errors = errors;
exports.history = history;
exports.launch = launch;
exports.limits = limits;
exports.request = request;
exports.selectors = selectors;
exports.sessions = sessions;
