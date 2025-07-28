'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const connection = require('./connection.js');

async function connectOverWebSocket(parentConnection, params) {
  const localUtils = parentConnection.localUtils();
  const transport = localUtils ? new JsonPipeTransport(localUtils) : new WebSocketTransport();
  const connectHeaders = await transport.connect(params);
  const connection$1 = new connection.Connection(parentConnection._platform, localUtils, parentConnection._instrumentation, connectHeaders);
  connection$1.markAsRemote();
  connection$1.on("close", () => transport.close());
  let closeError;
  const onTransportClosed = (reason) => {
    connection$1.close(reason || closeError);
  };
  transport.onClose((reason) => onTransportClosed(reason));
  connection$1.onmessage = (message) => transport.send(message).catch(() => onTransportClosed());
  transport.onMessage((message) => {
    try {
      connection$1.dispatch(message);
    } catch (e) {
      closeError = String(e);
      transport.close().catch(() => {
      });
    }
  });
  return connection$1;
}
class JsonPipeTransport {
  constructor(owner) {
    this._owner = owner;
  }
  async connect(params) {
    const { pipe, headers: connectHeaders } = await this._owner._channel.connect(params);
    this._pipe = pipe;
    return connectHeaders;
  }
  async send(message) {
    await this._pipe.send({ message });
  }
  onMessage(callback) {
    this._pipe.on("message", ({ message }) => callback(message));
  }
  onClose(callback) {
    this._pipe.on("closed", ({ reason }) => callback(reason));
  }
  async close() {
    await this._pipe.close().catch(() => {
    });
  }
}
class WebSocketTransport {
  async connect(params) {
    this._ws = new window.WebSocket(params.wsEndpoint);
    return [];
  }
  async send(message) {
    this._ws.send(JSON.stringify(message));
  }
  onMessage(callback) {
    this._ws.addEventListener("message", (event) => callback(JSON.parse(event.data)));
  }
  onClose(callback) {
    this._ws.addEventListener("close", () => callback());
  }
  async close() {
    this._ws.close();
  }
}

exports.connectOverWebSocket = connectOverWebSocket;
