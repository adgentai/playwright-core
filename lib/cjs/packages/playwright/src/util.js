'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const _commonjsDynamicModules = require('../../../_virtual/_commonjs-dynamic-modules.js');
const fs = require('../../../bundles/fs.js');
const path = require('node:path');
require('node:url');
const require$$0$2 = require('node:util');
const stringUtils = require('../../playwright-core/src/utils/isomorphic/stringUtils.js');
const stackTrace = require('../../playwright-core/src/utils/isomorphic/stackTrace.js');
require('../../../_virtual/pixelmatch.js');
const utilsBundle = require('../../playwright-core/src/utilsBundle.js');
const crypto = require('../../playwright-core/src/server/utils/crypto.js');
require('../../playwright-core/src/server/utils/debug.js');
require('../../playwright-core/src/server/utils/debugLogger.js');
const fileUtils = require('../../playwright-core/src/server/utils/fileUtils.js');
require('../../playwright-core/src/server/utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('../../playwright-core/src/server/utils/happyEyeballs.js');
require('../../playwright-core/src/server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('../../playwright-core/src/server/utils/profiler.js');
require('../../playwright-core/src/server/utils/socksProxy.js');
require('node:os');
require('../../playwright-core/src/zipBundle.js');
require('../../playwright-core/src/server/utils/zones.js');

const PLAYWRIGHT_TEST_PATH = ".";
const PLAYWRIGHT_CORE_PATH = ".";
function filterStackTrace(e) {
  const name = e.name ? e.name + ": " : "";
  const cause = e.cause instanceof Error ? filterStackTrace(e.cause) : void 0;
  if (process.env.PWDEBUGIMPL)
    return { message: name + e.message, stack: e.stack || "", cause };
  const stackLines = stackTrace.stringifyStackFrames(filteredStackTrace(e.stack?.split("\n") || []));
  return {
    message: name + e.message,
    stack: `${name}${e.message}${stackLines.map((line) => "\n" + line).join("")}`,
    cause
  };
}
function filterStackFile(file) {
  if (!process.env.PWDEBUGIMPL && file.startsWith(PLAYWRIGHT_TEST_PATH))
    return false;
  if (!process.env.PWDEBUGIMPL && file.startsWith(PLAYWRIGHT_CORE_PATH))
    return false;
  return true;
}
function filteredStackTrace(rawStack) {
  const frames = [];
  for (const line of rawStack) {
    const frame = stackTrace.parseStackFrame(line, path.sep, !!process.env.PWDEBUGIMPL);
    if (!frame || !frame.file)
      continue;
    if (!filterStackFile(frame.file))
      continue;
    frames.push(frame);
  }
  return frames;
}
function serializeError(error) {
  if (error instanceof Error)
    return filterStackTrace(error);
  return {
    value: require$$0$2.inspect(error)
  };
}
function mergeObjects(a, b, c) {
  const result = { ...a };
  for (const x of [b, c].filter(Boolean)) {
    for (const [name, value] of Object.entries(x)) {
      if (!Object.is(value, void 0))
        result[name] = value;
    }
  }
  return result;
}
function relativeFilePath(file) {
  if (!path.isAbsolute(file))
    return file;
  return path.relative(process.cwd(), file);
}
function formatLocation(location) {
  return relativeFilePath(location.file) + ":" + location.line + ":" + location.column;
}
function errorWithFile(file, message) {
  return new Error(`${relativeFilePath(file)}: ${message}`);
}
function expectTypes(receiver, types, matcherName) {
  if (typeof receiver !== "object" || !types.includes(receiver.constructor.name)) {
    const commaSeparated = types.slice();
    const lastType = commaSeparated.pop();
    const typesString = commaSeparated.length ? commaSeparated.join(", ") + " or " + lastType : lastType;
    throw new Error(`${matcherName} can be only used with ${typesString} object${types.length > 1 ? "s" : ""}`);
  }
}
const windowsFilesystemFriendlyLength = 60;
function trimLongString(s, length = 100) {
  if (s.length <= length)
    return s;
  const hash = crypto.calculateSha1(s);
  const middle = `-${hash.substring(0, 5)}-`;
  const start = Math.floor((length - middle.length) / 2);
  const end = length - middle.length - start;
  return s.substring(0, start) + middle + s.slice(-end);
}
function addSuffixToFilePath(filePath, suffix) {
  const ext = path.extname(filePath);
  const base = filePath.substring(0, filePath.length - ext.length);
  return base + suffix + ext;
}
function sanitizeFilePathBeforeExtension(filePath, ext) {
  ext ??= path.extname(filePath);
  const base = filePath.substring(0, filePath.length - ext.length);
  return fileUtils.sanitizeForFilePath(base) + ext;
}
function getContainedPath(parentPath, subPath = "") {
  const resolvedPath = path.resolve(parentPath, subPath);
  if (resolvedPath === parentPath || resolvedPath.startsWith(parentPath + path.sep))
    return resolvedPath;
  return null;
}
const debugTest = utilsBundle.debug("pw:test");
const callLogText = (log) => {
  if (!log || !log.some((l) => !!l))
    return "";
  return `
Call log:
${utilsBundle.colors.dim(log.join("\n"))}
`;
};
const folderToPackageJsonPath = /* @__PURE__ */ new Map();
function getPackageJsonPath(folderPath) {
  const cached = folderToPackageJsonPath.get(folderPath);
  if (cached !== void 0)
    return cached;
  const packageJsonPath = path.join(folderPath, "package.json");
  if (fs.default.existsSync(packageJsonPath)) {
    folderToPackageJsonPath.set(folderPath, packageJsonPath);
    return packageJsonPath;
  }
  const parentFolder = path.dirname(folderPath);
  if (folderPath === parentFolder) {
    folderToPackageJsonPath.set(folderPath, "");
    return "";
  }
  const result = getPackageJsonPath(parentFolder);
  folderToPackageJsonPath.set(folderPath, result);
  return result;
}
async function normalizeAndSaveAttachment(outputPath, name, options = {}) {
  if (options.path === void 0 && options.body === void 0)
    return { name, contentType: "text/plain" };
  if ((options.path !== void 0 ? 1 : 0) + (options.body !== void 0 ? 1 : 0) !== 1)
    throw new Error(`Exactly one of "path" and "body" must be specified`);
  if (options.path !== void 0) {
    const hash = crypto.calculateSha1(options.path);
    if (!stringUtils.isString(name))
      throw new Error('"name" should be string.');
    const sanitizedNamePrefix = fileUtils.sanitizeForFilePath(name) + "-";
    const dest = path.join(outputPath, "attachments", sanitizedNamePrefix + hash + path.extname(options.path));
    await fs.default.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.default.promises.copyFile(options.path, dest);
    const contentType = options.contentType ?? (utilsBundle.mime.getType(path.basename(options.path)) || "application/octet-stream");
    return { name, contentType, path: dest };
  } else {
    const contentType = options.contentType ?? (typeof options.body === "string" ? "text/plain" : "application/octet-stream");
    return { name, contentType, body: typeof options.body === "string" ? Buffer.from(options.body) : options.body };
  }
}
function fileIsModule(file) {
  if (file.endsWith(".mjs") || file.endsWith(".mts"))
    return true;
  if (file.endsWith(".cjs") || file.endsWith(".cts"))
    return false;
  const folder = path.dirname(file);
  return folderIsModule(folder);
}
function folderIsModule(folder) {
  const packageJsonPath = getPackageJsonPath(folder);
  if (!packageJsonPath)
    return false;
  return _commonjsDynamicModules.commonjsRequire(packageJsonPath).type === "module";
}
async function fileExistsAsync(resolved) {
  try {
    const stat = await fs.default.promises.stat(resolved);
    return stat.isFile();
  } catch {
    return false;
  }
}
function stepTitle(category, title) {
  switch (category) {
    case "fixture":
      return `Fixture ${stringUtils.escapeWithQuotes(title, '"')}`;
    case "expect":
      return `Expect ${stringUtils.escapeWithQuotes(title, '"')}`;
    case "test.step":
      return title;
    case "test.attach":
      return `Attach ${stringUtils.escapeWithQuotes(title, '"')}`;
    case "hook":
    case "pw:api":
      return title;
    default:
      return `[${category}] ${title}`;
  }
}

exports.addSuffixToFilePath = addSuffixToFilePath;
exports.callLogText = callLogText;
exports.debugTest = debugTest;
exports.errorWithFile = errorWithFile;
exports.expectTypes = expectTypes;
exports.fileExistsAsync = fileExistsAsync;
exports.fileIsModule = fileIsModule;
exports.filterStackFile = filterStackFile;
exports.filterStackTrace = filterStackTrace;
exports.filteredStackTrace = filteredStackTrace;
exports.formatLocation = formatLocation;
exports.getContainedPath = getContainedPath;
exports.getPackageJsonPath = getPackageJsonPath;
exports.mergeObjects = mergeObjects;
exports.normalizeAndSaveAttachment = normalizeAndSaveAttachment;
exports.relativeFilePath = relativeFilePath;
exports.sanitizeFilePathBeforeExtension = sanitizeFilePathBeforeExtension;
exports.serializeError = serializeError;
exports.stepTitle = stepTitle;
exports.trimLongString = trimLongString;
exports.windowsFilesystemFriendlyLength = windowsFilesystemFriendlyLength;
