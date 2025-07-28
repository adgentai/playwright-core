import { JSHandle } from './jsHandle.js';
import { Page } from './page.js';

class ConsoleMessage {
  constructor(platform, event) {
    this._page = "page" in event && event.page ? Page.from(event.page) : null;
    this._event = event;
    if (platform.inspectCustom)
      this[platform.inspectCustom] = () => this._inspect();
  }
  page() {
    return this._page;
  }
  type() {
    return this._event.type;
  }
  text() {
    return this._event.text;
  }
  args() {
    return this._event.args.map(JSHandle.from);
  }
  location() {
    return this._event.location;
  }
  _inspect() {
    return this.text();
  }
}

export { ConsoleMessage };
