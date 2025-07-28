'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('./bundles/fs.js');
const locatorGenerators = require('./packages/playwright-core/src/utils/isomorphic/locatorGenerators.js');
const manualPromise = require('./packages/playwright-core/src/utils/isomorphic/manualPromise.js');
const protocolFormatter = require('./packages/playwright-core/src/utils/isomorphic/protocolFormatter.js');
const time = require('./packages/playwright-core/src/utils/isomorphic/time.js');
require('./_virtual/pixelmatch.js');
const utilsBundle = require('./packages/playwright-core/src/utilsBundle.js');
require('node:crypto');
const debug = require('./packages/playwright-core/src/server/utils/debug.js');
require('./packages/playwright-core/src/server/utils/debugLogger.js');
require('node:path');
const zipBundle = require('./packages/playwright-core/src/zipBundle.js');
require('./packages/playwright-core/src/server/utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./packages/playwright-core/src/server/utils/happyEyeballs.js');
require('./packages/playwright-core/src/server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./packages/playwright-core/src/server/utils/profiler.js');
require('./packages/playwright-core/src/server/utils/socksProxy.js');
require('node:os');
const zones = require('./packages/playwright-core/src/server/utils/zones.js');
const configLoader = require('./packages/playwright/src/common/configLoader.js');
const globals = require('./packages/playwright/src/common/globals.js');
const suiteUtils = require('./packages/playwright/src/common/suiteUtils.js');
const test = require('./packages/playwright/src/common/test.js');
const testType = require('./packages/playwright/src/common/testType.js');
const workerMain = require('./packages/playwright/src/worker/workerMain.js');
const unsupportedOperations = require('./cloudflare/unsupportedOperations.js');
const index = require('./index.js');
const util = require('./packages/playwright/src/util.js');

const _baseTest = testType.rootTestType.test;
const _rootSuites = [];
function setCurrentTestFile(file) {
  if (!file) {
    globals.setCurrentlyLoadingFileSuite(void 0);
    return;
  }
  const suite = new test.Suite(file, "file");
  suite._requireFile = file;
  suite.location = { file, line: 0, column: 0 };
  globals.setCurrentlyLoadingFileSuite(suite);
  _rootSuites.push(suite);
}
function toInfo(test$1) {
  if (test$1 instanceof test.Suite) {
    return {
      type: test$1._type,
      file: test$1._requireFile,
      title: test$1.title,
      fullTitle: test$1.titlePath().join(" > "),
      entries: test$1._entries.map(toInfo)
    };
  } else if (test$1 instanceof test.TestCase) {
    return {
      type: "test",
      file: test$1._requireFile,
      title: test$1.title,
      fullTitle: test$1.titlePath().join(" > "),
      testId: test$1.id
    };
  }
  throw new Error("Invalid test");
}
const playwrightTestConfig = {
  projects: [
    {
      timeout: 5e3,
      name: "chromium"
    }
  ]
};
const configLocation = {
  resolvedConfigFile: "/tmp/workerTests/playwright.config.ts",
  configDir: "/tmp/workerTests"
};
async function bindSuites() {
  const fullConfig = await configLoader.loadConfig(configLocation);
  const [project] = fullConfig.projects;
  return _rootSuites.map((s) => suiteUtils.bindFileSuiteToProject(project, s));
}
async function testSuites() {
  const suites = await bindSuites();
  return suites.map(toInfo);
}
class TestWorker extends workerMain.WorkerMain {
  constructor(options) {
    super({
      workerIndex: 0,
      parallelIndex: 0,
      repeatEachIndex: 0,
      projectId: playwrightTestConfig.projects[0].name,
      config: {
        location: configLocation,
        configCLIOverrides: {
          timeout: 5e3,
          ...options
        }
      },
      artifactsDir: `/tmp/tests`
    });
    this._donePromise = new manualPromise.ManualPromise();
    this._attachments = [];
  }
  async testResult() {
    return await this._donePromise;
  }
  dispatchEvent(method, params) {
    if (method === "attach") {
      const { name, body, path, contentType } = params;
      let fileContent;
      if (!body) {
        if (!path)
          throw new Error("Either body or path must be provided");
        if (!fs.default.existsSync(path))
          throw new Error(`File does not exist: ${path}`);
        fileContent = fs.default.readFileSync(path, "base64");
      }
      this._attachments.push({ name, body: body ?? fileContent, contentType });
    }
    if (method === "testEnd")
      this._testResult = params;
    if (method === "done") {
      if (!this._testResult) {
        this._testResult = {
          testId: params.testId,
          errors: params.fatalErrors ?? [],
          annotations: [],
          expectedStatus: "passed",
          status: "failed",
          hasNonRetriableError: false,
          duration: 0,
          timeout: 0
        };
      }
      this._donePromise.resolve({
        ...this._testResult,
        attachments: this._attachments
      });
    }
  }
}
let context;
function currentTestContext() {
  if (!context)
    throw new Error(`Test context not initialized`);
  return context;
}
class TestRunner {
  constructor(testContext, options) {
    this._testContext = testContext;
    this._options = options;
  }
  async runTest(file, testId) {
    if (time.timeOrigin() === 0 && Date.now() !== 0)
      time.setTimeOrigin(Date.now());
    context = this._testContext;
    const testWorker = new TestWorker(this._options);
    try {
      const { retry } = this._testContext;
      const [result] = await Promise.all([
        testWorker.testResult(),
        testWorker.runTestGroup({ file, entries: [{ testId, retry }] })
      ]);
      if (result.status === "failed" && result.errors.some(unsupportedOperations.isUnsupportedOperationError)) {
        return {
          ...result,
          status: "skipped",
          expectedStatus: "skipped"
        };
      }
      return result;
    } finally {
      await testWorker.gracefullyClose();
      context = void 0;
    }
  }
}
const tracingGroupSteps = [];
const expectApiListener = {
  onApiCallBegin: (data, channel) => {
    const testInfo = globals.currentTestInfo();
    if (!testInfo || data.apiName.includes("setTestIdAttribute") || data.apiName === "tracing.groupEnd")
      return;
    const zone = zones.currentZone().data("stepZone");
    if (zone && zone.category === "expect") {
      if (zone.apiName)
        data.apiName = zone.apiName;
      if (zone.title)
        data.title = util.stepTitle(zone.category, zone.title);
      data.stepId = zone.stepId;
      return;
    }
    const step = testInfo._addStep({
      location: data.frames[0],
      category: "pw:api",
      title: renderTitle(channel.type, channel.method, channel.params, data.title),
      apiName: data.apiName,
      params: channel.params
    }, tracingGroupSteps[tracingGroupSteps.length - 1]);
    data.userData = step;
    data.stepId = step.stepId;
    if (data.apiName === "tracing.group")
      tracingGroupSteps.push(step);
  },
  onApiCallEnd: (data) => {
    if (data.apiName === "tracing.group")
      return;
    if (data.apiName === "tracing.groupEnd") {
      const step2 = tracingGroupSteps.pop();
      step2?.complete({ error: data.error });
      return;
    }
    const step = data.userData;
    step?.complete({ error: data.error });
  }
};
function renderTitle(type, method, params, title) {
  const prefix = protocolFormatter.renderTitleForCall({ title, type, method, params });
  let selector;
  if (params?.["selector"] && typeof params.selector === "string")
    selector = locatorGenerators.asLocatorDescription("javascript", params.selector);
  return prefix + (selector ? ` ${selector}` : "");
}
async function runWithExpectApiListener(fn) {
  index.default._instrumentation.addListener(expectApiListener);
  try {
    return await fn();
  } finally {
    index.default._instrumentation.removeListener(expectApiListener);
  }
}

exports.HttpsProxyAgent = utilsBundle.HttpsProxyAgent;
exports.PNG = utilsBundle.PNG;
exports.SocksProxyAgent = utilsBundle.SocksProxyAgent;
exports.colors = utilsBundle.colors;
exports.debug = utilsBundle.debug;
exports.diff = utilsBundle.diff;
exports.dotenv = utilsBundle.dotenv;
exports.getProxyForUrl = utilsBundle.getProxyForUrl;
exports.jpegjs = utilsBundle.jpegjs;
exports.lockfile = utilsBundle.lockfile;
exports.mime = utilsBundle.mime;
exports.minimatch = utilsBundle.minimatch;
exports.ms = utilsBundle.ms;
exports.open = utilsBundle.open;
exports.program = utilsBundle.program;
exports.progress = utilsBundle.progress;
exports.ws = utilsBundle.ws;
exports.wsReceiver = utilsBundle.wsReceiver;
exports.wsSender = utilsBundle.wsSender;
exports.wsServer = utilsBundle.wsServer;
exports.yaml = utilsBundle.yaml;
exports.isUnderTest = debug.isUnderTest;
exports.extract = zipBundle.extract;
exports.yauzl = zipBundle.yauzl;
exports.yazl = zipBundle.yazl;
exports.mergeTests = testType.mergeTests;
exports.TestRunner = TestRunner;
exports._baseTest = _baseTest;
exports._rootSuites = _rootSuites;
exports.configLocation = configLocation;
exports.currentTestContext = currentTestContext;
exports.playwrightTestConfig = playwrightTestConfig;
exports.runWithExpectApiListener = runWithExpectApiListener;
exports.setCurrentTestFile = setCurrentTestFile;
exports.testSuites = testSuites;
