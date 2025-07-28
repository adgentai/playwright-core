'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const dispatcher = require('./dispatcher.js');
const instrumentation = require('../instrumentation.js');
const localUtils = require('../localUtils.js');
const userAgent = require('../utils/userAgent.js');
const deviceDescriptors = require('../deviceDescriptors.js');
const jsonPipeDispatcher = require('./jsonPipeDispatcher.js');
const socksInterceptor = require('../socksInterceptor.js');
const webSocketTransport = require('../../../../../cloudflare/webSocketTransport.js');
const network = require('../utils/network.js');
const urlMatch = require('../../utils/isomorphic/urlMatch.js');

class LocalUtilsDispatcher extends dispatcher.Dispatcher {
  constructor(scope, playwright) {
    const localUtils2 = new instrumentation.SdkObject(playwright, "localUtils", "localUtils");
    localUtils2.logName = "browser";
    const deviceDescriptors$1 = Object.entries(deviceDescriptors.deviceDescriptors).map(([name, descriptor]) => ({ name, descriptor }));
    super(scope, localUtils2, "LocalUtils", {
      deviceDescriptors: deviceDescriptors$1
    });
    this._harBackends = /* @__PURE__ */ new Map();
    this._stackSessions = /* @__PURE__ */ new Map();
    this._type_LocalUtils = true;
  }
  async zip(params, progress) {
    return await localUtils.zip(progress, this._stackSessions, params);
  }
  async harOpen(params, progress) {
    return await localUtils.harOpen(progress, this._harBackends, params);
  }
  async harLookup(params, progress) {
    return await localUtils.harLookup(progress, this._harBackends, params);
  }
  async harClose(params, progress) {
    localUtils.harClose(this._harBackends, params);
  }
  async harUnzip(params, progress) {
    return await localUtils.harUnzip(progress, params);
  }
  async tracingStarted(params, progress) {
    return await localUtils.tracingStarted(progress, this._stackSessions, params);
  }
  async traceDiscarded(params, progress) {
    return await localUtils.traceDiscarded(progress, this._stackSessions, params);
  }
  async addStackToTracingNoReply(params, progress) {
    localUtils.addStackToTracingNoReply(this._stackSessions, params);
  }
  async connect(params, progress) {
    const wsHeaders = {
      "User-Agent": userAgent.getUserAgent(),
      "x-playwright-proxy": params.exposeNetwork ?? "",
      ...params.headers
    };
    const wsEndpoint = await urlToWSEndpoint(progress, params.wsEndpoint);
    const transport = await webSocketTransport.WebSocketTransport.connect(progress, wsEndpoint, { headers: wsHeaders, followRedirects: true, debugLogHeader: "x-playwright-debug-log" });
    const socksInterceptor$1 = new socksInterceptor.SocksInterceptor(transport, params.exposeNetwork, params.socksProxyRedirectPortForTest);
    const pipe = new jsonPipeDispatcher.JsonPipeDispatcher(this);
    transport.onmessage = (json) => {
      if (socksInterceptor$1.interceptMessage(json))
        return;
      const cb = () => {
        try {
          pipe.dispatch(json);
        } catch (e) {
          transport.close();
        }
      };
      if (params.slowMo)
        setTimeout(cb, params.slowMo);
      else
        cb();
    };
    pipe.on("message", (message) => {
      transport.send(message);
    });
    transport.onclose = (reason) => {
      socksInterceptor$1?.cleanup();
      pipe.wasClosed(reason);
    };
    pipe.on("close", () => transport.close());
    return { pipe, headers: transport.headers };
  }
  async globToRegex(params, progress) {
    const regex = urlMatch.resolveGlobToRegexPattern(params.baseURL, params.glob, params.webSocketUrl);
    return { regex };
  }
}
async function urlToWSEndpoint(progress, endpointURL) {
  if (endpointURL.startsWith("ws"))
    return endpointURL;
  progress.log(`<ws preparing> retrieving websocket url from ${endpointURL}`);
  const fetchUrl = new URL(endpointURL);
  if (!fetchUrl.pathname.endsWith("/"))
    fetchUrl.pathname += "/";
  fetchUrl.pathname += "json";
  const json = await network.fetchData(progress, {
    url: fetchUrl.toString(),
    method: "GET",
    headers: { "User-Agent": userAgent.getUserAgent() }
  }, async (params, response) => {
    return new Error(`Unexpected status ${response.statusCode} when connecting to ${fetchUrl.toString()}.
This does not look like a Playwright server, try connecting via ws://.`);
  });
  const wsUrl = new URL(endpointURL);
  let wsEndpointPath = JSON.parse(json).wsEndpointPath;
  if (wsEndpointPath.startsWith("/"))
    wsEndpointPath = wsEndpointPath.substring(1);
  if (!wsUrl.pathname.endsWith("/"))
    wsUrl.pathname += "/";
  wsUrl.pathname += wsEndpointPath;
  wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
  return wsUrl.toString();
}

exports.LocalUtilsDispatcher = LocalUtilsDispatcher;
