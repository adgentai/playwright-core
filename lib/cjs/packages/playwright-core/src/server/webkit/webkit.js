'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const path = require('node:path');
const wkConnection = require('./wkConnection.js');
const ascii = require('../utils/ascii.js');
const browserType = require('../browserType.js');
const wkBrowser = require('./wkBrowser.js');

class WebKit extends browserType.BrowserType {
  constructor(parent) {
    super(parent, "webkit");
  }
  connectToTransport(transport, options) {
    return wkBrowser.WKBrowser.connect(this.attribution.playwright, transport, options);
  }
  amendEnvironment(env, userDataDir, isPersistent) {
    return {
      ...env,
      CURL_COOKIE_JAR_PATH: process.platform === "win32" && isPersistent ? path.join(userDataDir, "cookiejar.db") : void 0
    };
  }
  doRewriteStartupLog(error) {
    if (!error.logs)
      return error;
    if (error.logs.includes("Failed to open display") || error.logs.includes("cannot open display"))
      error.logs = "\n" + ascii.wrapInASCIIBox(browserType.kNoXServerRunningError, 1);
    return error;
  }
  attemptToGracefullyCloseBrowser(transport) {
    transport.send({ method: "Playwright.close", params: {}, id: wkConnection.kBrowserCloseMessageId });
  }
  defaultArgs(options, isPersistent, userDataDir) {
    const { args = [], headless } = options;
    const userDataDirArg = args.find((arg) => arg.startsWith("--user-data-dir"));
    if (userDataDirArg)
      throw this._createUserDataDirArgMisuseError("--user-data-dir");
    if (args.find((arg) => !arg.startsWith("-")))
      throw new Error("Arguments can not specify page to be opened");
    const webkitArguments = ["--inspector-pipe"];
    if (process.platform === "win32")
      webkitArguments.push("--disable-accelerated-compositing");
    if (headless)
      webkitArguments.push("--headless");
    if (isPersistent)
      webkitArguments.push(`--user-data-dir=${userDataDir}`);
    else
      webkitArguments.push(`--no-startup-window`);
    const proxy = options.proxyOverride || options.proxy;
    if (proxy) {
      if (process.platform === "darwin") {
        webkitArguments.push(`--proxy=${proxy.server}`);
        if (proxy.bypass)
          webkitArguments.push(`--proxy-bypass-list=${proxy.bypass}`);
      } else if (process.platform === "linux") {
        webkitArguments.push(`--proxy=${proxy.server}`);
        if (proxy.bypass)
          webkitArguments.push(...proxy.bypass.split(",").map((t) => `--ignore-host=${t}`));
      } else if (process.platform === "win32") {
        webkitArguments.push(`--curl-proxy=${proxy.server.replace(/^socks5:\/\//, "socks5h://")}`);
        if (proxy.bypass)
          webkitArguments.push(`--curl-noproxy=${proxy.bypass}`);
      }
    }
    webkitArguments.push(...args);
    if (isPersistent)
      webkitArguments.push("about:blank");
    return webkitArguments;
  }
}

exports.WebKit = WebKit;
