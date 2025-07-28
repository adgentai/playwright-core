'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const errors = require('./errors.js');
const assert = require('../utils/isomorphic/assert.js');
const manualPromise = require('../utils/isomorphic/manualPromise.js');
const time = require('../utils/isomorphic/time.js');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
require('./utils/debug.js');
require('./utils/debugLogger.js');
require('../../../../bundles/fs.js');
require('node:path');
require('../zipBundle.js');
require('./utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./utils/happyEyeballs.js');
require('./utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./utils/profiler.js');
require('./utils/socksProxy.js');
require('node:os');
require('./utils/zones.js');

class ProgressController {
  constructor(metadata, sdkObject) {
    this._forceAbortPromise = new manualPromise.ManualPromise();
    this._donePromise = new manualPromise.ManualPromise();
    // Cleanups to be run only in the case of abort.
    this._cleanups = [];
    // Lenient mode races against the timeout. This guarantees that timeout is respected,
    // but may have some work being done after the timeout due to parallel control flow.
    //
    // Strict mode aborts the progress and requires the code to react to it. This way,
    // progress only finishes after the inner callback exits, guaranteeing no work after the timeout.
    this._strictMode = false;
    this._state = "before";
    this._strictMode = !process.env.PLAYWRIGHT_LEGACY_TIMEOUTS;
    this.metadata = metadata;
    this.sdkObject = sdkObject;
    this.instrumentation = sdkObject.instrumentation;
    this._logName = sdkObject.logName || "api";
    this._forceAbortPromise.catch((e) => null);
  }
  setLogName(logName) {
    this._logName = logName;
  }
  async abort(error) {
    if (this._state === "running") {
      error[kAbortErrorSymbol] = true;
      this._state = { error };
      this._forceAbortPromise.reject(error);
    }
    if (this._strictMode)
      await this._donePromise;
  }
  async run(task, timeout) {
    assert.assert(this._state === "before");
    this._state = "running";
    let customErrorHandler;
    const deadline = timeout ? Math.min(time.monotonicTime() + timeout, 2147483647) : 0;
    const timeoutError = new errors.TimeoutError(`Timeout ${timeout}ms exceeded.`);
    let timer;
    const startTimer = () => {
      if (!deadline)
        return;
      const onTimeout = () => {
        if (this._state === "running") {
          timeoutError[kAbortErrorSymbol] = true;
          this._state = { error: timeoutError };
          this._forceAbortPromise.reject(timeoutError);
        }
      };
      const remaining = deadline - time.monotonicTime();
      if (remaining <= 0)
        onTimeout();
      else
        timer = setTimeout(onTimeout, remaining);
    };
    const progress = {
      log: (message) => {
        if (this._state === "running")
          this.metadata.log.push(message);
        this.instrumentation.onCallLog(this.sdkObject, this.metadata, this._logName, message);
      },
      cleanupWhenAborted: (cleanup) => {
        if (this._strictMode) {
          if (this._state !== "running")
            throw new Error("Internal error: cannot register cleanup after operation has finished.");
          this._cleanups.push(cleanup);
          return;
        }
        if (this._state === "running")
          this._cleanups.push(cleanup);
        else
          runCleanup(typeof this._state === "object" ? this._state.error : void 0, cleanup);
      },
      metadata: this.metadata,
      race: (promise) => {
        const promises = Array.isArray(promise) ? promise : [promise];
        return Promise.race([...promises, this._forceAbortPromise]);
      },
      raceWithCleanup: (promise, cleanup) => {
        return progress.race(promise.then((result) => {
          if (this._state !== "running")
            cleanup(result);
          else
            this._cleanups.push(() => cleanup(result));
          return result;
        }));
      },
      wait: async (timeout2) => {
        let timer2;
        const promise = new Promise((f) => timer2 = setTimeout(f, timeout2));
        return progress.race(promise).finally(() => clearTimeout(timer2));
      },
      legacyDisableTimeout: () => {
        if (this._strictMode)
          return;
        clearTimeout(timer);
      },
      legacyEnableTimeout: () => {
        if (this._strictMode)
          return;
        startTimer();
      },
      legacySetErrorHandler: (handler) => {
        if (this._strictMode)
          return;
        customErrorHandler = handler;
      }
    };
    startTimer();
    try {
      const promise = task(progress);
      const result = this._strictMode ? await promise : await Promise.race([promise, this._forceAbortPromise]);
      this._state = "finished";
      return result;
    } catch (error) {
      this._state = { error };
      await Promise.all(this._cleanups.splice(0).map((cleanup) => runCleanup(error, cleanup)));
      if (customErrorHandler)
        return customErrorHandler(error);
      throw error;
    } finally {
      clearTimeout(timer);
      this._donePromise.resolve();
    }
  }
}
async function runCleanup(error, cleanup) {
  try {
    await cleanup(error);
  } catch (e) {
  }
}
const kAbortErrorSymbol = Symbol("kAbortError");
function isAbortError(error) {
  return !!error[kAbortErrorSymbol];
}

exports.ProgressController = ProgressController;
exports.isAbortError = isAbortError;
