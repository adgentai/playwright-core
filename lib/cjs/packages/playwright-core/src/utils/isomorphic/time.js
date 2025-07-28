'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

let _timeOrigin = performance.timeOrigin;
let _timeShift = 0;
function setTimeOrigin(origin) {
  _timeOrigin = origin;
  _timeShift = performance.timeOrigin - origin;
}
function timeOrigin() {
  return _timeOrigin;
}
function monotonicTime() {
  return Math.floor((performance.now() + _timeShift) * 1e3) / 1e3;
}
const DEFAULT_PLAYWRIGHT_TIMEOUT = 3e4;
const DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT = 3 * 60 * 1e3;

exports.DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT = DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT;
exports.DEFAULT_PLAYWRIGHT_TIMEOUT = DEFAULT_PLAYWRIGHT_TIMEOUT;
exports.monotonicTime = monotonicTime;
exports.setTimeOrigin = setTimeOrigin;
exports.timeOrigin = timeOrigin;
