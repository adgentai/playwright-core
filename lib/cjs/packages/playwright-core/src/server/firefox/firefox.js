'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const os = require('node:os');
const path = require('node:path');
const ffBrowser = require('./ffBrowser.js');
const ffConnection = require('./ffConnection.js');
const ascii = require('../utils/ascii.js');
const browserType = require('../browserType.js');
const manualPromise = require('../../utils/isomorphic/manualPromise.js');

class Firefox extends browserType.BrowserType {
  constructor(parent) {
    super(parent, "firefox");
  }
  connectToTransport(transport, options) {
    return ffBrowser.FFBrowser.connect(this.attribution.playwright, transport, options);
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
    if (os.platform() === "linux") {
      return { ...env, SNAP_NAME: void 0, SNAP_INSTANCE_NAME: void 0 };
    }
    return env;
  }
  attemptToGracefullyCloseBrowser(transport) {
    const message = { method: "Browser.close", params: {}, id: ffConnection.kBrowserCloseMessageId };
    transport.send(message);
  }
  defaultArgs(options, isPersistent, userDataDir) {
    const { args = [], headless } = options;
    const userDataDirArg = args.find((arg) => arg.startsWith("-profile") || arg.startsWith("--profile"));
    if (userDataDirArg)
      throw this._createUserDataDirArgMisuseError("--profile");
    if (args.find((arg) => arg.startsWith("-juggler")))
      throw new Error("Use the port parameter instead of -juggler argument");
    const firefoxArguments = ["-no-remote"];
    if (headless) {
      firefoxArguments.push("-headless");
    } else {
      firefoxArguments.push("-wait-for-browser");
      firefoxArguments.push("-foreground");
    }
    firefoxArguments.push(`-profile`, userDataDir);
    firefoxArguments.push("-juggler-pipe");
    firefoxArguments.push(...args);
    if (isPersistent)
      firefoxArguments.push("about:blank");
    else
      firefoxArguments.push("-silent");
    return firefoxArguments;
  }
  waitForReadyState(options, browserLogsCollector) {
    const result = new manualPromise.ManualPromise();
    browserLogsCollector.onMessage((message) => {
      if (message.includes("Juggler listening to the pipe"))
        result.resolve({});
    });
    return result;
  }
}

exports.Firefox = Firefox;
