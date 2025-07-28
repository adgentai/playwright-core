import { EventEmitter } from 'node:events';
import http2 from 'node:http2';
import net from 'node:net';
import require$$6 from 'node:stream';
import tls from 'node:tls';
import { SocksProxy } from './utils/socksProxy.js';
import { escapeHTML } from '../utils/isomorphic/stringUtils.js';
import { ManualPromise } from '../utils/isomorphic/manualPromise.js';
import { rewriteErrorMessage } from '../utils/isomorphic/stackTrace.js';
import '../../../../_virtual/pixelmatch.js';
import '../utilsBundle.js';
import { generateSelfSignedCertificate } from './utils/crypto.js';
import './utils/debug.js';
import { debugLogger } from './utils/debugLogger.js';
import '../../../../bundles/fs.js';
import 'node:path';
import '../zipBundle.js';
import './utils/hostPlatform.js';
import { createProxyAgent } from './utils/network.js';
import './utils/nodePlatform.js';
import 'node:child_process';
import 'node:readline';
import './utils/profiler.js';
import 'node:os';
import './utils/zones.js';
import { verifyClientCertificates } from './browserContext.js';
import { createTLSSocket, createSocket } from './utils/happyEyeballs.js';

let dummyServerTlsOptions = void 0;
function loadDummyServerCertsIfNeeded() {
  if (dummyServerTlsOptions)
    return;
  const { cert, key } = generateSelfSignedCertificate();
  dummyServerTlsOptions = { key, cert };
}
class ALPNCache {
  constructor() {
    this._cache = /* @__PURE__ */ new Map();
  }
  get(host, port, success) {
    const cacheKey = `${host}:${port}`;
    {
      const result2 = this._cache.get(cacheKey);
      if (result2) {
        result2.then(success);
        return;
      }
    }
    const result = new ManualPromise();
    this._cache.set(cacheKey, result);
    result.then(success);
    createTLSSocket({
      host,
      port,
      servername: net.isIP(host) ? void 0 : host,
      ALPNProtocols: ["h2", "http/1.1"],
      rejectUnauthorized: false
    }).then((socket) => {
      result.resolve(socket.alpnProtocol || "http/1.1");
      socket.end();
    }).catch((error) => {
      debugLogger.log("client-certificates", `ALPN error: ${error.message}`);
      result.resolve("http/1.1");
    });
  }
}
class SocksProxyConnection {
  constructor(socksProxy, uid, host, port) {
    this.firstPackageReceived = false;
    this._closed = false;
    this.socksProxy = socksProxy;
    this.uid = uid;
    this.host = host;
    this.port = port;
    this._targetCloseEventListener = () => {
      this.socksProxy._socksProxy.sendSocketEnd({ uid: this.uid });
      this.internalTLS?.destroy();
      this._dummyServer?.close();
    };
  }
  async connect() {
    if (this.socksProxy.proxyAgentFromOptions)
      this.target = await this.socksProxy.proxyAgentFromOptions.callback(new EventEmitter(), { host: rewriteToLocalhostIfNeeded(this.host), port: this.port, secureEndpoint: false });
    else
      this.target = await createSocket(rewriteToLocalhostIfNeeded(this.host), this.port);
    this.target.once("close", this._targetCloseEventListener);
    this.target.once("error", (error) => this.socksProxy._socksProxy.sendSocketError({ uid: this.uid, error: error.message }));
    if (this._closed) {
      this.target.destroy();
      return;
    }
    this.socksProxy._socksProxy.socketConnected({
      uid: this.uid,
      host: this.target.localAddress,
      port: this.target.localPort
    });
  }
  onClose() {
    this.target.destroy();
    this.internalTLS?.destroy();
    this._dummyServer?.close();
    this._closed = true;
  }
  onData(data) {
    if (!this.firstPackageReceived) {
      this.firstPackageReceived = true;
      if (data[0] === 22)
        this._attachTLSListeners();
      else
        this.target.on("data", (data2) => this.socksProxy._socksProxy.sendSocketData({ uid: this.uid, data: data2 }));
    }
    if (this.internal)
      this.internal.push(data);
    else
      this.target.write(data);
  }
  _attachTLSListeners() {
    this.internal = new require$$6.Duplex({
      read: () => {
      },
      write: (data, encoding, callback) => {
        this.socksProxy._socksProxy.sendSocketData({ uid: this.uid, data });
        callback();
      }
    });
    this.socksProxy.alpnCache.get(rewriteToLocalhostIfNeeded(this.host), this.port, (alpnProtocolChosenByServer) => {
      debugLogger.log("client-certificates", `Proxy->Target ${this.host}:${this.port} chooses ALPN ${alpnProtocolChosenByServer}`);
      if (this._closed)
        return;
      this._dummyServer = tls.createServer({
        ...dummyServerTlsOptions,
        ALPNProtocols: alpnProtocolChosenByServer === "h2" ? ["h2", "http/1.1"] : ["http/1.1"]
      });
      this._dummyServer.emit("connection", this.internal);
      this._dummyServer.once("secureConnection", (internalTLS) => {
        this.internalTLS = internalTLS;
        debugLogger.log("client-certificates", `Browser->Proxy ${this.host}:${this.port} chooses ALPN ${internalTLS.alpnProtocol}`);
        let targetTLS = void 0;
        const handleError = (error) => {
          debugLogger.log("client-certificates", `error when connecting to target: ${error.message.replaceAll("\n", " ")}`);
          const responseBody = escapeHTML("Playwright client-certificate error: " + error.message).replaceAll("\n", " <br>");
          if (internalTLS?.alpnProtocol === "h2") {
            if ("performServerHandshake" in http2) {
              this.target.removeListener("close", this._targetCloseEventListener);
              const session = http2.performServerHandshake(internalTLS);
              session.on("error", () => {
                this.target.destroy();
                this._targetCloseEventListener();
              });
              session.once("stream", (stream2) => {
                stream2.respond({
                  "content-type": "text/html",
                  [http2.constants.HTTP2_HEADER_STATUS]: 503
                });
                const cleanup = () => {
                  session.close();
                  this.target.destroy();
                  this._targetCloseEventListener();
                };
                stream2.end(responseBody, cleanup);
                stream2.once("error", cleanup);
              });
            } else {
              this.target.destroy();
            }
          } else {
            internalTLS.end([
              "HTTP/1.1 503 Internal Server Error",
              "Content-Type: text/html; charset=utf-8",
              "Content-Length: " + Buffer.byteLength(responseBody),
              "",
              responseBody
            ].join("\r\n"));
            this.target.destroy();
          }
        };
        if (this._closed) {
          internalTLS.destroy();
          return;
        }
        targetTLS = tls.connect({
          socket: this.target,
          host: this.host,
          port: this.port,
          rejectUnauthorized: !this.socksProxy.ignoreHTTPSErrors,
          ALPNProtocols: [internalTLS.alpnProtocol || "http/1.1"],
          servername: !net.isIP(this.host) ? this.host : void 0,
          secureContext: this.socksProxy.secureContextMap.get(new URL(`https://${this.host}:${this.port}`).origin)
        });
        targetTLS.once("secureConnect", () => {
          internalTLS.pipe(targetTLS);
          targetTLS.pipe(internalTLS);
        });
        internalTLS.once("error", () => this.target.destroy());
        targetTLS.once("error", handleError);
      });
    });
  }
}
class ClientCertificatesProxy {
  constructor(contextOptions) {
    this._connections = /* @__PURE__ */ new Map();
    this.secureContextMap = /* @__PURE__ */ new Map();
    verifyClientCertificates(contextOptions.clientCertificates);
    this.alpnCache = new ALPNCache();
    this.ignoreHTTPSErrors = contextOptions.ignoreHTTPSErrors;
    this.proxyAgentFromOptions = createProxyAgent(contextOptions.proxy);
    this._initSecureContexts(contextOptions.clientCertificates);
    this._socksProxy = new SocksProxy();
    this._socksProxy.setPattern("*");
    this._socksProxy.addListener(SocksProxy.Events.SocksRequested, async (payload) => {
      try {
        const connection = new SocksProxyConnection(this, payload.uid, payload.host, payload.port);
        await connection.connect();
        this._connections.set(payload.uid, connection);
      } catch (error) {
        this._socksProxy.socketFailed({ uid: payload.uid, errorCode: error.code });
      }
    });
    this._socksProxy.addListener(SocksProxy.Events.SocksData, async (payload) => {
      this._connections.get(payload.uid)?.onData(payload.data);
    });
    this._socksProxy.addListener(SocksProxy.Events.SocksClosed, (payload) => {
      this._connections.get(payload.uid)?.onClose();
      this._connections.delete(payload.uid);
    });
    loadDummyServerCertsIfNeeded();
  }
  _initSecureContexts(clientCertificates) {
    const origin2certs = /* @__PURE__ */ new Map();
    for (const cert of clientCertificates || []) {
      const origin = normalizeOrigin(cert.origin);
      const certs = origin2certs.get(origin) || [];
      certs.push(cert);
      origin2certs.set(origin, certs);
    }
    for (const [origin, certs] of origin2certs) {
      try {
        this.secureContextMap.set(origin, tls.createSecureContext(convertClientCertificatesToTLSOptions(certs)));
      } catch (error) {
        error = rewriteOpenSSLErrorIfNeeded(error);
        throw rewriteErrorMessage(error, `Failed to load client certificate: ${error.message}`);
      }
    }
  }
  static async create(contextOptions) {
    const proxy = new ClientCertificatesProxy(contextOptions);
    await proxy._socksProxy.listen(0, "127.0.0.1");
    return proxy;
  }
  proxySettings() {
    return { server: `socks5://127.0.0.1:${this._socksProxy.port()}` };
  }
  async close() {
    await this._socksProxy.close();
  }
}
function normalizeOrigin(origin) {
  try {
    return new URL(origin).origin;
  } catch (error) {
    return origin;
  }
}
function convertClientCertificatesToTLSOptions(clientCertificates) {
  if (!clientCertificates || !clientCertificates.length)
    return;
  const tlsOptions = {
    pfx: [],
    key: [],
    cert: []
  };
  for (const cert of clientCertificates) {
    if (cert.cert)
      tlsOptions.cert.push(cert.cert);
    if (cert.key)
      tlsOptions.key.push({ pem: cert.key, passphrase: cert.passphrase });
    if (cert.pfx)
      tlsOptions.pfx.push({ buf: cert.pfx, passphrase: cert.passphrase });
  }
  return tlsOptions;
}
function getMatchingTLSOptionsForOrigin(clientCertificates, origin) {
  const matchingCerts = clientCertificates?.filter(
    (c) => normalizeOrigin(c.origin) === origin
  );
  return convertClientCertificatesToTLSOptions(matchingCerts);
}
function rewriteToLocalhostIfNeeded(host) {
  return host === "local.playwright" ? "localhost" : host;
}
function rewriteOpenSSLErrorIfNeeded(error) {
  if (error.message !== "unsupported" && error.code !== "ERR_CRYPTO_UNSUPPORTED_OPERATION")
    return error;
  return rewriteErrorMessage(error, [
    "Unsupported TLS certificate.",
    "Most likely, the security algorithm of the given certificate was deprecated by OpenSSL.",
    "For more details, see https://github.com/openssl/openssl/blob/master/README-PROVIDERS.md#the-legacy-provider",
    "You could probably modernize the certificate by following the steps at https://github.com/nodejs/node/issues/40672#issuecomment-1243648223"
  ].join("\n"));
}

export { ClientCertificatesProxy, getMatchingTLSOptionsForOrigin, rewriteOpenSSLErrorIfNeeded };
