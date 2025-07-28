'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const http = require('node:http');
const https = require('node:https');
const require$$6 = require('node:stream');
const tls = require('node:tls');
const zlib = require('node:zlib');
const assert = require('../utils/isomorphic/assert.js');
const time = require('../utils/isomorphic/time.js');
const urlMatch = require('../utils/isomorphic/urlMatch.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
const crypto = require('./utils/crypto.js');
require('./utils/debug.js');
require('./utils/debugLogger.js');
const eventsHelper = require('./utils/eventsHelper.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../zipBundle.js');
require('./utils/hostPlatform.js');
const network = require('./utils/network.js');
require('./utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./utils/profiler.js');
require('./utils/socksProxy.js');
const userAgent = require('./utils/userAgent.js');
require('./utils/zones.js');
const browserContext = require('./browserContext.js');
const cookieStore = require('./cookieStore.js');
const formData = require('./formData.js');
const instrumentation = require('./instrumentation.js');
const progress = require('./progress.js');
const socksClientCertificatesInterceptor = require('./socksClientCertificatesInterceptor.js');
const happyEyeballs = require('./utils/happyEyeballs.js');
const tracing = require('./trace/recorder/tracing.js');

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

const zlib__namespace = /*#__PURE__*/_interopNamespaceDefault(zlib);

class APIRequestContext extends instrumentation.SdkObject {
  constructor(parent) {
    super(parent, "request-context");
    this.fetchResponses = /* @__PURE__ */ new Map();
    this.fetchLog = /* @__PURE__ */ new Map();
    APIRequestContext.allInstances.add(this);
  }
  static {
    this.Events = {
      Dispose: "dispose",
      Request: "request",
      RequestFinished: "requestfinished"
    };
  }
  static {
    this.allInstances = /* @__PURE__ */ new Set();
  }
  static findResponseBody(guid) {
    for (const request of APIRequestContext.allInstances) {
      const body = request.fetchResponses.get(guid);
      if (body)
        return body;
    }
    return void 0;
  }
  _disposeImpl() {
    APIRequestContext.allInstances.delete(this);
    this.fetchResponses.clear();
    this.fetchLog.clear();
    this.emit(APIRequestContext.Events.Dispose);
  }
  disposeResponse(fetchUid) {
    this.fetchResponses.delete(fetchUid);
    this.fetchLog.delete(fetchUid);
  }
  _storeResponseBody(body) {
    const uid = crypto.createGuid();
    this.fetchResponses.set(uid, body);
    return uid;
  }
  async fetch(progress, params) {
    const defaults = this._defaultOptions();
    const headers = {
      "user-agent": defaults.userAgent,
      "accept": "*/*",
      "accept-encoding": "gzip,deflate,br"
    };
    if (defaults.extraHTTPHeaders) {
      for (const { name, value } of defaults.extraHTTPHeaders)
        setHeader(headers, name, value);
    }
    if (params.headers) {
      for (const { name, value } of params.headers)
        setHeader(headers, name, value);
    }
    const requestUrl = new URL(urlMatch.constructURLBasedOnBaseURL(defaults.baseURL, params.url));
    if (params.encodedParams) {
      requestUrl.search = params.encodedParams;
    } else if (params.params) {
      for (const { name, value } of params.params)
        requestUrl.searchParams.append(name, value);
    }
    const credentials = this._getHttpCredentials(requestUrl);
    if (credentials?.send === "always")
      setBasicAuthorizationHeader(headers, credentials);
    const method = params.method?.toUpperCase() || "GET";
    const proxy = defaults.proxy;
    let agent;
    if (proxy?.server !== "per-context")
      agent = network.createProxyAgent(proxy, requestUrl);
    let maxRedirects = params.maxRedirects ?? (defaults.maxRedirects ?? 20);
    maxRedirects = maxRedirects === 0 ? -1 : maxRedirects;
    const options = {
      method,
      headers,
      agent,
      maxRedirects,
      ...socksClientCertificatesInterceptor.getMatchingTLSOptionsForOrigin(this._defaultOptions().clientCertificates, requestUrl.origin),
      __testHookLookup: params.__testHookLookup
    };
    if (params.ignoreHTTPSErrors || defaults.ignoreHTTPSErrors)
      options.rejectUnauthorized = false;
    const postData = serializePostData(params, headers);
    if (postData)
      setHeader(headers, "content-length", String(postData.byteLength));
    const fetchResponse = await this._sendRequestWithRetries(progress, requestUrl, options, postData, params.maxRetries);
    const fetchUid = this._storeResponseBody(fetchResponse.body);
    this.fetchLog.set(fetchUid, progress.metadata.log);
    const failOnStatusCode = params.failOnStatusCode !== void 0 ? params.failOnStatusCode : !!defaults.failOnStatusCode;
    if (failOnStatusCode && (fetchResponse.status < 200 || fetchResponse.status >= 400)) {
      let responseText = "";
      if (fetchResponse.body.byteLength) {
        let text = fetchResponse.body.toString("utf8");
        if (text.length > 1e3)
          text = text.substring(0, 997) + "...";
        responseText = `
Response text:
${text}`;
      }
      throw new Error(`${fetchResponse.status} ${fetchResponse.statusText}${responseText}`);
    }
    return { ...fetchResponse, fetchUid };
  }
  _parseSetCookieHeader(responseUrl, setCookie) {
    if (!setCookie)
      return [];
    const url = new URL(responseUrl);
    const defaultPath = "/" + url.pathname.substr(1).split("/").slice(0, -1).join("/");
    const cookies = [];
    for (const header of setCookie) {
      const cookie = parseCookie(header);
      if (!cookie)
        continue;
      if (!cookie.domain)
        cookie.domain = url.hostname;
      else
        assert.assert(cookie.domain.startsWith(".") || !cookie.domain.includes("."));
      if (!cookieStore.domainMatches(url.hostname, cookie.domain))
        continue;
      if (!cookie.path || !cookie.path.startsWith("/"))
        cookie.path = defaultPath;
      cookies.push(cookie);
    }
    return cookies;
  }
  async _updateRequestCookieHeader(progress, url, headers) {
    if (getHeader(headers, "cookie") !== void 0)
      return;
    const contextCookies = await progress.race(this._cookies(url));
    const cookies = contextCookies.filter((c) => new cookieStore.Cookie(c).matches(url));
    if (cookies.length) {
      const valueArray = cookies.map((c) => `${c.name}=${c.value}`);
      setHeader(headers, "cookie", valueArray.join("; "));
    }
  }
  async _sendRequestWithRetries(progress$1, url, options, postData, maxRetries) {
    maxRetries ??= 0;
    let backoff = 250;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await this._sendRequest(progress$1, url, options, postData);
      } catch (e) {
        if (progress.isAbortError(e))
          throw e;
        e = socksClientCertificatesInterceptor.rewriteOpenSSLErrorIfNeeded(e);
        if (maxRetries === 0)
          throw e;
        if (i === maxRetries)
          throw new Error(`Failed after ${i + 1} attempt(s): ${e}`);
        if (e.code !== "ECONNRESET")
          throw e;
        progress$1.log(`  Received ECONNRESET, will retry after ${backoff}ms.`);
        await progress$1.wait(backoff);
        backoff *= 2;
      }
    }
    throw new Error("Unreachable");
  }
  async _sendRequest(progress, url, options, postData) {
    await this._updateRequestCookieHeader(progress, url, options.headers);
    const requestCookies = getHeader(options.headers, "cookie")?.split(";").map((p) => {
      const [name, value] = p.split("=").map((v) => v.trim());
      return { name, value };
    }) || [];
    const requestEvent = {
      url,
      method: options.method,
      headers: options.headers,
      cookies: requestCookies,
      postData
    };
    this.emit(APIRequestContext.Events.Request, requestEvent);
    const resultPromise = new Promise((fulfill, reject) => {
      const requestConstructor = (url.protocol === "https:" ? https : http).request;
      const agent = options.agent || (url.protocol === "https:" ? happyEyeballs.httpsHappyEyeballsAgent : happyEyeballs.httpHappyEyeballsAgent);
      const requestOptions = { ...options, agent };
      const startAt = time.monotonicTime();
      let reusedSocketAt;
      let dnsLookupAt;
      let tcpConnectionAt;
      let tlsHandshakeAt;
      let requestFinishAt;
      let serverIPAddress;
      let serverPort;
      let securityDetails;
      const listeners = [];
      const request = requestConstructor(url, requestOptions, async (response) => {
        const responseAt = time.monotonicTime();
        const notifyRequestFinished = (body2) => {
          const endAt = time.monotonicTime();
          const connectEnd = tlsHandshakeAt ?? tcpConnectionAt;
          const timings = {
            send: requestFinishAt - startAt,
            wait: responseAt - requestFinishAt,
            receive: endAt - responseAt,
            dns: dnsLookupAt ? dnsLookupAt - startAt : -1,
            connect: connectEnd ? connectEnd - startAt : -1,
            // "If [ssl] is defined then the time is also included in the connect field "
            ssl: tlsHandshakeAt ? tlsHandshakeAt - tcpConnectionAt : -1,
            blocked: reusedSocketAt ? reusedSocketAt - startAt : -1
          };
          const requestFinishedEvent = {
            requestEvent,
            httpVersion: response.httpVersion,
            statusCode: response.statusCode || 0,
            statusMessage: response.statusMessage || "",
            headers: response.headers,
            rawHeaders: response.rawHeaders,
            cookies,
            body: body2,
            timings,
            serverIPAddress,
            serverPort,
            securityDetails
          };
          this.emit(APIRequestContext.Events.RequestFinished, requestFinishedEvent);
        };
        progress.log(`← ${response.statusCode} ${response.statusMessage}`);
        for (const [name, value] of Object.entries(response.headers))
          progress.log(`  ${name}: ${value}`);
        const cookies = this._parseSetCookieHeader(response.url || url.toString(), response.headers["set-cookie"]);
        if (cookies.length) {
          try {
            await this._addCookies(cookies);
          } catch (e) {
            await Promise.all(cookies.map((c) => this._addCookies([c]).catch(() => {
            })));
          }
        }
        if (redirectStatus.includes(response.statusCode) && options.maxRedirects >= 0) {
          if (options.maxRedirects === 0) {
            reject(new Error("Max redirect count exceeded"));
            request.destroy();
            return;
          }
          const headers = { ...options.headers };
          removeHeader(headers, `cookie`);
          const status = response.statusCode;
          let method = options.method;
          if ((status === 301 || status === 302) && method === "POST" || status === 303 && !["GET", "HEAD"].includes(method)) {
            method = "GET";
            postData = void 0;
            removeHeader(headers, `content-encoding`);
            removeHeader(headers, `content-language`);
            removeHeader(headers, `content-length`);
            removeHeader(headers, `content-location`);
            removeHeader(headers, `content-type`);
          }
          const redirectOptions = {
            method,
            headers,
            agent: options.agent,
            maxRedirects: options.maxRedirects - 1,
            ...socksClientCertificatesInterceptor.getMatchingTLSOptionsForOrigin(this._defaultOptions().clientCertificates, url.origin),
            __testHookLookup: options.__testHookLookup
          };
          if (options.rejectUnauthorized === false)
            redirectOptions.rejectUnauthorized = false;
          const locationHeaderValue = Buffer.from(response.headers.location ?? "", "latin1").toString("utf8");
          if (locationHeaderValue) {
            let locationURL;
            try {
              locationURL = new URL(locationHeaderValue, url);
            } catch (error) {
              reject(new Error(`uri requested responds with an invalid redirect URL: ${locationHeaderValue}`));
              request.destroy();
              return;
            }
            if (headers["host"])
              headers["host"] = locationURL.host;
            notifyRequestFinished();
            fulfill(this._sendRequest(progress, locationURL, redirectOptions, postData));
            request.destroy();
            return;
          }
        }
        if (response.statusCode === 401 && !getHeader(options.headers, "authorization")) {
          const auth = response.headers["www-authenticate"];
          const credentials = this._getHttpCredentials(url);
          if (auth?.trim().startsWith("Basic") && credentials) {
            setBasicAuthorizationHeader(options.headers, credentials);
            notifyRequestFinished();
            fulfill(this._sendRequest(progress, url, options, postData));
            request.destroy();
            return;
          }
        }
        response.on("aborted", () => reject(new Error("aborted")));
        const chunks = [];
        const notifyBodyFinished = () => {
          const body2 = Buffer.concat(chunks);
          notifyRequestFinished(body2);
          fulfill({
            url: response.url || url.toString(),
            status: response.statusCode || 0,
            statusText: response.statusMessage || "",
            headers: toHeadersArray(response.rawHeaders),
            body: body2
          });
        };
        let body = response;
        let transform;
        const encoding = response.headers["content-encoding"];
        if (encoding === "gzip" || encoding === "x-gzip") {
          transform = zlib__namespace.createGunzip({
            flush: zlib__namespace.constants.Z_SYNC_FLUSH,
            finishFlush: zlib__namespace.constants.Z_SYNC_FLUSH
          });
        } else if (encoding === "br") {
          transform = zlib__namespace.createBrotliDecompress({
            flush: zlib__namespace.constants.BROTLI_OPERATION_FLUSH,
            finishFlush: zlib__namespace.constants.BROTLI_OPERATION_FLUSH
          });
        } else if (encoding === "deflate") {
          transform = zlib__namespace.createInflate();
        }
        if (transform) {
          const emptyStreamTransform = new SafeEmptyStreamTransform(notifyBodyFinished);
          body = require$$6.pipeline(response, emptyStreamTransform, transform, (e) => {
            if (e)
              reject(new Error(`failed to decompress '${encoding}' encoding: ${e.message}`));
          });
          body.on("error", (e) => reject(new Error(`failed to decompress '${encoding}' encoding: ${e}`)));
        } else {
          body.on("error", reject);
        }
        body.on("data", (chunk) => chunks.push(chunk));
        body.on("end", notifyBodyFinished);
      });
      request.on("error", reject);
      progress.cleanupWhenAborted(() => request.destroy());
      listeners.push(
        eventsHelper.eventsHelper.addEventListener(this, APIRequestContext.Events.Dispose, () => {
          reject(new Error("Request context disposed."));
          request.destroy();
        })
      );
      request.on("close", () => eventsHelper.eventsHelper.removeEventListeners(listeners));
      request.on("socket", (socket) => {
        if (request.reusedSocket) {
          reusedSocketAt = time.monotonicTime();
          return;
        }
        const happyEyeBallsTimings = happyEyeballs.timingForSocket(socket);
        dnsLookupAt = happyEyeBallsTimings.dnsLookupAt;
        tcpConnectionAt = happyEyeBallsTimings.tcpConnectionAt;
        listeners.push(
          eventsHelper.eventsHelper.addEventListener(socket, "lookup", () => {
            dnsLookupAt = time.monotonicTime();
          }),
          eventsHelper.eventsHelper.addEventListener(socket, "connect", () => {
            tcpConnectionAt = time.monotonicTime();
          }),
          eventsHelper.eventsHelper.addEventListener(socket, "secureConnect", () => {
            tlsHandshakeAt = time.monotonicTime();
            if (socket instanceof tls.TLSSocket) {
              const peerCertificate = socket.getPeerCertificate();
              securityDetails = {
                protocol: socket.getProtocol() ?? void 0,
                subjectName: peerCertificate.subject.CN,
                validFrom: new Date(peerCertificate.valid_from).getTime() / 1e3,
                validTo: new Date(peerCertificate.valid_to).getTime() / 1e3,
                issuer: peerCertificate.issuer.CN
              };
            }
          })
        );
        serverIPAddress = socket.remoteAddress;
        serverPort = socket.remotePort;
      });
      request.on("finish", () => {
        requestFinishAt = time.monotonicTime();
      });
      progress.log(`→ ${options.method} ${url.toString()}`);
      if (options.headers) {
        for (const [name, value] of Object.entries(options.headers))
          progress.log(`  ${name}: ${value}`);
      }
      if (postData)
        request.write(postData);
      request.end();
    });
    return progress.race(resultPromise);
  }
  _getHttpCredentials(url) {
    if (!this._defaultOptions().httpCredentials?.origin || url.origin.toLowerCase() === this._defaultOptions().httpCredentials?.origin?.toLowerCase())
      return this._defaultOptions().httpCredentials;
    return void 0;
  }
}
class SafeEmptyStreamTransform extends require$$6.Transform {
  constructor(onEmptyStreamCallback) {
    super();
    this._receivedSomeData = false;
    this._onEmptyStreamCallback = onEmptyStreamCallback;
  }
  _transform(chunk, encoding, callback) {
    this._receivedSomeData = true;
    callback(null, chunk);
  }
  _flush(callback) {
    if (this._receivedSomeData)
      callback(null);
    else
      this._onEmptyStreamCallback();
  }
}
class BrowserContextAPIRequestContext extends APIRequestContext {
  constructor(context) {
    super(context);
    this._context = context;
    context.once(browserContext.BrowserContext.Events.Close, () => this._disposeImpl());
  }
  tracing() {
    return this._context.tracing;
  }
  async dispose(options) {
    this._closeReason = options.reason;
    this.fetchResponses.clear();
  }
  _defaultOptions() {
    return {
      userAgent: this._context._options.userAgent || this._context._browser.userAgent(),
      extraHTTPHeaders: this._context._options.extraHTTPHeaders,
      failOnStatusCode: void 0,
      httpCredentials: this._context._options.httpCredentials,
      proxy: this._context._options.proxy || this._context._browser.options.proxy,
      ignoreHTTPSErrors: this._context._options.ignoreHTTPSErrors,
      baseURL: this._context._options.baseURL,
      clientCertificates: this._context._options.clientCertificates
    };
  }
  async _addCookies(cookies) {
    await this._context.addCookies(cookies);
  }
  async _cookies(url) {
    return await this._context.cookies(url.toString());
  }
  async storageState(progress, indexedDB) {
    return this._context.storageState(progress, indexedDB);
  }
}
class GlobalAPIRequestContext extends APIRequestContext {
  constructor(playwright, options) {
    super(playwright);
    this._cookieStore = new cookieStore.CookieStore();
    this.attribution.context = this;
    if (options.storageState) {
      this._origins = options.storageState.origins?.map((origin) => ({ indexedDB: [], ...origin }));
      this._cookieStore.addCookies(options.storageState.cookies || []);
    }
    browserContext.verifyClientCertificates(options.clientCertificates);
    this._options = {
      baseURL: options.baseURL,
      userAgent: options.userAgent || userAgent.getUserAgent(),
      extraHTTPHeaders: options.extraHTTPHeaders,
      failOnStatusCode: !!options.failOnStatusCode,
      ignoreHTTPSErrors: !!options.ignoreHTTPSErrors,
      maxRedirects: options.maxRedirects,
      httpCredentials: options.httpCredentials,
      clientCertificates: options.clientCertificates,
      proxy: options.proxy
    };
    this._tracing = new tracing.Tracing(this, options.tracesDir);
  }
  tracing() {
    return this._tracing;
  }
  async dispose(options) {
    this._closeReason = options.reason;
    await this._tracing.flush();
    await this._tracing.deleteTmpTracesDir();
    this._disposeImpl();
  }
  _defaultOptions() {
    return this._options;
  }
  async _addCookies(cookies) {
    this._cookieStore.addCookies(cookies);
  }
  async _cookies(url) {
    return this._cookieStore.cookies(url);
  }
  async storageState(progress, indexedDB = false) {
    return {
      cookies: this._cookieStore.allCookies(),
      origins: (this._origins || []).map((origin) => ({ ...origin, indexedDB: indexedDB ? origin.indexedDB : [] }))
    };
  }
}
function toHeadersArray(rawHeaders) {
  const result = [];
  for (let i = 0; i < rawHeaders.length; i += 2)
    result.push({ name: rawHeaders[i], value: rawHeaders[i + 1] });
  return result;
}
const redirectStatus = [301, 302, 303, 307, 308];
function parseCookie(header) {
  const raw = cookieStore.parseRawCookie(header);
  if (!raw)
    return null;
  const cookie = {
    domain: "",
    path: "",
    expires: -1,
    httpOnly: false,
    secure: false,
    // From https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
    // The cookie-sending behavior if SameSite is not specified is SameSite=Lax.
    sameSite: "Lax",
    ...raw
  };
  return cookie;
}
function serializePostData(params, headers) {
  assert.assert((params.postData ? 1 : 0) + (params.jsonData ? 1 : 0) + (params.formData ? 1 : 0) + (params.multipartData ? 1 : 0) <= 1, `Only one of 'data', 'form' or 'multipart' can be specified`);
  if (params.jsonData !== void 0) {
    setHeader(headers, "content-type", "application/json", true);
    return Buffer.from(params.jsonData, "utf8");
  } else if (params.formData) {
    const searchParams = new URLSearchParams();
    for (const { name, value } of params.formData)
      searchParams.append(name, value);
    setHeader(headers, "content-type", "application/x-www-form-urlencoded", true);
    return Buffer.from(searchParams.toString(), "utf8");
  } else if (params.multipartData) {
    const formData$1 = new formData.MultipartFormData();
    for (const field of params.multipartData) {
      if (field.file)
        formData$1.addFileField(field.name, field.file);
      else if (field.value)
        formData$1.addField(field.name, field.value);
    }
    setHeader(headers, "content-type", formData$1.contentTypeHeader(), true);
    return formData$1.finish();
  } else if (params.postData !== void 0) {
    setHeader(headers, "content-type", "application/octet-stream", true);
    return params.postData;
  }
  return void 0;
}
function setHeader(headers, name, value, keepExisting = false) {
  const existing = Object.entries(headers).find((pair) => pair[0].toLowerCase() === name.toLowerCase());
  if (!existing)
    headers[name] = value;
  else if (!keepExisting)
    headers[existing[0]] = value;
}
function getHeader(headers, name) {
  const existing = Object.entries(headers).find((pair) => pair[0].toLowerCase() === name.toLowerCase());
  return existing ? existing[1] : void 0;
}
function removeHeader(headers, name) {
  delete headers[name];
}
function setBasicAuthorizationHeader(headers, credentials) {
  const { username, password } = credentials;
  const encoded = Buffer.from(`${username || ""}:${password || ""}`).toString("base64");
  setHeader(headers, "authorization", `Basic ${encoded}`);
}

exports.APIRequestContext = APIRequestContext;
exports.BrowserContextAPIRequestContext = BrowserContextAPIRequestContext;
exports.GlobalAPIRequestContext = GlobalAPIRequestContext;
