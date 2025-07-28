'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const utilsBundleImpl = require('../../../_virtual/utilsBundleImpl.js');

const colors = utilsBundleImpl.default.colors;
const debug = utilsBundleImpl.default.debug;
const diff = utilsBundleImpl.default.diff;
const dotenv = utilsBundleImpl.default.dotenv;
const getProxyForUrl = utilsBundleImpl.default.getProxyForUrl;
const HttpsProxyAgent = utilsBundleImpl.default.HttpsProxyAgent;
const jpegjs = utilsBundleImpl.default.jpegjs;
const lockfile = utilsBundleImpl.default.lockfile;
const mime = utilsBundleImpl.default.mime;
const minimatch = utilsBundleImpl.default.minimatch;
const open = utilsBundleImpl.default.open;
const PNG = utilsBundleImpl.default.PNG;
const program = utilsBundleImpl.default.program;
const progress = utilsBundleImpl.default.progress;
const SocksProxyAgent = utilsBundleImpl.default.SocksProxyAgent;
const yaml = utilsBundleImpl.default.yaml;
const ws = utilsBundleImpl.default.ws;
const wsServer = utilsBundleImpl.default.wsServer;
const wsReceiver = utilsBundleImpl.default.wsReceiver;
const wsSender = utilsBundleImpl.default.wsSender;
function ms(ms2) {
  if (!isFinite(ms2))
    return "-";
  if (ms2 === 0)
    return "0ms";
  if (ms2 < 1e3)
    return ms2.toFixed(0) + "ms";
  const seconds = ms2 / 1e3;
  if (seconds < 60)
    return seconds.toFixed(1) + "s";
  const minutes = seconds / 60;
  if (minutes < 60)
    return minutes.toFixed(1) + "m";
  const hours = minutes / 60;
  if (hours < 24)
    return hours.toFixed(1) + "h";
  const days = hours / 24;
  return days.toFixed(1) + "d";
}

exports.HttpsProxyAgent = HttpsProxyAgent;
exports.PNG = PNG;
exports.SocksProxyAgent = SocksProxyAgent;
exports.colors = colors;
exports.debug = debug;
exports.diff = diff;
exports.dotenv = dotenv;
exports.getProxyForUrl = getProxyForUrl;
exports.jpegjs = jpegjs;
exports.lockfile = lockfile;
exports.mime = mime;
exports.minimatch = minimatch;
exports.ms = ms;
exports.open = open;
exports.program = program;
exports.progress = progress;
exports.ws = ws;
exports.wsReceiver = wsReceiver;
exports.wsSender = wsSender;
exports.wsServer = wsServer;
exports.yaml = yaml;
