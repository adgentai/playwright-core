'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const dispatcher = require('./dispatcher.js');
const crConnection = require('../chromium/crConnection.js');

class CDPSessionDispatcher extends dispatcher.Dispatcher {
  constructor(scope, cdpSession) {
    super(scope, cdpSession, "CDPSession", {});
    this._type_CDPSession = true;
    this.addObjectListener(crConnection.CDPSession.Events.Event, ({ method, params }) => this._dispatchEvent("event", { method, params }));
    this.addObjectListener(crConnection.CDPSession.Events.Closed, () => this._dispose());
  }
  async send(params, progress) {
    return { result: await progress.race(this._object.send(params.method, params.params)) };
  }
  async detach(_, progress) {
    progress.metadata.potentiallyClosesScope = true;
    await this._object.detach();
  }
}

exports.CDPSessionDispatcher = CDPSessionDispatcher;
