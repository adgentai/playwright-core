'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const path = require('node:path');
require('../../../../_virtual/pixelmatch.js');
require('../../../playwright-core/src/utilsBundle.js');
const crypto = require('../../../playwright-core/src/server/utils/crypto.js');
require('../../../playwright-core/src/server/utils/debug.js');
require('../../../playwright-core/src/server/utils/debugLogger.js');
const fileUtils = require('../../../playwright-core/src/server/utils/fileUtils.js');
require('../../../playwright-core/src/server/utils/hostPlatform.js');
require('../../../../bundles/fs.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../../../playwright-core/src/server/utils/happyEyeballs.js');
require('../../../playwright-core/src/server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('../../../playwright-core/src/server/utils/profiler.js');
require('../../../playwright-core/src/server/utils/socksProxy.js');
require('node:os');
require('../../../playwright-core/src/zipBundle.js');
require('../../../playwright-core/src/server/utils/zones.js');
require('../util.js');

function filterTestsRemoveEmptySuites(suite, filter) {
  const filteredSuites = suite.suites.filter((child) => filterTestsRemoveEmptySuites(child, filter));
  const filteredTests = suite.tests.filter(filter);
  const entries = /* @__PURE__ */ new Set([...filteredSuites, ...filteredTests]);
  suite._entries = suite._entries.filter((e) => entries.has(e));
  return !!suite._entries.length;
}
function bindFileSuiteToProject(project, suite) {
  const relativeFile = path.relative(project.project.testDir, suite.location.file);
  const fileId = crypto.calculateSha1(fileUtils.toPosixPath(relativeFile)).slice(0, 20);
  const result = suite._deepClone();
  result._fileId = fileId;
  result.forEachTest((test, suite2) => {
    suite2._fileId = fileId;
    const [file, ...titles] = test.titlePath();
    const testIdExpression = `[project=${project.id}]${fileUtils.toPosixPath(file)}${titles.join("")}`;
    const testId = fileId + "-" + crypto.calculateSha1(testIdExpression).slice(0, 20);
    test.id = testId;
    test._projectId = project.id;
    let inheritedRetries;
    let inheritedTimeout;
    for (let parentSuite = suite2; parentSuite; parentSuite = parentSuite.parent) {
      if (parentSuite._staticAnnotations.length)
        test.annotations.unshift(...parentSuite._staticAnnotations);
      if (inheritedRetries === void 0 && parentSuite._retries !== void 0)
        inheritedRetries = parentSuite._retries;
      if (inheritedTimeout === void 0 && parentSuite._timeout !== void 0)
        inheritedTimeout = parentSuite._timeout;
    }
    test.retries = inheritedRetries ?? project.project.retries;
    test.timeout = inheritedTimeout ?? project.project.timeout;
    if (test.annotations.some((a) => a.type === "skip" || a.type === "fixme"))
      test.expectedStatus = "skipped";
    if (test._poolDigest)
      test._workerHash = `${project.id}-${test._poolDigest}-0`;
  });
  return result;
}
function applyRepeatEachIndex(project, fileSuite, repeatEachIndex) {
  fileSuite.forEachTest((test, suite) => {
    if (repeatEachIndex) {
      const [file, ...titles] = test.titlePath();
      const testIdExpression = `[project=${project.id}]${fileUtils.toPosixPath(file)}${titles.join("")} (repeat:${repeatEachIndex})`;
      const testId = suite._fileId + "-" + crypto.calculateSha1(testIdExpression).slice(0, 20);
      test.id = testId;
      test.repeatEachIndex = repeatEachIndex;
      if (test._poolDigest)
        test._workerHash = `${project.id}-${test._poolDigest}-${repeatEachIndex}`;
    }
  });
}

exports.applyRepeatEachIndex = applyRepeatEachIndex;
exports.bindFileSuiteToProject = bindFileSuiteToProject;
exports.filterTestsRemoveEmptySuites = filterTestsRemoveEmptySuites;
