'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('../../../../../bundles/fs.js');
const dispatcher = require('./dispatcher.js');
const streamDispatcher = require('./streamDispatcher.js');
const fileUtils = require('../utils/fileUtils.js');

class ArtifactDispatcher extends dispatcher.Dispatcher {
  constructor(scope, artifact) {
    super(scope, artifact, "Artifact", {
      absolutePath: artifact.localPath()
    });
    this._type_Artifact = true;
  }
  static from(parentScope, artifact) {
    return ArtifactDispatcher.fromNullable(parentScope, artifact);
  }
  static fromNullable(parentScope, artifact) {
    if (!artifact)
      return void 0;
    const result = parentScope.connection.existingDispatcher(artifact);
    return result || new ArtifactDispatcher(parentScope, artifact);
  }
  async pathAfterFinished(params, progress) {
    const path = await progress.race(this._object.localPathAfterFinished());
    return { value: path };
  }
  async saveAs(params, progress) {
    return await progress.race(new Promise((resolve, reject) => {
      this._object.saveAs(async (localPath, error) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          await fileUtils.mkdirIfNeeded(params.path);
          await fs.default.promises.copyFile(localPath, params.path);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }));
  }
  async saveAsStream(params, progress) {
    return await progress.race(new Promise((resolve, reject) => {
      this._object.saveAs(async (localPath, error) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const readable = fs.default.createReadStream(localPath, { highWaterMark: 1024 * 1024 });
          const stream = new streamDispatcher.StreamDispatcher(this, readable);
          resolve({ stream });
          await new Promise((resolve2) => {
            readable.on("close", resolve2);
            readable.on("end", resolve2);
            readable.on("error", resolve2);
          });
        } catch (e) {
          reject(e);
        }
      });
    }));
  }
  async stream(params, progress) {
    const fileName = await progress.race(this._object.localPathAfterFinished());
    const readable = fs.default.createReadStream(fileName, { highWaterMark: 1024 * 1024 });
    return { stream: new streamDispatcher.StreamDispatcher(this, readable) };
  }
  async failure(params, progress) {
    const error = await progress.race(this._object.failureError());
    return { error: error || void 0 };
  }
  async cancel(params, progress) {
    await progress.race(this._object.cancel());
  }
  async delete(params, progress) {
    progress.metadata.potentiallyClosesScope = true;
    await progress.race(this._object.delete());
    this._dispose();
  }
}

exports.ArtifactDispatcher = ArtifactDispatcher;
