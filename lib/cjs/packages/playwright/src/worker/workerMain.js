'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const manualPromise = require('../../../playwright-core/src/utils/isomorphic/manualPromise.js');
require('../../../../_virtual/pixelmatch.js');
const utilsBundle = require('../../../playwright-core/src/utilsBundle.js');
require('node:crypto');
require('../../../playwright-core/src/server/utils/debug.js');
require('../../../playwright-core/src/server/utils/debugLogger.js');
const fileUtils = require('../../../playwright-core/src/server/utils/fileUtils.js');
require('../../../playwright-core/src/server/utils/hostPlatform.js');
require('../../../../bundles/fs.js');
require('node:path');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../../../playwright-core/src/server/utils/happyEyeballs.js');
require('../../../playwright-core/src/server/utils/nodePlatform.js');
const processLauncher = require('../../../playwright-core/src/server/utils/processLauncher.js');
require('../../../playwright-core/src/server/utils/profiler.js');
require('../../../playwright-core/src/server/utils/socksProxy.js');
require('node:child_process');
require('node:os');
require('../../../playwright-core/src/zipBundle.js');
require('../../../playwright-core/src/server/utils/zones.js');
const configLoader = require('../common/configLoader.js');
const globals = require('../common/globals.js');
const ipc = require('../common/ipc.js');
const util$1 = require('../util.js');
const fixtureRunner = require('./fixtureRunner.js');
const testInfo = require('./testInfo.js');
const util = require('./util.js');
const fixtures = require('../common/fixtures.js');
const poolBuilder = require('../common/poolBuilder.js');
const process$1 = require('../common/process.js');
const suiteUtils = require('../common/suiteUtils.js');
const testLoader = require('../../../../mocks/testLoader.js');

class WorkerMain extends process$1.ProcessRunner {
  constructor(params) {
    super();
    // Accumulated fatal errors that cannot be attributed to a test.
    this._fatalErrors = [];
    // The stage of the full cleanup. Once "finished", we can safely stop running anything.
    this._didRunFullCleanup = false;
    // Whether the worker was requested to stop.
    this._isStopped = false;
    // This promise resolves once the single "run test group" call finishes.
    this._runFinished = new manualPromise.ManualPromise();
    this._currentTest = null;
    this._lastRunningTests = [];
    this._totalRunningTests = 0;
    // Suites that had their beforeAll hooks, but not afterAll hooks executed.
    // These suites still need afterAll hooks to be executed for the proper cleanup.
    // Contains dynamic annotations originated by modifiers with a callback, e.g. `test.skip(() => true)`.
    this._activeSuites = /* @__PURE__ */ new Map();
    process.env.TEST_WORKER_INDEX = String(params.workerIndex);
    process.env.TEST_PARALLEL_INDEX = String(params.parallelIndex);
    this._params = params;
    this._fixtureRunner = new fixtureRunner.FixtureRunner();
    this._runFinished.resolve();
    process.on("unhandledRejection", (reason) => this.unhandledError(reason));
    process.on("uncaughtException", (error) => this.unhandledError(error));
    process.stdout.write = (chunk, cb) => {
      this.dispatchEvent("stdOut", ipc.stdioChunkToParams(chunk));
      this._currentTest?._tracing.appendStdioToTrace("stdout", chunk);
      if (typeof cb === "function")
        process.nextTick(cb);
      return true;
    };
    if (!process.env.PW_RUNNER_DEBUG) {
      process.stderr.write = (chunk, cb) => {
        this.dispatchEvent("stdErr", ipc.stdioChunkToParams(chunk));
        this._currentTest?._tracing.appendStdioToTrace("stderr", chunk);
        if (typeof cb === "function")
          process.nextTick(cb);
        return true;
      };
    }
  }
  _stop() {
    if (!this._isStopped) {
      this._isStopped = true;
      this._currentTest?._interrupt();
    }
    return this._runFinished;
  }
  async gracefullyClose() {
    try {
      await this._stop();
      if (!this._config) {
        return;
      }
      const fakeTestInfo = new testInfo.TestInfoImpl(this._config, this._project, this._params, void 0, 0, () => {
      }, () => {
      }, () => {
      });
      const runnable = { type: "teardown" };
      await fakeTestInfo._runWithTimeout(runnable, () => this._loadIfNeeded()).catch(() => {
      });
      await this._fixtureRunner.teardownScope("test", fakeTestInfo, runnable).catch(() => {
      });
      await this._fixtureRunner.teardownScope("worker", fakeTestInfo, runnable).catch(() => {
      });
      await fakeTestInfo._runWithTimeout(runnable, () => processLauncher.gracefullyCloseAll()).catch(() => {
      });
      this._fatalErrors.push(...fakeTestInfo.errors);
    } catch (e) {
      this._fatalErrors.push(util.testInfoError(e));
    }
    if (this._fatalErrors.length) {
      this._appendProcessTeardownDiagnostics(this._fatalErrors[this._fatalErrors.length - 1]);
      const payload = { fatalErrors: this._fatalErrors };
      this.dispatchEvent("teardownErrors", payload);
    }
  }
  _appendProcessTeardownDiagnostics(error) {
    if (!this._lastRunningTests.length)
      return;
    const count = this._totalRunningTests === 1 ? "1 test" : `${this._totalRunningTests} tests`;
    let lastMessage = "";
    if (this._lastRunningTests.length < this._totalRunningTests)
      lastMessage = `, last ${this._lastRunningTests.length} tests were`;
    const message = [
      "",
      "",
      utilsBundle.colors.red(`Failed worker ran ${count}${lastMessage}:`),
      ...this._lastRunningTests.map((test) => formatTestTitle(test, this._project.project.name))
    ].join("\n");
    if (error.message) {
      if (error.stack) {
        let index = error.stack.indexOf(error.message);
        if (index !== -1) {
          index += error.message.length;
          error.stack = error.stack.substring(0, index) + message + error.stack.substring(index);
        }
      }
      error.message += message;
    } else if (error.value) {
      error.value += message;
    }
  }
  unhandledError(error) {
    if (!this._currentTest) {
      if (!this._fatalErrors.length)
        this._fatalErrors.push(util.testInfoError(error));
      void this._stop();
      return;
    }
    if (!this._currentTest._hasUnhandledError) {
      this._currentTest._hasUnhandledError = true;
      this._currentTest._failWithError(error);
    }
    const isExpectError = error instanceof Error && !!error.matcherResult;
    const shouldContinueInThisWorker = this._currentTest.expectedStatus === "failed" && isExpectError;
    if (!shouldContinueInThisWorker)
      void this._stop();
  }
  async _loadIfNeeded() {
    if (this._config)
      return;
    const config = await configLoader.deserializeConfig(this._params.config);
    const project = config.projects.find((p) => p.id === this._params.projectId);
    if (!project)
      throw new Error(`Project "${this._params.projectId}" not found in the worker process. Make sure project name does not change.`);
    this._config = config;
    this._project = project;
    this._poolBuilder = poolBuilder.PoolBuilder.createForWorker(this._project);
  }
  async runTestGroup(runPayload) {
    this._runFinished = new manualPromise.ManualPromise();
    const entries = new Map(runPayload.entries.map((e) => [e.testId, e]));
    let fatalUnknownTestIds;
    try {
      await this._loadIfNeeded();
      const fileSuite = await testLoader.loadTestFile(runPayload.file, this._config.config.rootDir);
      const suite = suiteUtils.bindFileSuiteToProject(this._project, fileSuite);
      if (this._params.repeatEachIndex)
        suiteUtils.applyRepeatEachIndex(this._project, suite, this._params.repeatEachIndex);
      const hasEntries = suiteUtils.filterTestsRemoveEmptySuites(suite, (test) => entries.has(test.id));
      if (hasEntries) {
        this._poolBuilder.buildPools(suite);
        this._activeSuites = /* @__PURE__ */ new Map();
        this._didRunFullCleanup = false;
        const tests = suite.allTests();
        for (let i = 0; i < tests.length; i++) {
          if (this._isStopped && this._didRunFullCleanup)
            break;
          const entry = entries.get(tests[i].id);
          entries.delete(tests[i].id);
          util$1.debugTest(`test started "${tests[i].title}"`);
          await this._runTest(tests[i], entry.retry, tests[i + 1]);
          util$1.debugTest(`test finished "${tests[i].title}"`);
        }
      } else {
        fatalUnknownTestIds = runPayload.entries.map((e) => e.testId);
        void this._stop();
      }
    } catch (e) {
      this._fatalErrors.push(util.testInfoError(e));
      void this._stop();
    } finally {
      const donePayload = {
        fatalErrors: this._fatalErrors,
        skipTestsDueToSetupFailure: [],
        fatalUnknownTestIds
      };
      for (const test of this._skipRemainingTestsInSuite?.allTests() || []) {
        if (entries.has(test.id))
          donePayload.skipTestsDueToSetupFailure.push(test.id);
      }
      this.dispatchEvent("done", donePayload);
      this._fatalErrors = [];
      this._skipRemainingTestsInSuite = void 0;
      this._runFinished.resolve();
    }
  }
  async _runTest(test, retry, nextTest) {
    const testInfo$1 = new testInfo.TestInfoImpl(
      this._config,
      this._project,
      this._params,
      test,
      retry,
      (stepBeginPayload) => this.dispatchEvent("stepBegin", stepBeginPayload),
      (stepEndPayload) => this.dispatchEvent("stepEnd", stepEndPayload),
      (attachment) => this.dispatchEvent("attach", attachment)
    );
    const processAnnotation = (annotation) => {
      testInfo$1.annotations.push(annotation);
      switch (annotation.type) {
        case "fixme":
        case "skip":
          testInfo$1.expectedStatus = "skipped";
          break;
        case "fail":
          if (testInfo$1.expectedStatus !== "skipped")
            testInfo$1.expectedStatus = "failed";
          break;
        case "slow":
          testInfo$1._timeoutManager.slow();
          break;
      }
    };
    if (!this._isStopped)
      this._fixtureRunner.setPool(test._pool);
    const suites = getSuites(test);
    const reversedSuites = suites.slice().reverse();
    const nextSuites = new Set(getSuites(nextTest));
    testInfo$1._timeoutManager.setTimeout(test.timeout);
    for (const annotation of test.annotations)
      processAnnotation(annotation);
    for (const suite of suites) {
      const extraAnnotations = this._activeSuites.get(suite) || [];
      for (const annotation of extraAnnotations)
        processAnnotation(annotation);
    }
    this._currentTest = testInfo$1;
    globals.setCurrentTestInfo(testInfo$1);
    this.dispatchEvent("testBegin", buildTestBeginPayload(testInfo$1));
    const isSkipped = testInfo$1.expectedStatus === "skipped";
    const hasAfterAllToRunBeforeNextTest = reversedSuites.some((suite) => {
      return this._activeSuites.has(suite) && !nextSuites.has(suite) && suite._hooks.some((hook) => hook.type === "afterAll");
    });
    if (isSkipped && nextTest && !hasAfterAllToRunBeforeNextTest) {
      testInfo$1.status = "skipped";
      this.dispatchEvent("testEnd", buildTestEndPayload(testInfo$1));
      return;
    }
    this._totalRunningTests++;
    this._lastRunningTests.push(test);
    if (this._lastRunningTests.length > 10)
      this._lastRunningTests.shift();
    let shouldRunAfterEachHooks = false;
    testInfo$1._allowSkips = true;
    await (async () => {
      await testInfo$1._runWithTimeout({ type: "test" }, async () => {
        const traceFixtureRegistration = test._pool.resolve("trace");
        if (!traceFixtureRegistration)
          return;
        if (typeof traceFixtureRegistration.fn === "function")
          throw new Error(`"trace" option cannot be a function`);
        await testInfo$1._tracing.startIfNeeded(traceFixtureRegistration.fn);
      });
      if (this._isStopped || isSkipped) {
        testInfo$1.status = "skipped";
        return;
      }
      await fileUtils.removeFolders([testInfo$1.outputDir]);
      let testFunctionParams = null;
      await testInfo$1._runAsStep({ title: "Before Hooks", category: "hook" }, async () => {
        for (const suite of suites)
          await this._runBeforeAllHooksForSuite(suite, testInfo$1);
        shouldRunAfterEachHooks = true;
        await this._runEachHooksForSuites(suites, "beforeEach", testInfo$1);
        testFunctionParams = await this._fixtureRunner.resolveParametersForFunction(test.fn, testInfo$1, "test", { type: "test" });
      });
      if (testFunctionParams === null) {
        return;
      }
      await testInfo$1._runWithTimeout({ type: "test" }, async () => {
        const fn = test.fn;
        await fn(testFunctionParams, testInfo$1);
      });
    })().catch(() => {
    });
    testInfo$1.duration = testInfo$1._timeoutManager.defaultSlot().elapsed | 0;
    testInfo$1._allowSkips = true;
    const afterHooksTimeout = calculateMaxTimeout(this._project.project.timeout, testInfo$1.timeout);
    const afterHooksSlot = { timeout: afterHooksTimeout, elapsed: 0 };
    await testInfo$1._runAsStep({ title: "After Hooks", category: "hook" }, async () => {
      let firstAfterHooksError;
      try {
        await testInfo$1._runWithTimeout({ type: "test", slot: afterHooksSlot }, async () => testInfo$1._onDidFinishTestFunction?.());
      } catch (error) {
        firstAfterHooksError = firstAfterHooksError ?? error;
      }
      try {
        if (shouldRunAfterEachHooks)
          await this._runEachHooksForSuites(reversedSuites, "afterEach", testInfo$1, afterHooksSlot);
      } catch (error) {
        firstAfterHooksError = firstAfterHooksError ?? error;
      }
      testInfo$1._tracing.didFinishTestFunctionAndAfterEachHooks();
      try {
        await this._fixtureRunner.teardownScope("test", testInfo$1, { type: "test", slot: afterHooksSlot });
      } catch (error) {
        firstAfterHooksError = firstAfterHooksError ?? error;
      }
      for (const suite of reversedSuites) {
        if (!nextSuites.has(suite) || testInfo$1._isFailure()) {
          try {
            await this._runAfterAllHooksForSuite(suite, testInfo$1);
          } catch (error) {
            firstAfterHooksError = firstAfterHooksError ?? error;
          }
        }
      }
      if (firstAfterHooksError)
        throw firstAfterHooksError;
    }).catch(() => {
    });
    if (testInfo$1._isFailure())
      this._isStopped = true;
    if (this._isStopped) {
      this._didRunFullCleanup = true;
      await testInfo$1._runAsStep({ title: "Worker Cleanup", category: "hook" }, async () => {
        let firstWorkerCleanupError;
        const teardownSlot = { timeout: this._project.project.timeout, elapsed: 0 };
        try {
          await this._fixtureRunner.teardownScope("test", testInfo$1, { type: "test", slot: teardownSlot });
        } catch (error) {
          firstWorkerCleanupError = firstWorkerCleanupError ?? error;
        }
        for (const suite of reversedSuites) {
          try {
            await this._runAfterAllHooksForSuite(suite, testInfo$1);
          } catch (error) {
            firstWorkerCleanupError = firstWorkerCleanupError ?? error;
          }
        }
        try {
          await this._fixtureRunner.teardownScope("worker", testInfo$1, { type: "teardown", slot: teardownSlot });
        } catch (error) {
          firstWorkerCleanupError = firstWorkerCleanupError ?? error;
        }
        if (firstWorkerCleanupError)
          throw firstWorkerCleanupError;
      }).catch(() => {
      });
    }
    const tracingSlot = { timeout: this._project.project.timeout, elapsed: 0 };
    await testInfo$1._runWithTimeout({ type: "test", slot: tracingSlot }, async () => {
      await testInfo$1._tracing.stopIfNeeded();
    }).catch(() => {
    });
    testInfo$1.duration = testInfo$1._timeoutManager.defaultSlot().elapsed + afterHooksSlot.elapsed | 0;
    this._currentTest = null;
    globals.setCurrentTestInfo(null);
    this.dispatchEvent("testEnd", buildTestEndPayload(testInfo$1));
    const preserveOutput = this._config.config.preserveOutput === "always" || this._config.config.preserveOutput === "failures-only" && testInfo$1._isFailure();
    if (!preserveOutput)
      await fileUtils.removeFolders([testInfo$1.outputDir]);
  }
  _collectHooksAndModifiers(suite, type, testInfo) {
    const runnables = [];
    for (const modifier of suite._modifiers) {
      const modifierType = this._fixtureRunner.dependsOnWorkerFixturesOnly(modifier.fn, modifier.location) ? "beforeAll" : "beforeEach";
      if (modifierType !== type)
        continue;
      const fn = async (fixtures) => {
        const result = await modifier.fn(fixtures);
        testInfo._modifier(modifier.type, modifier.location, [!!result, modifier.description]);
      };
      fixtures.inheritFixtureNames(modifier.fn, fn);
      runnables.push({
        title: `${modifier.type} modifier`,
        location: modifier.location,
        type: modifier.type,
        fn
      });
    }
    runnables.push(...suite._hooks.filter((hook) => hook.type === type));
    return runnables;
  }
  async _runBeforeAllHooksForSuite(suite, testInfo) {
    if (this._activeSuites.has(suite))
      return;
    const extraAnnotations = [];
    this._activeSuites.set(suite, extraAnnotations);
    await this._runAllHooksForSuite(suite, testInfo, "beforeAll", extraAnnotations);
  }
  async _runAllHooksForSuite(suite, testInfo$1, type, extraAnnotations) {
    let firstError;
    for (const hook of this._collectHooksAndModifiers(suite, type, testInfo$1)) {
      try {
        await testInfo$1._runAsStep({ title: hook.title, category: "hook", location: hook.location }, async () => {
          const timeSlot = { timeout: this._project.project.timeout, elapsed: 0 };
          const runnable = { type: hook.type, slot: timeSlot, location: hook.location };
          const existingAnnotations = new Set(testInfo$1.annotations);
          try {
            await this._fixtureRunner.resolveParametersAndRunFunction(hook.fn, testInfo$1, "all-hooks-only", runnable);
          } finally {
            if (extraAnnotations) {
              const newAnnotations = testInfo$1.annotations.filter((a) => !existingAnnotations.has(a));
              extraAnnotations.push(...newAnnotations);
            }
            await this._fixtureRunner.teardownScope("test", testInfo$1, runnable);
          }
        });
      } catch (error) {
        firstError = firstError ?? error;
        if (type === "beforeAll" && error instanceof testInfo.TestSkipError)
          break;
        if (type === "beforeAll" && !this._skipRemainingTestsInSuite) {
          this._skipRemainingTestsInSuite = suite;
        }
      }
    }
    if (firstError)
      throw firstError;
  }
  async _runAfterAllHooksForSuite(suite, testInfo) {
    if (!this._activeSuites.has(suite))
      return;
    this._activeSuites.delete(suite);
    await this._runAllHooksForSuite(suite, testInfo, "afterAll");
  }
  async _runEachHooksForSuites(suites, type, testInfo$1, slot) {
    let firstError;
    const hooks = suites.map((suite) => this._collectHooksAndModifiers(suite, type, testInfo$1)).flat();
    for (const hook of hooks) {
      const runnable = { type: hook.type, location: hook.location, slot };
      if (testInfo$1._timeoutManager.isTimeExhaustedFor(runnable)) {
        continue;
      }
      try {
        await testInfo$1._runAsStep({ title: hook.title, category: "hook", location: hook.location }, async () => {
          await this._fixtureRunner.resolveParametersAndRunFunction(hook.fn, testInfo$1, "test", runnable);
        });
      } catch (error) {
        firstError = firstError ?? error;
        if (error instanceof testInfo.TestSkipError)
          break;
      }
    }
    if (firstError)
      throw firstError;
  }
}
function buildTestBeginPayload(testInfo) {
  return {
    testId: testInfo.testId,
    startWallTime: testInfo._startWallTime
  };
}
function buildTestEndPayload(testInfo) {
  return {
    testId: testInfo.testId,
    duration: testInfo.duration,
    status: testInfo.status,
    errors: testInfo.errors,
    hasNonRetriableError: testInfo._hasNonRetriableError,
    expectedStatus: testInfo.expectedStatus,
    annotations: testInfo.annotations,
    timeout: testInfo.timeout
  };
}
function getSuites(test) {
  const suites = [];
  for (let suite = test?.parent; suite; suite = suite.parent)
    suites.push(suite);
  suites.reverse();
  return suites;
}
function formatTestTitle(test, projectName) {
  const [, ...titles] = test.titlePath();
  const location = `${util$1.relativeFilePath(test.location.file)}:${test.location.line}:${test.location.column}`;
  const projectTitle = projectName ? `[${projectName}] › ` : "";
  return `${projectTitle}${location} › ${titles.join(" › ")}`;
}
function calculateMaxTimeout(t1, t2) {
  return !t1 || !t2 ? 0 : Math.max(t1, t2);
}

exports.WorkerMain = WorkerMain;
