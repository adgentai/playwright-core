'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const browserContext = require('./browserContext.js');
const channelOwner = require('./channelOwner.js');
const errors = require('./errors.js');
const network = require('./network.js');
const tracing = require('./tracing.js');
const assert = require('../utils/isomorphic/assert.js');
const fileUtils = require('./fileUtils.js');
const headers = require('../utils/isomorphic/headers.js');
const stringUtils = require('../utils/isomorphic/stringUtils.js');
const timeoutSettings = require('./timeoutSettings.js');

class APIRequest {
  constructor(playwright) {
    this._contexts = /* @__PURE__ */ new Set();
    this._playwright = playwright;
  }
  async newContext(options = {}) {
    options = {
      ...this._playwright._defaultContextOptions,
      ...options
    };
    const storageState = typeof options.storageState === "string" ? JSON.parse(await this._playwright._platform.fs().promises.readFile(options.storageState, "utf8")) : options.storageState;
    const context = APIRequestContext.from((await this._playwright._channel.newRequest({
      ...options,
      extraHTTPHeaders: options.extraHTTPHeaders ? headers.headersObjectToArray(options.extraHTTPHeaders) : void 0,
      storageState,
      tracesDir: this._playwright._defaultLaunchOptions?.tracesDir,
      // We do not expose tracesDir in the API, so do not allow options to accidentally override it.
      clientCertificates: await browserContext.toClientCertificatesProtocol(this._playwright._platform, options.clientCertificates)
    })).request);
    this._contexts.add(context);
    context._request = this;
    context._timeoutSettings.setDefaultTimeout(options.timeout ?? this._playwright._defaultContextTimeout);
    context._tracing._tracesDir = this._playwright._defaultLaunchOptions?.tracesDir;
    await context._instrumentation.runAfterCreateRequestContext(context);
    return context;
  }
}
class APIRequestContext extends channelOwner.ChannelOwner {
  static from(channel) {
    return channel._object;
  }
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    this._tracing = tracing.Tracing.from(initializer.tracing);
    this._timeoutSettings = new timeoutSettings.TimeoutSettings(this._platform);
  }
  async [Symbol.asyncDispose]() {
    await this.dispose();
  }
  async dispose(options = {}) {
    this._closeReason = options.reason;
    await this._instrumentation.runBeforeCloseRequestContext(this);
    try {
      await this._channel.dispose(options);
    } catch (e) {
      if (errors.isTargetClosedError(e))
        return;
      throw e;
    }
    this._tracing._resetStackCounter();
    this._request?._contexts.delete(this);
  }
  async delete(url, options) {
    return await this.fetch(url, {
      ...options,
      method: "DELETE"
    });
  }
  async head(url, options) {
    return await this.fetch(url, {
      ...options,
      method: "HEAD"
    });
  }
  async get(url, options) {
    return await this.fetch(url, {
      ...options,
      method: "GET"
    });
  }
  async patch(url, options) {
    return await this.fetch(url, {
      ...options,
      method: "PATCH"
    });
  }
  async post(url, options) {
    return await this.fetch(url, {
      ...options,
      method: "POST"
    });
  }
  async put(url, options) {
    return await this.fetch(url, {
      ...options,
      method: "PUT"
    });
  }
  async fetch(urlOrRequest, options = {}) {
    const url = stringUtils.isString(urlOrRequest) ? urlOrRequest : void 0;
    const request = stringUtils.isString(urlOrRequest) ? void 0 : urlOrRequest;
    return await this._innerFetch({ url, request, ...options });
  }
  async _innerFetch(options = {}) {
    return await this._wrapApiCall(async () => {
      if (this._closeReason)
        throw new errors.TargetClosedError(this._closeReason);
      assert.assert(options.request || typeof options.url === "string", "First argument must be either URL string or Request");
      assert.assert((options.data === void 0 ? 0 : 1) + (options.form === void 0 ? 0 : 1) + (options.multipart === void 0 ? 0 : 1) <= 1, `Only one of 'data', 'form' or 'multipart' can be specified`);
      assert.assert(options.maxRedirects === void 0 || options.maxRedirects >= 0, `'maxRedirects' must be greater than or equal to '0'`);
      assert.assert(options.maxRetries === void 0 || options.maxRetries >= 0, `'maxRetries' must be greater than or equal to '0'`);
      const url = options.url !== void 0 ? options.url : options.request.url();
      const method = options.method || options.request?.method();
      let encodedParams = void 0;
      if (typeof options.params === "string")
        encodedParams = options.params;
      else if (options.params instanceof URLSearchParams)
        encodedParams = options.params.toString();
      const headersObj = options.headers || options.request?.headers();
      const headers$1 = headersObj ? headers.headersObjectToArray(headersObj) : void 0;
      let jsonData;
      let formData;
      let multipartData;
      let postDataBuffer;
      if (options.data !== void 0) {
        if (stringUtils.isString(options.data)) {
          if (isJsonContentType(headers$1))
            jsonData = isJsonParsable(options.data) ? options.data : JSON.stringify(options.data);
          else
            postDataBuffer = Buffer.from(options.data, "utf8");
        } else if (Buffer.isBuffer(options.data)) {
          postDataBuffer = options.data;
        } else if (typeof options.data === "object" || typeof options.data === "number" || typeof options.data === "boolean") {
          jsonData = JSON.stringify(options.data);
        } else {
          throw new Error(`Unexpected 'data' type`);
        }
      } else if (options.form) {
        if (globalThis.FormData && options.form instanceof FormData) {
          formData = [];
          for (const [name, value] of options.form.entries()) {
            if (typeof value !== "string")
              throw new Error(`Expected string for options.form["${name}"], found File. Please use options.multipart instead.`);
            formData.push({ name, value });
          }
        } else {
          formData = objectToArray(options.form);
        }
      } else if (options.multipart) {
        multipartData = [];
        if (globalThis.FormData && options.multipart instanceof FormData) {
          const form = options.multipart;
          for (const [name, value] of form.entries()) {
            if (stringUtils.isString(value)) {
              multipartData.push({ name, value });
            } else {
              const file = {
                name: value.name,
                mimeType: value.type,
                buffer: Buffer.from(await value.arrayBuffer())
              };
              multipartData.push({ name, file });
            }
          }
        } else {
          for (const [name, value] of Object.entries(options.multipart))
            multipartData.push(await toFormField(this._platform, name, value));
        }
      }
      if (postDataBuffer === void 0 && jsonData === void 0 && formData === void 0 && multipartData === void 0)
        postDataBuffer = options.request?.postDataBuffer() || void 0;
      const fixtures = {
        __testHookLookup: options.__testHookLookup
      };
      const result = await this._channel.fetch({
        url,
        params: typeof options.params === "object" ? objectToArray(options.params) : void 0,
        encodedParams,
        method,
        headers: headers$1,
        postData: postDataBuffer,
        jsonData,
        formData,
        multipartData,
        timeout: this._timeoutSettings.timeout(options),
        failOnStatusCode: options.failOnStatusCode,
        ignoreHTTPSErrors: options.ignoreHTTPSErrors,
        maxRedirects: options.maxRedirects,
        maxRetries: options.maxRetries,
        ...fixtures
      });
      return new APIResponse(this, result.response);
    });
  }
  async storageState(options = {}) {
    const state = await this._channel.storageState({ indexedDB: options.indexedDB });
    if (options.path) {
      await fileUtils.mkdirIfNeeded(this._platform, options.path);
      await this._platform.fs().promises.writeFile(options.path, JSON.stringify(state, void 0, 2), "utf8");
    }
    return state;
  }
}
async function toFormField(platform, name, value) {
  const typeOfValue = typeof value;
  if (isFilePayload(value)) {
    const payload = value;
    if (!Buffer.isBuffer(payload.buffer))
      throw new Error(`Unexpected buffer type of 'data.${name}'`);
    return { name, file: filePayloadToJson(payload) };
  } else if (typeOfValue === "string" || typeOfValue === "number" || typeOfValue === "boolean") {
    return { name, value: String(value) };
  } else {
    return { name, file: await readStreamToJson(platform, value) };
  }
}
function isJsonParsable(value) {
  if (typeof value !== "string")
    return false;
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    if (e instanceof SyntaxError)
      return false;
    else
      throw e;
  }
}
class APIResponse {
  constructor(context, initializer) {
    this._request = context;
    this._initializer = initializer;
    this._headers = new network.RawHeaders(this._initializer.headers);
    if (context._platform.inspectCustom)
      this[context._platform.inspectCustom] = () => this._inspect();
  }
  ok() {
    return this._initializer.status >= 200 && this._initializer.status <= 299;
  }
  url() {
    return this._initializer.url;
  }
  status() {
    return this._initializer.status;
  }
  statusText() {
    return this._initializer.statusText;
  }
  headers() {
    return this._headers.headers();
  }
  headersArray() {
    return this._headers.headersArray();
  }
  async body() {
    return await this._request._wrapApiCall(async () => {
      try {
        const result = await this._request._channel.fetchResponseBody({ fetchUid: this._fetchUid() });
        if (result.binary === void 0)
          throw new Error("Response has been disposed");
        return result.binary;
      } catch (e) {
        if (errors.isTargetClosedError(e))
          throw new Error("Response has been disposed");
        throw e;
      }
    }, { internal: true });
  }
  async text() {
    const content = await this.body();
    return content.toString("utf8");
  }
  async json() {
    const content = await this.text();
    return JSON.parse(content);
  }
  async [Symbol.asyncDispose]() {
    await this.dispose();
  }
  async dispose() {
    await this._request._channel.disposeAPIResponse({ fetchUid: this._fetchUid() });
  }
  _inspect() {
    const headers = this.headersArray().map(({ name, value }) => `  ${name}: ${value}`);
    return `APIResponse: ${this.status()} ${this.statusText()}
${headers.join("\n")}`;
  }
  _fetchUid() {
    return this._initializer.fetchUid;
  }
  async _fetchLog() {
    const { log } = await this._request._channel.fetchLog({ fetchUid: this._fetchUid() });
    return log;
  }
}
function filePayloadToJson(payload) {
  return {
    name: payload.name,
    mimeType: payload.mimeType,
    buffer: payload.buffer
  };
}
async function readStreamToJson(platform, stream) {
  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
  const streamPath = Buffer.isBuffer(stream.path) ? stream.path.toString("utf8") : stream.path;
  return {
    name: platform.path().basename(streamPath),
    buffer
  };
}
function isJsonContentType(headers) {
  if (!headers)
    return false;
  for (const { name, value } of headers) {
    if (name.toLocaleLowerCase() === "content-type")
      return value === "application/json";
  }
  return false;
}
function objectToArray(map) {
  if (!map)
    return void 0;
  const result = [];
  for (const [name, value] of Object.entries(map)) {
    if (value !== void 0)
      result.push({ name, value: String(value) });
  }
  return result;
}
function isFilePayload(value) {
  return typeof value === "object" && value["name"] && value["mimeType"] && value["buffer"];
}

exports.APIRequest = APIRequest;
exports.APIRequestContext = APIRequestContext;
exports.APIResponse = APIResponse;
