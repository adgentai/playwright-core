'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

class WebError {
  constructor(page, error) {
    this._page = page;
    this._error = error;
  }
  page() {
    return this._page;
  }
  error() {
    return this._error;
  }
}

exports.WebError = WebError;
