import fs from '../../../../bundles/fs.js';
import os from 'node:os';
import path from 'node:path';
import { normalizeProxySettings, validateBrowserContextOptions } from './browserContext.js';
import { debugMode } from './utils/debug.js';
import { assert } from '../utils/isomorphic/assert.js';
import { ManualPromise } from '../utils/isomorphic/manualPromise.js';
import { DEFAULT_PLAYWRIGHT_TIMEOUT } from '../utils/isomorphic/time.js';
import { existsAsync, removeFolders } from './utils/fileUtils.js';
import { helper } from './helper.js';
import { SdkObject } from './instrumentation.js';
import { PipeTransport } from './pipeTransport.js';
import { envArrayToObject, launchProcess } from './utils/processLauncher.js';
import { isProtocolError } from './protocolError.js';
import { registry } from './registry/index.js';
import { ClientCertificatesProxy } from './socksClientCertificatesInterceptor.js';
import { WebSocketTransport } from '../../../../cloudflare/webSocketTransport.js';
import { RecentLogsCollector } from './utils/debugLogger.js';

const kNoXServerRunningError = "Looks like you launched a headed browser without having a XServer running.\nSet either 'headless: true' or use 'xvfb-run <your-playwright-app>' before running Playwright.\n\n<3 Playwright Team";
class BrowserType extends SdkObject {
  constructor(parent, browserName) {
    super(parent, "browser-type");
    this.attribution.browserType = this;
    this._name = browserName;
    this.logName = "browser";
  }
  executablePath() {
    return registry.findExecutable(this._name).executablePath(this.attribution.playwright.options.sdkLanguage) || "";
  }
  name() {
    return this._name;
  }
  async launch(progress, options, protocolLogger) {
    options = this._validateLaunchOptions(options);
    const seleniumHubUrl = options.__testHookSeleniumRemoteURL || process.env.SELENIUM_REMOTE_URL;
    if (seleniumHubUrl)
      return this._launchWithSeleniumHub(progress, seleniumHubUrl, options);
    return this._innerLaunchWithRetries(progress, options, void 0, helper.debugProtocolLogger(protocolLogger)).catch((e) => {
      throw this._rewriteStartupLog(e);
    });
  }
  async launchPersistentContext(progress, userDataDir, options) {
    const launchOptions = this._validateLaunchOptions(options);
    let clientCertificatesProxy;
    if (options.clientCertificates?.length) {
      clientCertificatesProxy = await progress.raceWithCleanup(ClientCertificatesProxy.create(options), (proxy) => proxy.close());
      launchOptions.proxyOverride = clientCertificatesProxy.proxySettings();
      options = { ...options };
      options.internalIgnoreHTTPSErrors = true;
    }
    const browser = await this._innerLaunchWithRetries(progress, launchOptions, options, helper.debugProtocolLogger(), userDataDir).catch((e) => {
      throw this._rewriteStartupLog(e);
    });
    browser._defaultContext._clientCertificatesProxy = clientCertificatesProxy;
    return browser._defaultContext;
  }
  async _innerLaunchWithRetries(progress, options, persistent, protocolLogger, userDataDir) {
    try {
      return await this._innerLaunch(progress, options, persistent, protocolLogger, userDataDir);
    } catch (error) {
      const errorMessage = typeof error === "object" && typeof error.message === "string" ? error.message : "";
      if (errorMessage.includes("Inconsistency detected by ld.so")) {
        progress.log(`<restarting browser due to hitting race condition in glibc>`);
        return this._innerLaunch(progress, options, persistent, protocolLogger, userDataDir);
      }
      throw error;
    }
  }
  async _innerLaunch(progress, options, persistent, protocolLogger, maybeUserDataDir) {
    options.proxy = options.proxy ? normalizeProxySettings(options.proxy) : void 0;
    const browserLogsCollector = new RecentLogsCollector();
    const { browserProcess, userDataDir, artifactsDir, transport } = await this._launchProcess(progress, options, !!persistent, browserLogsCollector, maybeUserDataDir);
    if (options.__testHookBeforeCreateBrowser)
      await progress.race(options.__testHookBeforeCreateBrowser());
    const browserOptions = {
      name: this._name,
      isChromium: this._name === "chromium",
      channel: options.channel,
      slowMo: options.slowMo,
      persistent,
      headful: !options.headless,
      artifactsDir,
      downloadsPath: options.downloadsPath || artifactsDir,
      tracesDir: options.tracesDir || artifactsDir,
      browserProcess,
      customExecutablePath: options.executablePath,
      proxy: options.proxy,
      protocolLogger,
      browserLogsCollector,
      wsEndpoint: transport instanceof WebSocketTransport ? transport.wsEndpoint : void 0,
      originalLaunchOptions: options
    };
    if (persistent)
      validateBrowserContextOptions(persistent, browserOptions);
    copyTestHooks(options, browserOptions);
    const browser = await progress.race(this.connectToTransport(transport, browserOptions, browserLogsCollector));
    browser._userDataDirForTest = userDataDir;
    if (persistent && !options.ignoreAllDefaultArgs)
      await browser._defaultContext._loadDefaultContext(progress);
    return browser;
  }
  async _prepareToLaunch(options, isPersistent, userDataDir) {
    const {
      ignoreDefaultArgs,
      ignoreAllDefaultArgs,
      args = [],
      executablePath = null
    } = options;
    await this._createArtifactDirs(options);
    const tempDirectories = [];
    const artifactsDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "playwright-artifacts-"));
    tempDirectories.push(artifactsDir);
    if (userDataDir) {
      assert(path.isAbsolute(userDataDir), "userDataDir must be an absolute path");
      if (!await existsAsync(userDataDir))
        await fs.promises.mkdir(userDataDir, { recursive: true, mode: 448 });
    } else {
      userDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `playwright_${this._name}dev_profile-`));
      tempDirectories.push(userDataDir);
    }
    await this.prepareUserDataDir(options, userDataDir);
    const browserArguments = [];
    if (ignoreAllDefaultArgs)
      browserArguments.push(...args);
    else if (ignoreDefaultArgs)
      browserArguments.push(...this.defaultArgs(options, isPersistent, userDataDir).filter((arg) => ignoreDefaultArgs.indexOf(arg) === -1));
    else
      browserArguments.push(...this.defaultArgs(options, isPersistent, userDataDir));
    let executable;
    if (executablePath) {
      if (!await existsAsync(executablePath))
        throw new Error(`Failed to launch ${this._name} because executable doesn't exist at ${executablePath}`);
      executable = executablePath;
    } else {
      const registryExecutable = registry.findExecutable(this.getExecutableName(options));
      if (!registryExecutable || registryExecutable.browserName !== this._name)
        throw new Error(`Unsupported ${this._name} channel "${options.channel}"`);
      executable = registryExecutable.executablePathOrDie(this.attribution.playwright.options.sdkLanguage);
      await registry.validateHostRequirementsForExecutablesIfNeeded([registryExecutable], this.attribution.playwright.options.sdkLanguage);
    }
    return { executable, browserArguments, userDataDir, artifactsDir, tempDirectories };
  }
  async _launchProcess(progress, options, isPersistent, browserLogsCollector, userDataDir) {
    const {
      handleSIGINT = true,
      handleSIGTERM = true,
      handleSIGHUP = true
    } = options;
    const env = options.env ? envArrayToObject(options.env) : process.env;
    const prepared = await progress.race(this._prepareToLaunch(options, isPersistent, userDataDir));
    progress.cleanupWhenAborted(() => removeFolders(prepared.tempDirectories));
    let transport = void 0;
    let browserProcess = void 0;
    const exitPromise = new ManualPromise();
    const { launchedProcess, gracefullyClose, kill } = await launchProcess({
      command: prepared.executable,
      args: prepared.browserArguments,
      env: this.amendEnvironment(env, prepared.userDataDir, isPersistent),
      handleSIGINT,
      handleSIGTERM,
      handleSIGHUP,
      log: (message) => {
        progress.log(message);
        browserLogsCollector.log(message);
      },
      stdio: "pipe",
      tempDirectories: prepared.tempDirectories,
      attemptToGracefullyClose: async () => {
        if (options.__testHookGracefullyClose)
          await options.__testHookGracefullyClose();
        this.attemptToGracefullyCloseBrowser(transport);
      },
      onExit: (exitCode, signal) => {
        exitPromise.resolve();
        if (browserProcess && browserProcess.onclose)
          browserProcess.onclose(exitCode, signal);
      }
    });
    async function closeOrKill(timeout) {
      let timer;
      try {
        await Promise.race([
          gracefullyClose(),
          new Promise((resolve, reject) => timer = setTimeout(reject, timeout))
        ]);
      } catch (ignored) {
        await kill().catch((ignored2) => {
        });
      } finally {
        clearTimeout(timer);
      }
    }
    browserProcess = {
      onclose: void 0,
      process: launchedProcess,
      close: () => closeOrKill(options.__testHookBrowserCloseTimeout || DEFAULT_PLAYWRIGHT_TIMEOUT),
      kill
    };
    progress.cleanupWhenAborted(() => closeOrKill(DEFAULT_PLAYWRIGHT_TIMEOUT));
    const { wsEndpoint } = await progress.race([
      this.waitForReadyState(options, browserLogsCollector),
      exitPromise.then(() => ({ wsEndpoint: void 0 }))
    ]);
    if (options.cdpPort !== void 0 || !this.supportsPipeTransport()) {
      transport = await WebSocketTransport.connect(progress, wsEndpoint);
    } else {
      const stdio = launchedProcess.stdio;
      transport = new PipeTransport(stdio[3], stdio[4]);
    }
    progress.cleanupWhenAborted(() => transport.close());
    return { browserProcess, artifactsDir: prepared.artifactsDir, userDataDir: prepared.userDataDir, transport };
  }
  async _createArtifactDirs(options) {
    if (options.downloadsPath)
      await fs.promises.mkdir(options.downloadsPath, { recursive: true });
    if (options.tracesDir)
      await fs.promises.mkdir(options.tracesDir, { recursive: true });
  }
  async connectOverCDP(progress, endpointURL, options) {
    throw new Error("CDP connections are only supported by Chromium");
  }
  async _launchWithSeleniumHub(progress, hubUrl, options) {
    throw new Error("Connecting to SELENIUM_REMOTE_URL is only supported by Chromium");
  }
  _validateLaunchOptions(options) {
    const { devtools = false } = options;
    let { headless = !devtools, downloadsPath, proxy } = options;
    if (debugMode())
      headless = false;
    if (downloadsPath && !path.isAbsolute(downloadsPath))
      downloadsPath = path.join(process.cwd(), downloadsPath);
    if (options.socksProxyPort)
      proxy = { server: `socks5://127.0.0.1:${options.socksProxyPort}` };
    return { ...options, devtools, headless, downloadsPath, proxy };
  }
  _createUserDataDirArgMisuseError(userDataDirArg) {
    switch (this.attribution.playwright.options.sdkLanguage) {
      case "java":
        return new Error(`Pass userDataDir parameter to 'BrowserType.launchPersistentContext(userDataDir, options)' instead of specifying '${userDataDirArg}' argument`);
      case "python":
        return new Error(`Pass user_data_dir parameter to 'browser_type.launch_persistent_context(user_data_dir, **kwargs)' instead of specifying '${userDataDirArg}' argument`);
      case "csharp":
        return new Error(`Pass userDataDir parameter to 'BrowserType.LaunchPersistentContextAsync(userDataDir, options)' instead of specifying '${userDataDirArg}' argument`);
      default:
        return new Error(`Pass userDataDir parameter to 'browserType.launchPersistentContext(userDataDir, options)' instead of specifying '${userDataDirArg}' argument`);
    }
  }
  _rewriteStartupLog(error) {
    if (!isProtocolError(error))
      return error;
    return this.doRewriteStartupLog(error);
  }
  async waitForReadyState(options, browserLogsCollector) {
    return {};
  }
  async prepareUserDataDir(options, userDataDir) {
  }
  supportsPipeTransport() {
    return true;
  }
  getExecutableName(options) {
    return options.channel || this._name;
  }
}
function copyTestHooks(from, to) {
  for (const [key, value] of Object.entries(from)) {
    if (key.startsWith("__testHook"))
      to[key] = value;
  }
}

export { BrowserType, kNoXServerRunningError };
