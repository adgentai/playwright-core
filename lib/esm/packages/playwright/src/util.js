import { commonjsRequire } from '../../../_virtual/_commonjs-dynamic-modules.js';
import fs from '../../../bundles/fs.js';
import path from 'node:path';
import 'node:url';
import require$$0$2__default from 'node:util';
import { isString, escapeWithQuotes } from '../../playwright-core/src/utils/isomorphic/stringUtils.js';
import { parseStackFrame, stringifyStackFrames } from '../../playwright-core/src/utils/isomorphic/stackTrace.js';
import '../../../_virtual/pixelmatch.js';
import { debug, mime, colors } from '../../playwright-core/src/utilsBundle.js';
import { calculateSha1 } from '../../playwright-core/src/server/utils/crypto.js';
import '../../playwright-core/src/server/utils/debug.js';
import '../../playwright-core/src/server/utils/debugLogger.js';
import { sanitizeForFilePath } from '../../playwright-core/src/server/utils/fileUtils.js';
import '../../playwright-core/src/server/utils/hostPlatform.js';
import 'node:http';
import 'node:http2';
import 'node:https';
import '../../playwright-core/src/server/utils/happyEyeballs.js';
import '../../playwright-core/src/server/utils/nodePlatform.js';
import 'node:child_process';
import 'node:readline';
import '../../playwright-core/src/server/utils/profiler.js';
import '../../playwright-core/src/server/utils/socksProxy.js';
import 'node:os';
import '../../playwright-core/src/zipBundle.js';
import '../../playwright-core/src/server/utils/zones.js';

const PLAYWRIGHT_TEST_PATH = ".";
const PLAYWRIGHT_CORE_PATH = ".";
function filterStackTrace(e) {
  const name = e.name ? e.name + ": " : "";
  const cause = e.cause instanceof Error ? filterStackTrace(e.cause) : void 0;
  if (process.env.PWDEBUGIMPL)
    return { message: name + e.message, stack: e.stack || "", cause };
  const stackLines = stringifyStackFrames(filteredStackTrace(e.stack?.split("\n") || []));
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
    const frame = parseStackFrame(line, path.sep, !!process.env.PWDEBUGIMPL);
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
    value: require$$0$2__default.inspect(error)
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
  const hash = calculateSha1(s);
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
  return sanitizeForFilePath(base) + ext;
}
function getContainedPath(parentPath, subPath = "") {
  const resolvedPath = path.resolve(parentPath, subPath);
  if (resolvedPath === parentPath || resolvedPath.startsWith(parentPath + path.sep))
    return resolvedPath;
  return null;
}
const debugTest = debug("pw:test");
const callLogText = (log) => {
  if (!log || !log.some((l) => !!l))
    return "";
  return `
Call log:
${colors.dim(log.join("\n"))}
`;
};
const folderToPackageJsonPath = /* @__PURE__ */ new Map();
function getPackageJsonPath(folderPath) {
  const cached = folderToPackageJsonPath.get(folderPath);
  if (cached !== void 0)
    return cached;
  const packageJsonPath = path.join(folderPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
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
    const hash = calculateSha1(options.path);
    if (!isString(name))
      throw new Error('"name" should be string.');
    const sanitizedNamePrefix = sanitizeForFilePath(name) + "-";
    const dest = path.join(outputPath, "attachments", sanitizedNamePrefix + hash + path.extname(options.path));
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.copyFile(options.path, dest);
    const contentType = options.contentType ?? (mime.getType(path.basename(options.path)) || "application/octet-stream");
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
  return commonjsRequire(packageJsonPath).type === "module";
}
async function fileExistsAsync(resolved) {
  try {
    const stat = await fs.promises.stat(resolved);
    return stat.isFile();
  } catch {
    return false;
  }
}
function stepTitle(category, title) {
  switch (category) {
    case "fixture":
      return `Fixture ${escapeWithQuotes(title, '"')}`;
    case "expect":
      return `Expect ${escapeWithQuotes(title, '"')}`;
    case "test.step":
      return title;
    case "test.attach":
      return `Attach ${escapeWithQuotes(title, '"')}`;
    case "hook":
    case "pw:api":
      return title;
    default:
      return `[${category}] ${title}`;
  }
}

export { addSuffixToFilePath, callLogText, debugTest, errorWithFile, expectTypes, fileExistsAsync, fileIsModule, filterStackFile, filterStackTrace, filteredStackTrace, formatLocation, getContainedPath, getPackageJsonPath, mergeObjects, normalizeAndSaveAttachment, relativeFilePath, sanitizeFilePathBeforeExtension, serializeError, stepTitle, trimLongString, windowsFilesystemFriendlyLength };
