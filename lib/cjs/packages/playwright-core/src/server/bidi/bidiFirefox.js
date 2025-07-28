'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const os = require('node:os');
const path = require('node:path');
const ascii = require('../utils/ascii.js');
const browserType = require('../browserType.js');
const bidiBrowser = require('./bidiBrowser.js');
const bidiConnection = require('./bidiConnection.js');
const firefoxPrefs = require('./third_party/firefoxPrefs.js');
const manualPromise = require('../../utils/isomorphic/manualPromise.js');

class BidiFirefox extends browserType.BrowserType {
  constructor(parent) {
    super(parent, "_bidiFirefox");
  }
  executablePath() {
    return "";
  }
  async connectToTransport(transport, options) {
    return bidiBrowser.BidiBrowser.connect(this.attribution.playwright, transport, options);
  }
  doRewriteStartupLog(error) {
    if (!error.logs)
      return error;
    if (error.logs.includes(`as root in a regular user's session is not supported.`))
      error.logs = "\n" + ascii.wrapInASCIIBox(`Firefox is unable to launch if the $HOME folder isn't owned by the current user.
Workaround: Set the HOME=/root environment variable${process.env.GITHUB_ACTION ? " in your GitHub Actions workflow file" : ""} when running Playwright.`, 1);
    if (error.logs.includes("no DISPLAY environment variable specified"))
      error.logs = "\n" + ascii.wrapInASCIIBox(browserType.kNoXServerRunningError, 1);
    return error;
  }
  amendEnvironment(env) {
    if (!path.isAbsolute(os.homedir()))
      throw new Error(`Cannot launch Firefox with relative home directory. Did you set ${os.platform() === "win32" ? "USERPROFILE" : "HOME"} to a relative path?`);
    env = {
      ...env,
      "MOZ_CRASHREPORTER": "1",
      "MOZ_CRASHREPORTER_NO_REPORT": "1",
      "MOZ_CRASHREPORTER_SHUTDOWN": "1"
    };
    if (os.platform() === "linux") {
      return { ...env, SNAP_NAME: void 0, SNAP_INSTANCE_NAME: void 0 };
    }
    return env;
  }
  attemptToGracefullyCloseBrowser(transport) {
    transport.send({ method: "browser.close", params: {}, id: bidiConnection.kBrowserCloseMessageId });
  }
  supportsPipeTransport() {
    return false;
  }
  async prepareUserDataDir(options, userDataDir) {
    await firefoxPrefs.createProfile({
      path: userDataDir,
      preferences: options.firefoxUserPrefs || {}
    });
  }
  defaultArgs(options, isPersistent, userDataDir) {
    const { args = [], headless } = options;
    const userDataDirArg = args.find((arg) => arg.startsWith("-profile") || arg.startsWith("--profile"));
    if (userDataDirArg)
      throw this._createUserDataDirArgMisuseError("--profile");
    const firefoxArguments = ["--remote-debugging-port=0"];
    if (headless)
      firefoxArguments.push("--headless");
    else
      firefoxArguments.push("--foreground");
    firefoxArguments.push(`--profile`, userDataDir);
    firefoxArguments.push(...args);
    return firefoxArguments;
  }
  async waitForReadyState(options, browserLogsCollector) {
    const result = new manualPromise.ManualPromise();
    browserLogsCollector.onMessage((message) => {
      const match = message.match(/WebDriver BiDi listening on (ws:\/\/.*)$/);
      if (match)
        result.resolve({ wsEndpoint: match[1] + "/session" });
    });
    return result;
  }
}

exports.BidiFirefox = BidiFirefox;
