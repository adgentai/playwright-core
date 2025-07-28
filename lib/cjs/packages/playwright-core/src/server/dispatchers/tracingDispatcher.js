'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const artifactDispatcher = require('./artifactDispatcher.js');
const dispatcher = require('./dispatcher.js');

class TracingDispatcher extends dispatcher.Dispatcher {
  constructor(scope, tracing) {
    super(scope, tracing, "Tracing", {});
    this._type_Tracing = true;
  }
  static from(scope, tracing) {
    const result = scope.connection.existingDispatcher(tracing);
    return result || new TracingDispatcher(scope, tracing);
  }
  async tracingStart(params, progress) {
    this._object.start(params);
  }
  async tracingStartChunk(params, progress) {
    return await this._object.startChunk(progress, params);
  }
  async tracingGroup(params, progress) {
    const { name, location } = params;
    this._object.group(name, location, progress.metadata);
  }
  async tracingGroupEnd(params, progress) {
    this._object.groupEnd();
  }
  async tracingStopChunk(params, progress) {
    const { artifact, entries } = await this._object.stopChunk(progress, params);
    return { artifact: artifact ? artifactDispatcher.ArtifactDispatcher.from(this, artifact) : void 0, entries };
  }
  async tracingStop(params, progress) {
    await this._object.stop(progress);
  }
}

exports.TracingDispatcher = TracingDispatcher;
