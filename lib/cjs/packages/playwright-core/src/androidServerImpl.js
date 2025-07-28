'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const playwrightServer = require('./remote/playwrightServer.js');
const playwright = require('./server/playwright.js');
const crypto = require('./server/utils/crypto.js');
const utilsBundle = require('./utilsBundle.js');
const progress = require('./server/progress.js');
require('./server/registry/index.js');
require('node:events');
require('./protocol/validator.js');
require('../../../_virtual/pixelmatch.js');
require('./server/utils/debug.js');
require('./server/utils/debugLogger.js');
require('../../../bundles/fs.js');
require('node:path');
require('./zipBundle.js');
require('./server/utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./server/utils/happyEyeballs.js');
require('./server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./server/utils/profiler.js');
require('./server/utils/socksProxy.js');
require('node:os');
require('./server/utils/zones.js');
require('./protocol/serializers.js');
const instrumentation = require('./server/instrumentation.js');
require('./server/fetch.js');
require('./server/browserContext.js');
require('./server/chromium/crConnection.js');
require('./server/page.js');
require('./server/frames.js');
require('./server/network.js');
require('./server/dispatchers/webSocketRouteDispatcher.js');
require('./server/chromium/crBrowser.js');
require('./server/debugger.js');
require('./server/android/android.js');
require('./server/browser.js');
require('./server/electron/electron.js');
require('../../../cloudflare/webSocketTransport.js');

class AndroidServerLauncherImpl {
  async launchServer(options = {}) {
    const playwright$1 = playwright.createPlaywright({ sdkLanguage: "javascript", isServer: true });
    const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), playwright$1);
    let devices = await controller.run((progress) => playwright$1.android.devices(progress, {
      host: options.adbHost,
      port: options.adbPort,
      omitDriverInstall: options.omitDriverInstall
    }));
    if (devices.length === 0)
      throw new Error("No devices found");
    if (options.deviceSerialNumber) {
      devices = devices.filter((d) => d.serial === options.deviceSerialNumber);
      if (devices.length === 0)
        throw new Error(`No device with serial number '${options.deviceSerialNumber}' was found`);
    }
    if (devices.length > 1)
      throw new Error(`More than one device found. Please specify deviceSerialNumber`);
    const device = devices[0];
    const path = options.wsPath ? options.wsPath.startsWith("/") ? options.wsPath : `/${options.wsPath}` : `/${crypto.createGuid()}`;
    const server = new playwrightServer.PlaywrightServer({ mode: "launchServer", path, maxConnections: 1, preLaunchedAndroidDevice: device });
    const wsEndpoint = await server.listen(options.port, options.host);
    const browserServer = new utilsBundle.ws.EventEmitter();
    browserServer.wsEndpoint = () => wsEndpoint;
    browserServer.close = () => device.close();
    browserServer.kill = () => device.close();
    device.on("close", () => {
      server.close();
      browserServer.emit("close");
    });
    return browserServer;
  }
}

exports.AndroidServerLauncherImpl = AndroidServerLauncherImpl;
