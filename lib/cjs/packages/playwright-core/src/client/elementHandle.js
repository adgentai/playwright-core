'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const frame = require('./frame.js');
const jsHandle = require('./jsHandle.js');
const assert = require('../utils/isomorphic/assert.js');
const fileUtils = require('./fileUtils.js');
const stringUtils = require('../utils/isomorphic/stringUtils.js');
const writableStream = require('./writableStream.js');
const mimeType = require('../utils/isomorphic/mimeType.js');

class ElementHandle extends jsHandle.JSHandle {
  static from(handle) {
    return handle._object;
  }
  static fromNullable(handle) {
    return handle ? ElementHandle.from(handle) : null;
  }
  constructor(parent, type, guid, initializer) {
    super(parent, type, guid, initializer);
    this._frame = parent;
    this._elementChannel = this._channel;
  }
  asElement() {
    return this;
  }
  async ownerFrame() {
    return frame.Frame.fromNullable((await this._elementChannel.ownerFrame()).frame);
  }
  async contentFrame() {
    return frame.Frame.fromNullable((await this._elementChannel.contentFrame()).frame);
  }
  async getAttribute(name) {
    const value = (await this._elementChannel.getAttribute({ name })).value;
    return value === void 0 ? null : value;
  }
  async inputValue() {
    return (await this._elementChannel.inputValue()).value;
  }
  async textContent() {
    const value = (await this._elementChannel.textContent()).value;
    return value === void 0 ? null : value;
  }
  async innerText() {
    return (await this._elementChannel.innerText()).value;
  }
  async innerHTML() {
    return (await this._elementChannel.innerHTML()).value;
  }
  async isChecked() {
    return (await this._elementChannel.isChecked()).value;
  }
  async isDisabled() {
    return (await this._elementChannel.isDisabled()).value;
  }
  async isEditable() {
    return (await this._elementChannel.isEditable()).value;
  }
  async isEnabled() {
    return (await this._elementChannel.isEnabled()).value;
  }
  async isHidden() {
    return (await this._elementChannel.isHidden()).value;
  }
  async isVisible() {
    return (await this._elementChannel.isVisible()).value;
  }
  async dispatchEvent(type, eventInit = {}) {
    await this._elementChannel.dispatchEvent({ type, eventInit: jsHandle.serializeArgument(eventInit) });
  }
  async scrollIntoViewIfNeeded(options = {}) {
    await this._elementChannel.scrollIntoViewIfNeeded({ ...options, timeout: this._frame._timeout(options) });
  }
  async hover(options = {}) {
    await this._elementChannel.hover({ ...options, timeout: this._frame._timeout(options) });
  }
  async click(options = {}) {
    return await this._elementChannel.click({ ...options, timeout: this._frame._timeout(options) });
  }
  async dblclick(options = {}) {
    return await this._elementChannel.dblclick({ ...options, timeout: this._frame._timeout(options) });
  }
  async tap(options = {}) {
    return await this._elementChannel.tap({ ...options, timeout: this._frame._timeout(options) });
  }
  async selectOption(values, options = {}) {
    const result = await this._elementChannel.selectOption({ ...convertSelectOptionValues(values), ...options, timeout: this._frame._timeout(options) });
    return result.values;
  }
  async fill(value, options = {}) {
    return await this._elementChannel.fill({ value, ...options, timeout: this._frame._timeout(options) });
  }
  async selectText(options = {}) {
    await this._elementChannel.selectText({ ...options, timeout: this._frame._timeout(options) });
  }
  async setInputFiles(files, options = {}) {
    const frame = await this.ownerFrame();
    if (!frame)
      throw new Error("Cannot set input files to detached element");
    const converted = await convertInputFiles(this._platform, files, frame.page().context());
    await this._elementChannel.setInputFiles({ ...converted, ...options, timeout: this._frame._timeout(options) });
  }
  async focus() {
    await this._elementChannel.focus();
  }
  async type(text, options = {}) {
    await this._elementChannel.type({ text, ...options, timeout: this._frame._timeout(options) });
  }
  async press(key, options = {}) {
    await this._elementChannel.press({ key, ...options, timeout: this._frame._timeout(options) });
  }
  async check(options = {}) {
    return await this._elementChannel.check({ ...options, timeout: this._frame._timeout(options) });
  }
  async uncheck(options = {}) {
    return await this._elementChannel.uncheck({ ...options, timeout: this._frame._timeout(options) });
  }
  async setChecked(checked, options) {
    if (checked)
      await this.check(options);
    else
      await this.uncheck(options);
  }
  async boundingBox() {
    const value = (await this._elementChannel.boundingBox()).value;
    return value === void 0 ? null : value;
  }
  async screenshot(options = {}) {
    const mask = options.mask;
    const copy = { ...options, mask: void 0, timeout: this._frame._timeout(options) };
    if (!copy.type)
      copy.type = determineScreenshotType(options);
    if (mask) {
      copy.mask = mask.map((locator) => ({
        frame: locator._frame._channel,
        selector: locator._selector
      }));
    }
    const result = await this._elementChannel.screenshot(copy);
    if (options.path) {
      await fileUtils.mkdirIfNeeded(this._platform, options.path);
      await this._platform.fs().promises.writeFile(options.path, result.binary);
    }
    return result.binary;
  }
  async $(selector) {
    return ElementHandle.fromNullable((await this._elementChannel.querySelector({ selector })).element);
  }
  async $$(selector) {
    const result = await this._elementChannel.querySelectorAll({ selector });
    return result.elements.map((h) => ElementHandle.from(h));
  }
  async $eval(selector, pageFunction, arg) {
    const result = await this._elementChannel.evalOnSelector({ selector, expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.parseResult(result.value);
  }
  async $$eval(selector, pageFunction, arg) {
    const result = await this._elementChannel.evalOnSelectorAll({ selector, expression: String(pageFunction), isFunction: typeof pageFunction === "function", arg: jsHandle.serializeArgument(arg) });
    return jsHandle.parseResult(result.value);
  }
  async waitForElementState(state, options = {}) {
    return await this._elementChannel.waitForElementState({ state, ...options, timeout: this._frame._timeout(options) });
  }
  async waitForSelector(selector, options = {}) {
    const result = await this._elementChannel.waitForSelector({ selector, ...options, timeout: this._frame._timeout(options) });
    return ElementHandle.fromNullable(result.element);
  }
}
function convertSelectOptionValues(values) {
  if (values === null)
    return {};
  if (!Array.isArray(values))
    values = [values];
  if (!values.length)
    return {};
  for (let i = 0; i < values.length; i++)
    assert.assert(values[i] !== null, `options[${i}]: expected object, got null`);
  if (values[0] instanceof ElementHandle)
    return { elements: values.map((v) => v._elementChannel) };
  if (stringUtils.isString(values[0]))
    return { options: values.map((valueOrLabel) => ({ valueOrLabel })) };
  return { options: values };
}
function filePayloadExceedsSizeLimit(payloads) {
  return payloads.reduce((size, item) => size + (item.buffer ? item.buffer.byteLength : 0), 0) >= fileUtils.fileUploadSizeLimit;
}
async function resolvePathsAndDirectoryForInputFiles(platform, items) {
  let localPaths;
  let localDirectory;
  for (const item of items) {
    const stat = await platform.fs().promises.stat(item);
    if (stat.isDirectory()) {
      if (localDirectory)
        throw new Error("Multiple directories are not supported");
      localDirectory = platform.path().resolve(item);
    } else {
      localPaths ??= [];
      localPaths.push(platform.path().resolve(item));
    }
  }
  if (localPaths?.length && localDirectory)
    throw new Error("File paths must be all files or a single directory");
  return [localPaths, localDirectory];
}
async function convertInputFiles(platform, files, context) {
  const items = Array.isArray(files) ? files.slice() : [files];
  if (items.some((item) => typeof item === "string")) {
    if (!items.every((item) => typeof item === "string"))
      throw new Error("File paths cannot be mixed with buffers");
    const [localPaths, localDirectory] = await resolvePathsAndDirectoryForInputFiles(platform, items);
    if (context._connection.isRemote()) {
      const files2 = localDirectory ? (await platform.fs().promises.readdir(localDirectory, { withFileTypes: true, recursive: true })).filter((f) => f.isFile()).map((f) => platform.path().join(f.path, f.name)) : localPaths;
      const { writableStreams, rootDir } = await context._wrapApiCall(async () => context._channel.createTempFiles({
        rootDirName: localDirectory ? platform.path().basename(localDirectory) : void 0,
        items: await Promise.all(files2.map(async (file) => {
          const lastModifiedMs = (await platform.fs().promises.stat(file)).mtimeMs;
          return {
            name: localDirectory ? platform.path().relative(localDirectory, file) : platform.path().basename(file),
            lastModifiedMs
          };
        }))
      }), { internal: true });
      for (let i = 0; i < files2.length; i++) {
        const writable = writableStream.WritableStream.from(writableStreams[i]);
        await platform.streamFile(files2[i], writable.stream());
      }
      return {
        directoryStream: rootDir,
        streams: localDirectory ? void 0 : writableStreams
      };
    }
    return {
      localPaths,
      localDirectory
    };
  }
  const payloads = items;
  if (filePayloadExceedsSizeLimit(payloads))
    throw new Error("Cannot set buffer larger than 50Mb, please write it to a file and pass its path instead.");
  return { payloads };
}
function determineScreenshotType(options) {
  if (options.path) {
    const mimeType$1 = mimeType.getMimeTypeForPath(options.path);
    if (mimeType$1 === "image/png")
      return "png";
    else if (mimeType$1 === "image/jpeg")
      return "jpeg";
    throw new Error(`path: unsupported mime type "${mimeType$1}"`);
  }
  return options.type;
}

exports.ElementHandle = ElementHandle;
exports.convertInputFiles = convertInputFiles;
exports.convertSelectOptionValues = convertSelectOptionValues;
exports.determineScreenshotType = determineScreenshotType;
