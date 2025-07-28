import os from 'node:os';
import path from 'node:path';
import { wrapInASCIIBox } from '../utils/ascii.js';
import { BrowserType, kNoXServerRunningError } from '../browserType.js';
import { BidiBrowser } from './bidiBrowser.js';
import { kBrowserCloseMessageId } from './bidiConnection.js';
import { createProfile } from './third_party/firefoxPrefs.js';
import { ManualPromise } from '../../utils/isomorphic/manualPromise.js';

class BidiFirefox extends BrowserType {
  constructor(parent) {
    super(parent, "_bidiFirefox");
  }
  executablePath() {
    return "";
  }
  async connectToTransport(transport, options) {
    return BidiBrowser.connect(this.attribution.playwright, transport, options);
  }
  doRewriteStartupLog(error) {
    if (!error.logs)
      return error;
    if (error.logs.includes(`as root in a regular user's session is not supported.`))
      error.logs = "\n" + wrapInASCIIBox(`Firefox is unable to launch if the $HOME folder isn't owned by the current user.
Workaround: Set the HOME=/root environment variable${process.env.GITHUB_ACTION ? " in your GitHub Actions workflow file" : ""} when running Playwright.`, 1);
    if (error.logs.includes("no DISPLAY environment variable specified"))
      error.logs = "\n" + wrapInASCIIBox(kNoXServerRunningError, 1);
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
    transport.send({ method: "browser.close", params: {}, id: kBrowserCloseMessageId });
  }
  supportsPipeTransport() {
    return false;
  }
  async prepareUserDataDir(options, userDataDir) {
    await createProfile({
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
    const result = new ManualPromise();
    browserLogsCollector.onMessage((message) => {
      const match = message.match(/WebDriver BiDi listening on (ws:\/\/.*)$/);
      if (match)
        result.resolve({ wsEndpoint: match[1] + "/session" });
    });
    return result;
  }
}

export { BidiFirefox };
