import { Browser } from './browser.js';
import { prepareBrowserContextParams, BrowserContext } from './browserContext.js';
import { ChannelOwner } from './channelOwner.js';
import { envObjectToArray } from './clientHelper.js';
import { Events } from './events.js';
import { assert } from '../utils/isomorphic/assert.js';
import { headersObjectToArray } from '../utils/isomorphic/headers.js';
import { monotonicTime } from '../utils/isomorphic/time.js';
import { raceAgainstDeadline } from '../utils/isomorphic/timeoutRunner.js';
import { connectOverWebSocket } from './webSocket.js';
import { TimeoutSettings } from './timeoutSettings.js';

class BrowserType extends ChannelOwner {
  constructor() {
    super(...arguments);
    this._contexts = /* @__PURE__ */ new Set();
  }
  static from(browserType) {
    return browserType._object;
  }
  executablePath() {
    if (!this._initializer.executablePath)
      throw new Error("Browser is not supported on current platform");
    return this._initializer.executablePath;
  }
  name() {
    return this._initializer.name;
  }
  async launch(options = {}) {
    assert(!options.userDataDir, "userDataDir option is not supported in `browserType.launch`. Use `browserType.launchPersistentContext` instead");
    assert(!options.port, "Cannot specify a port without launching as a server.");
    const logger = options.logger || this._playwright._defaultLaunchOptions?.logger;
    options = { ...this._playwright._defaultLaunchOptions, ...options };
    const launchOptions = {
      ...options,
      ignoreDefaultArgs: Array.isArray(options.ignoreDefaultArgs) ? options.ignoreDefaultArgs : void 0,
      ignoreAllDefaultArgs: !!options.ignoreDefaultArgs && !Array.isArray(options.ignoreDefaultArgs),
      env: options.env ? envObjectToArray(options.env) : void 0,
      timeout: new TimeoutSettings(this._platform).launchTimeout(options)
    };
    return await this._wrapApiCall(async () => {
      const browser = Browser.from((await this._channel.launch(launchOptions)).browser);
      browser._connectToBrowserType(this, options, logger);
      return browser;
    });
  }
  async launchServer(options = {}) {
    if (!this._serverLauncher)
      throw new Error("Launching server is not supported");
    options = { ...this._playwright._defaultLaunchOptions, ...options };
    return await this._serverLauncher.launchServer(options);
  }
  async launchPersistentContext(userDataDir, options = {}) {
    const logger = options.logger || this._playwright._defaultLaunchOptions?.logger;
    assert(!options.port, "Cannot specify a port without launching as a server.");
    options = this._playwright.selectors._withSelectorOptions({
      ...this._playwright._defaultLaunchOptions,
      ...this._playwright._defaultContextOptions,
      ...options
    });
    const contextParams = await prepareBrowserContextParams(this._platform, options);
    const persistentParams = {
      ...contextParams,
      ignoreDefaultArgs: Array.isArray(options.ignoreDefaultArgs) ? options.ignoreDefaultArgs : void 0,
      ignoreAllDefaultArgs: !!options.ignoreDefaultArgs && !Array.isArray(options.ignoreDefaultArgs),
      env: options.env ? envObjectToArray(options.env) : void 0,
      channel: options.channel,
      userDataDir: this._platform.path().isAbsolute(userDataDir) || !userDataDir ? userDataDir : this._platform.path().resolve(userDataDir),
      timeout: new TimeoutSettings(this._platform).launchTimeout(options)
    };
    return await this._wrapApiCall(async () => {
      const result = await this._channel.launchPersistentContext(persistentParams);
      const browser = Browser.from(result.browser);
      browser._connectToBrowserType(this, options, logger);
      const context = BrowserContext.from(result.context);
      await context._initializeHarFromOptions(options.recordHar);
      await this._instrumentation.runAfterCreateBrowserContext(context);
      return context;
    });
  }
  async connect(optionsOrWsEndpoint, options) {
    if (typeof optionsOrWsEndpoint === "string")
      return await this._connect({ ...options, wsEndpoint: optionsOrWsEndpoint });
    assert(optionsOrWsEndpoint.wsEndpoint, "options.wsEndpoint is required");
    return await this._connect(optionsOrWsEndpoint);
  }
  async _connect(params) {
    const logger = params.logger;
    return await this._wrapApiCall(async () => {
      const deadline = params.timeout ? monotonicTime() + params.timeout : 0;
      const headers = { "x-playwright-browser": this.name(), ...params.headers };
      const connectParams = {
        wsEndpoint: params.wsEndpoint,
        headers,
        exposeNetwork: params.exposeNetwork ?? params._exposeNetwork,
        slowMo: params.slowMo,
        timeout: params.timeout || 0
      };
      if (params.__testHookRedirectPortForwarding)
        connectParams.socksProxyRedirectPortForTest = params.__testHookRedirectPortForwarding;
      const connection = await connectOverWebSocket(this._connection, connectParams);
      let browser;
      connection.on("close", () => {
        for (const context of browser?.contexts() || []) {
          for (const page of context.pages())
            page._onClose();
          context._onClose();
        }
        setTimeout(() => browser?._didClose(), 0);
      });
      const result = await raceAgainstDeadline(async () => {
        if (params.__testHookBeforeCreateBrowser)
          await params.__testHookBeforeCreateBrowser();
        const playwright = await connection.initializePlaywright();
        if (!playwright._initializer.preLaunchedBrowser) {
          connection.close();
          throw new Error("Malformed endpoint. Did you use BrowserType.launchServer method?");
        }
        playwright.selectors = this._playwright.selectors;
        browser = Browser.from(playwright._initializer.preLaunchedBrowser);
        browser._connectToBrowserType(this, {}, logger);
        browser._shouldCloseConnectionOnClose = true;
        browser.on(Events.Browser.Disconnected, () => connection.close());
        return browser;
      }, deadline);
      if (!result.timedOut) {
        return result.result;
      } else {
        connection.close();
        throw new Error(`Timeout ${params.timeout}ms exceeded`);
      }
    });
  }
  async connectOverCDP(endpointURLOrOptions, options) {
    if (typeof endpointURLOrOptions === "string")
      return await this._connectOverCDP(endpointURLOrOptions, options);
    const endpointURL = "endpointURL" in endpointURLOrOptions ? endpointURLOrOptions.endpointURL : endpointURLOrOptions.wsEndpoint;
    assert(endpointURL, "Cannot connect over CDP without wsEndpoint.");
    return await this.connectOverCDP(endpointURL, endpointURLOrOptions);
  }

  // Modified _connectOverCDP to handle external WebSocket URLs
  async _connectOverCDP(endpointURL, params = {}) {
    if (this.name() !== "chromium")
      throw new Error("Connecting over CDP is only supported in Chromium.");

    // Check if this is an external WebSocket URL (not Cloudflare internal)
    if (this._isExternalWebSocketURL(endpointURL)) {
      return await this._connectOverExternalCDP(endpointURL, params);
    }

    // Original Cloudflare internal logic
    const headers = params.headers ? headersObjectToArray(params.headers) : void 0;
    const result = await this._channel.connectOverCDP({
      endpointURL,
      headers,
      slowMo: params.slowMo,
      timeout: new TimeoutSettings(this._platform).timeout(params)
    });
    const browser = Browser.from(result.browser);
    browser._connectToBrowserType(this, {}, params.logger);
    if (result.defaultContext)
      await this._instrumentation.runAfterCreateBrowserContext(BrowserContext.from(result.defaultContext));
    return browser;
  }

  // Helper to detect external WebSocket URLs
  _isExternalWebSocketURL(url) {
    try {
      const parsedUrl = new URL(url);
      // Check if it's a direct WebSocket URL (not Cloudflare internal format)
      return (parsedUrl.protocol === 'ws:' || parsedUrl.protocol === 'wss:') &&
             !url.includes('fake.host') &&
             !url.includes('cloudflare');
    } catch {
      return false;
    }
  }

  // New method to handle external CDP connections using real Playwright core
  async _connectOverExternalCDP(wsEndpoint, params = {}) {
    console.log('Connecting to external CDP endpoint:', wsEndpoint);

    // For external connections, we need to use Playwright's built-in CDP support
    // but bypass Cloudflare's transport system

    // The challenge is that _channel.connectOverCDP requires Cloudflare's transport
    // For now, fall back to the direct CDP implementation until we can properly
    // integrate with Playwright's channel system

    return await this._wrapApiCall(async () => {
      // Create a mock browser that wraps the external CDP connection
      const externalBrowser = new ExternalCDPBrowser(wsEndpoint, params, this);
      await externalBrowser._initialize();

      // Connect to browser type for consistency
      externalBrowser._connectToBrowserType(this, {}, params.logger);

      return externalBrowser;
    });
  }
}

// External CDP Browser wrapper that provides Playwright API
class ExternalCDPBrowser {
  constructor(wsEndpoint, params, browserType) {
    this.wsEndpoint = wsEndpoint;
    this.params = params;
    this.browserType = browserType;
    this.cdp = null;
    this.contexts = [];
    this._closed = false;
    this._eventListeners = new Map();
  }

  async _initialize() {
    // Create CDP connection
    this.cdp = new SimpleCDPClient(this.wsEndpoint);
    await this.cdp.connect();

    // Get browser info
    this.browserInfo = await this.cdp.send('Browser.getVersion');
    console.log('Connected to browser:', this.browserInfo.product);
  }

  // Playwright Browser API methods
  contexts() {
    return this.contexts;
  }

  async newPage() {
    if (this._closed) throw new Error('Browser is closed');

    // Create new context first
    const context = await this.newContext();
    return await context.newPage();
  }

  async newContext(options = {}) {
    if (this._closed) throw new Error('Browser is closed');

    const context = new ExternalCDPBrowserContext(this.cdp, options);
    await context._initialize();
    this.contexts.push(context);
    return context;
  }

  version() {
    return this.browserInfo?.product || 'Unknown';
  }

  isConnected() {
    return this.cdp && this.cdp.connected && !this._closed;
  }

  async close() {
    if (this._closed) return;
    this._closed = true;

    // Close all contexts
    for (const context of this.contexts) {
      await context.close();
    }

    if (this.cdp) {
      this.cdp.close();
    }

    this._emit('disconnected');
  }

  // Event handling
  on(event, listener) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event).push(listener);
  }

  _emit(event, ...args) {
    const listeners = this._eventListeners.get(event) || [];
    listeners.forEach(listener => listener(...args));
  }

  // Mock methods for Playwright compatibility
  _connectToBrowserType(browserType, options, logger) {
    this._browserType = browserType;
    this._options = options;
    this._logger = logger;
  }
}

// External CDP Browser Context
class ExternalCDPBrowserContext {
  constructor(cdp, options) {
    this.cdp = cdp;
    this.options = options;
    this.pages = [];
    this._closed = false;
  }

  async _initialize() {
    // Enable necessary domains
    await this.cdp.send('Target.setDiscoverTargets', { discover: true });
  }

  async newPage() {
    if (this._closed) throw new Error('Context is closed');

    // Create new target
    const target = await this.cdp.send('Target.createTarget', {
      url: 'about:blank'
    });

    const page = new ExternalCDPPage(this.cdp, target.targetId, this);
    await page._initialize();
    this.pages.push(page);
    return page;
  }

  async close() {
    if (this._closed) return;
    this._closed = true;

    for (const page of this.pages) {
      await page.close();
    }
  }
}

// External CDP Page
class ExternalCDPPage {
  constructor(cdp, targetId, context) {
    this.cdp = cdp;
    this.targetId = targetId;
    this.context = context;
    this.sessionId = null;
    this._closed = false;
  }

  async _initialize() {
    // Attach to target
    const session = await this.cdp.send('Target.attachToTarget', {
      targetId: this.targetId,
      flatten: true
    });
    this.sessionId = session.sessionId;

    // Enable domains
    await this.cdp.send('Page.enable', {}, this.sessionId);
    await this.cdp.send('Runtime.enable', {}, this.sessionId);
    await this.cdp.send('DOM.enable', {}, this.sessionId);
  }



  async goto(url, options = {}) {
    if (this._closed) throw new Error('Page is closed');

    console.log('Navigating to:', url);
    await this.cdp.send('Page.navigate', { url }, this.sessionId);

    // Wait for load event
    return new Promise((resolve) => {
      const originalHandler = this.cdp.ws.onmessage;
      this.cdp.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.method === 'Page.loadEventFired' && message.sessionId === this.sessionId) {
          this.cdp.ws.onmessage = originalHandler;
          resolve();
        } else if (originalHandler) {
          originalHandler(event);
        }
      };
    });
  }

  async screenshot(options = {}) {
    if (this._closed) throw new Error('Page is closed');

    console.log('Taking screenshot...');
    const result = await this.cdp.send('Page.captureScreenshot', {
      format: options.type || 'png',
      quality: options.quality || 90,
      fullPage: options.fullPage !== false
    }, this.sessionId);

    // Return as Uint8Array like Playwright
    return Uint8Array.from(atob(result.data), c => c.charCodeAt(0));
  }

  async evaluate(fn, ...args) {
    if (this._closed) throw new Error('Page is closed');

    const expression = typeof fn === 'function' ? `(${fn.toString()})(${args.map(a => JSON.stringify(a)).join(',')})` : fn;
    const result = await this.cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    }, this.sessionId);

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception.description);
    }

    return result.result.value;
  }

  locator(selector) {
    return new Locator(this, selector);
  }

  async setViewportSize(size) {
    await this.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: size.width,
      height: size.height,
      deviceScaleFactor: 1,
      mobile: false
    }, this.sessionId);
  }

  async waitForTimeout(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }

  async waitForLoadState(state = 'load') {
    // Simple implementation - wait for load event
    if (state === 'load' || state === 'domcontentloaded') {
      return new Promise((resolve) => {
        const originalHandler = this.cdp.ws.onmessage;
        this.cdp.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.method === 'Page.loadEventFired' && message.sessionId === this.sessionId) {
            this.cdp.ws.onmessage = originalHandler;
            resolve();
          } else if (originalHandler) {
            originalHandler(event);
          }
        };
      });
    } else if (state === 'networkidle') {
      // Wait for network to be idle
      await this.cdp.send('Page.setLifecycleEventsEnabled', { enabled: true }, this.sessionId);
      return new Promise((resolve) => {
        const originalHandler = this.cdp.ws.onmessage;
        this.cdp.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.method === 'Page.lifecycleEvent' &&
              message.params.name === 'networkIdle' &&
              message.sessionId === this.sessionId) {
            this.cdp.ws.onmessage = originalHandler;
            resolve();
          } else if (originalHandler) {
            originalHandler(event);
          }
        };
      });
    }
  }

  async waitForSelector(selector, options = {}) {
    const timeout = options.timeout || 30000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.cdp.send('Runtime.evaluate', {
          expression: `document.querySelector('${selector}')`,
          returnByValue: false
        }, this.sessionId);

        if (result.result.objectId) {
          return true; // Element found
        }
      } catch (e) {
        // Continue waiting
      }

      await this.waitForTimeout(100);
    }

    throw new Error(`Timeout waiting for selector: ${selector}`);
  }

  async click(selector) {
    // Find element
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        const element = document.querySelector('${selector}');
        if (element) {
          const rect = element.getBoundingClientRect();
          ({ x: rect.left + rect.width/2, y: rect.top + rect.height/2 });
        } else {
          null;
        }
      `,
      returnByValue: true
    }, this.sessionId);

    if (!result.result.value) {
      throw new Error(`Element not found: ${selector}`);
    }

    const { x, y } = result.result.value;

    // Click at coordinates
    await this.cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: x,
      y: y,
      button: 'left',
      clickCount: 1
    }, this.sessionId);

    await this.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: x,
      y: y,
      button: 'left',
      clickCount: 1
    }, this.sessionId);
  }

  async fill(selector, text) {
    // Focus element and clear
    await this.cdp.send('Runtime.evaluate', {
      expression: `
        const element = document.querySelector('${selector}');
        if (element) {
          element.focus();
          element.select();
        }
      `
    }, this.sessionId);

    // Type text
    for (const char of text) {
      await this.cdp.send('Input.dispatchKeyEvent', {
        type: 'char',
        text: char
      }, this.sessionId);
    }
  }

  async type(selector, text) {
    return this.fill(selector, text);
  }

  async press(selector, key) {
    // Focus element first
    await this.cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('${selector}').focus()`
    }, this.sessionId);

    // Map common keys
    const keyMap = {
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Escape': 'Escape',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight'
    };

    const keyCode = keyMap[key] || key;

    await this.cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: keyCode
    }, this.sessionId);

    await this.cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: keyCode
    }, this.sessionId);
  }

  async $(selector) {
    // Return a simple element handle
    return {
      selector: selector,
      page: this,
      click: () => this.click(selector),
      fill: (text) => this.fill(selector, text),
      type: (text) => this.type(selector, text),
      press: (key) => this.press(selector, key)
    };
  }

  async $(selector) {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('${selector}')).length`,
      returnByValue: true
    }, this.sessionId);

    const count = result.result.value;
    const elements = [];

    for (let i = 0; i < count; i++) {
      elements.push({
        selector: `${selector}:nth-child(${i + 1})`,
        page: this,
        click: () => this.click(`${selector}:nth-child(${i + 1})`),
        fill: (text) => this.fill(`${selector}:nth-child(${i + 1})`, text)
      });
    }

    return elements;
  }

  async title() {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    }, this.sessionId);

    return result.result.value;
  }

  async url() {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    }, this.sessionId);

    return result.result.value;
  }

  async content() {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true
    }, this.sessionId);

    return result.result.value;
  }

  async reload(options = {}) {
    await this.cdp.send('Page.reload', {}, this.sessionId);

    if (options.waitUntil) {
      await this.waitForLoadState(options.waitUntil);
    }
  }

  async goBack() {
    const history = await this.cdp.send('Page.getNavigationHistory', {}, this.sessionId);
    if (history.currentIndex > 0) {
      await this.cdp.send('Page.navigateToHistoryEntry', {
        entryId: history.entries[history.currentIndex - 1].id
      }, this.sessionId);
    }
  }

  async goForward() {
    const history = await this.cdp.send('Page.getNavigationHistory', {}, this.sessionId);
    if (history.currentIndex < history.entries.length - 1) {
      await this.cdp.send('Page.navigateToHistoryEntry', {
        entryId: history.entries[history.currentIndex + 1].id
      }, this.sessionId);
    }
  }

  async close() {
    if (this._closed) return;
    this._closed = true;

    if (this.sessionId) {
      await this.cdp.send('Target.detachFromTarget', { sessionId: this.sessionId });
    }

    await this.cdp.send('Target.closeTarget', { targetId: this.targetId });
  }
}

// Simple CDP client for external connections
class SimpleCDPClient {
  constructor(wsEndpoint) {
    this.wsEndpoint = wsEndpoint;
    this.ws = null;
    this.messageId = 1;
    this.callbacks = new Map();
    this.connected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log('CDP connecting to:', this.wsEndpoint);

      this.ws = new WebSocket(this.wsEndpoint);

      const timeout = setTimeout(() => {
        this.ws.close();
        reject(new Error('CDP connection timeout'));
      }, 10000);

      this.ws.onopen = () => {
        console.log('CDP connected');
        this.connected = true;
        clearTimeout(timeout);
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('CDP error:', error);
        clearTimeout(timeout);
        reject(new Error('CDP connection failed'));
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.id && this.callbacks.has(message.id)) {
          const callback = this.callbacks.get(message.id);
          this.callbacks.delete(message.id);
          callback(message);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
      };
    });
  }

  async send(method, params = {}, sessionId = null) {
    if (!this.connected) {
      throw new Error('CDP not connected');
    }

    const id = this.messageId++;
    const command = { id, method, params };

    if (sessionId) {
      command.sessionId = sessionId;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.callbacks.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, 30000);

      this.callbacks.set(id, (response) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(`CDP Error: ${response.error.message}`));
        } else {
          resolve(response.result || {});
        }
      });

      this.ws.send(JSON.stringify(command));
    });
  }

  close() {
    if (this.ws && this.connected) {
      this.ws.close();
      this.connected = false;
    }
  }
}

// Locator class for element interactions
class Locator {
  constructor(page, selector) {
    this.page = page;
    this.selector = selector;
  }

  async click(options = {}) {
    if (this.page._closed) throw new Error('Page is closed');

    try {
      // Try CDP approach first
      const element = await this._getElement();

      let box;
      try {
        box = await this.page.cdp.send('DOM.getBoxModel', {
          nodeId: element.nodeId
        }, this.page.sessionId);
      } catch (boxError) {
        console.log('Box model failed, trying JavaScript click fallback:', boxError.message);
        return await this._clickWithJavaScript();
      }

      if (!box.model) {
        console.log('No box model, trying JavaScript click fallback');
        return await this._clickWithJavaScript();
      }

      // Calculate center point
      const quad = box.model.border;
      const x = (quad[0] + quad[2] + quad[4] + quad[6]) / 4;
      const y = (quad[1] + quad[3] + quad[5] + quad[7]) / 4;

      // Add mouse moved event before clicking for better reliability
      await this.page.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: Math.round(x),
        y: Math.round(y)
      }, this.page.sessionId);

      // Perform click
      await this.page.cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: Math.round(x),
        y: Math.round(y),
        button: 'left',
        clickCount: 1
      }, this.page.sessionId);

      await this.page.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: Math.round(x),
        y: Math.round(y),
        button: 'left',
        clickCount: 1
      }, this.page.sessionId);

    } catch (error) {
      console.log('CDP click failed, trying JavaScript fallback:', error.message);
      return await this._clickWithJavaScript();
    }
  }

  async _clickWithJavaScript() {
    if (this.page._closed) throw new Error('Page is closed');

    // Clean selector for JavaScript (remove Playwright-specific syntax)
    let cleanSelector = this.selector
      .replace(/\s*>>\s*xpath=.*$/i, '')
      .replace(/\s*>>\s*.*$/i, '')
      .replace(/:first-of-type|:last-of-type|:nth-of-type\(\d+\)/g, '');

    return await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      // Scroll element into view
      element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });

      // Try element.click() first
      try {
        element.click();
        return true;
      } catch (e) {
        // Fallback to dispatchEvent
        try {
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: element.getBoundingClientRect().left + element.offsetWidth / 2,
            clientY: element.getBoundingClientRect().top + element.offsetHeight / 2
          });
          element.dispatchEvent(clickEvent);
          return true;
        } catch (e2) {
          throw new Error(`JavaScript click failed: ${e2.message}`);
        }
      }
    }, cleanSelector);
  }

  async fill(text) {
    if (this.page._closed) throw new Error('Page is closed');

    // Click the element first to focus it
    await this.click();

    // Clear existing content
    await this.page.cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Meta'
    }, this.page.sessionId);

    await this.page.cdp.send('Input.dispatchKeyEvent', {
      type: 'char',
      text: 'a'
    }, this.page.sessionId);

    await this.page.cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Meta'
    }, this.page.sessionId);

    // Type the new text
    for (const char of text) {
      await this.page.cdp.send('Input.dispatchKeyEvent', {
        type: 'char',
        text: char
      }, this.page.sessionId);
    }
  }

  async textContent() {
    if (this.page._closed) throw new Error('Page is closed');

    return await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.textContent : null;
    }, this.selector);
  }

  async innerHTML() {
    if (this.page._closed) throw new Error('Page is closed');

    return await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.innerHTML : null;
    }, this.selector);
  }

  async getAttribute(name) {
    if (this.page._closed) throw new Error('Page is closed');

    return await this.page.evaluate((selector, attrName) => {
      const element = document.querySelector(selector);
      return element ? element.getAttribute(attrName) : null;
    }, this.selector, name);
  }

  async isVisible() {
    if (this.page._closed) throw new Error('Page is closed');

    return await this.page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;

      const style = window.getComputedStyle(element);
      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0';
    }, this.selector);
  }

  async waitFor(options = {}) {
    if (this.page._closed) throw new Error('Page is closed');

    const timeout = options.timeout || 30000;
    const state = options.state || 'visible';

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = async () => {
        try {
          let condition = false;

          switch (state) {
            case 'visible':
              condition = await this.isVisible();
              break;
            case 'hidden':
              condition = !(await this.isVisible());
              break;
            case 'attached':
              condition = await this.page.evaluate((selector) => {
                return !!document.querySelector(selector);
              }, this.selector);
              break;
          }

          if (condition) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout waiting for element ${this.selector} to be ${state}`));
          } else {
            setTimeout(check, 100);
          }
        } catch (error) {
          reject(error);
        }
      };

      check();
    });
  }

  async _getElement() {
    // Get document root
    const doc = await this.page.cdp.send('DOM.getDocument', {}, this.page.sessionId);

    // Find element by selector
    const result = await this.page.cdp.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: this.selector
    }, this.page.sessionId);

    if (!result.nodeId) {
      throw new Error(`Element not found: ${this.selector}`);
    }

    return { nodeId: result.nodeId };
  }

  // Missing Locator API methods for compatibility
  first() {
    return new Locator(this.page, this.selector + ':first-of-type');
  }

  last() {
    return new Locator(this.page, this.selector + ':last-of-type');
  }

  nth(index) {
    if (index === -1) {
      return this.last();
    }
    return new Locator(this.page, this.selector + `:nth-of-type(${index + 1})`);
  }

  async count() {
    if (this.page._closed) throw new Error('Page is closed');

    return await this.page.evaluate((selector) => {
      return document.querySelectorAll(selector).length;
    }, this.selector);
  }

  async all() {
    const count = await this.count();
    return Array.from({ length: count }, (_, i) => this.nth(i));
  }
}

export { BrowserType };
