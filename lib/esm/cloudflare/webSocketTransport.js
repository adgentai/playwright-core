import { AsyncLocalStorage } from 'node:async_hooks';
import { chunksToMessage, messageToChunks } from './chunking.js';

const transportZone = new AsyncLocalStorage();
class WebSocketTransport {
  constructor(ws, sessionId) {
    this._chunks = [];
    this._pingInterval = setInterval(() => {
      return this._ws.send("ping");
    }, 1e3);
    this._ws = ws;
    this.sessionId = sessionId;
    this._ws.addEventListener("message", (event) => {
      this._chunks.push(new Uint8Array(event.data));
      const message = chunksToMessage(this._chunks, sessionId);
      if (message && this.onmessage)
        this.onmessage(JSON.parse(message));
    });
    this._ws.addEventListener("close", () => {
      clearInterval(this._pingInterval);
      if (this.onclose)
        this.onclose();
    });
    this._ws.addEventListener("error", (e) => {
      console.error(`Websocket error: SessionID: ${sessionId}`, e);
      clearInterval(this._pingInterval);
    });
  }
  static async connect() {
    const transport = transportZone.getStore();
    if (!transport)
      throw new Error("Transport is not available in the current zone");
    return transport;
  }
  send(message) {
    for (const chunk of messageToChunks(JSON.stringify(message)))
      this._ws.send(chunk);
  }
  close() {
    clearInterval(this._pingInterval);
    this._ws.close();
    this.onclose?.();
  }
  async closeAndWait() {
    if (this._ws.readyState === WebSocket.CLOSED)
      return;
    this.close();
  }
  toString() {
    return this.sessionId;
  }
}

export { WebSocketTransport, transportZone };
