'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const assert = require('../../utils/isomorphic/assert.js');
const headers = require('../../utils/isomorphic/headers.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
require('../utils/debugLogger.js');
require('../../../../../bundles/fs.js');
require('node:path');
require('../../zipBundle.js');
require('../utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../utils/happyEyeballs.js');
require('../utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('../utils/profiler.js');
require('../utils/socksProxy.js');
require('node:os');
require('../utils/zones.js');
const network = require('../network.js');

const errorReasons = {
  "aborted": "Cancellation",
  "accessdenied": "AccessControl",
  "addressunreachable": "General",
  "blockedbyclient": "Cancellation",
  "blockedbyresponse": "General",
  "connectionaborted": "General",
  "connectionclosed": "General",
  "connectionfailed": "General",
  "connectionrefused": "General",
  "connectionreset": "General",
  "internetdisconnected": "General",
  "namenotresolved": "General",
  "timedout": "Timeout",
  "failed": "General"
};
class WKInterceptableRequest {
  constructor(session, frame, event, redirectedFrom, documentId) {
    this._session = session;
    this._requestId = event.requestId;
    const resourceType = event.type ? event.type.toLowerCase() : redirectedFrom ? redirectedFrom.request.resourceType() : "other";
    let postDataBuffer = null;
    this._timestamp = event.timestamp;
    this._wallTime = event.walltime * 1e3;
    if (event.request.postData)
      postDataBuffer = Buffer.from(event.request.postData, "base64");
    this.request = new network.Request(
      frame._page.browserContext,
      frame,
      null,
      redirectedFrom?.request || null,
      documentId,
      event.request.url,
      resourceType,
      event.request.method,
      postDataBuffer,
      headers.headersObjectToArray(event.request.headers)
    );
  }
  adoptRequestFromNewProcess(newSession, requestId) {
    this._session = newSession;
    this._requestId = requestId;
  }
  createResponse(responsePayload) {
    const getResponseBody = async () => {
      const response2 = await this._session.send("Network.getResponseBody", { requestId: this._requestId });
      return Buffer.from(response2.body, response2.base64Encoded ? "base64" : "utf8");
    };
    const timingPayload = responsePayload.timing;
    const timing = {
      startTime: this._wallTime,
      domainLookupStart: timingPayload ? wkMillisToRoundishMillis(timingPayload.domainLookupStart) : -1,
      domainLookupEnd: timingPayload ? wkMillisToRoundishMillis(timingPayload.domainLookupEnd) : -1,
      connectStart: timingPayload ? wkMillisToRoundishMillis(timingPayload.connectStart) : -1,
      secureConnectionStart: timingPayload ? wkMillisToRoundishMillis(timingPayload.secureConnectionStart) : -1,
      connectEnd: timingPayload ? wkMillisToRoundishMillis(timingPayload.connectEnd) : -1,
      requestStart: timingPayload ? wkMillisToRoundishMillis(timingPayload.requestStart) : -1,
      responseStart: timingPayload ? wkMillisToRoundishMillis(timingPayload.responseStart) : -1
    };
    const setCookieSeparator = process.platform === "darwin" ? "," : "playwright-set-cookie-separator";
    const response = new network.Response(this.request, responsePayload.status, responsePayload.statusText, headers.headersObjectToArray(responsePayload.headers, ",", setCookieSeparator), timing, getResponseBody, responsePayload.source === "service-worker");
    response.setRawResponseHeaders(null);
    response.setTransferSize(null);
    if (responsePayload.requestHeaders && Object.keys(responsePayload.requestHeaders).length) {
      const headers$1 = { ...responsePayload.requestHeaders };
      if (!headers$1["host"])
        headers$1["Host"] = new URL(this.request.url()).host;
      this.request.setRawRequestHeaders(headers.headersObjectToArray(headers$1));
    } else {
      this.request.setRawRequestHeaders(null);
    }
    return response;
  }
}
class WKRouteImpl {
  constructor(session, requestId) {
    this._session = session;
    this._requestId = requestId;
  }
  async abort(errorCode) {
    const errorType = errorReasons[errorCode];
    assert.assert(errorType, "Unknown error code: " + errorCode);
    await this._session.sendMayFail("Network.interceptRequestWithError", { requestId: this._requestId, errorType });
  }
  async fulfill(response) {
    if (300 <= response.status && response.status < 400)
      throw new Error("Cannot fulfill with redirect status: " + response.status);
    let mimeType = response.isBase64 ? "application/octet-stream" : "text/plain";
    const headers$1 = headers.headersArrayToObject(
      response.headers,
      true
      /* lowerCase */
    );
    const contentType = headers$1["content-type"];
    if (contentType)
      mimeType = contentType.split(";")[0].trim();
    await this._session.sendMayFail("Network.interceptRequestWithResponse", {
      requestId: this._requestId,
      status: response.status,
      statusText: network.statusText(response.status),
      mimeType,
      headers: headers$1,
      base64Encoded: response.isBase64,
      content: response.body
    });
  }
  async continue(overrides) {
    await this._session.sendMayFail("Network.interceptWithRequest", {
      requestId: this._requestId,
      url: overrides.url,
      method: overrides.method,
      headers: overrides.headers ? headers.headersArrayToObject(
        overrides.headers,
        false
        /* lowerCase */
      ) : void 0,
      postData: overrides.postData ? Buffer.from(overrides.postData).toString("base64") : void 0
    });
  }
}
function wkMillisToRoundishMillis(value) {
  if (value === -1e3)
    return -1;
  if (value <= 0) {
    return -1;
  }
  return (value * 1e3 | 0) / 1e3;
}

exports.WKInterceptableRequest = WKInterceptableRequest;
exports.WKRouteImpl = WKRouteImpl;
