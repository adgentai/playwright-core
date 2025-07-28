import { PlaywrightServer } from './remote/playwrightServer.js';
import { createPlaywright } from './server/playwright.js';
import { createGuid } from './server/utils/crypto.js';
import { ws } from './utilsBundle.js';
import { ProgressController } from './server/progress.js';
import './server/registry/index.js';
import 'node:events';
import './protocol/validator.js';
import '../../../_virtual/pixelmatch.js';
import './server/utils/debug.js';
import './server/utils/debugLogger.js';
import '../../../bundles/fs.js';
import 'node:path';
import './zipBundle.js';
import './server/utils/hostPlatform.js';
import 'node:http';
import 'node:http2';
import 'node:https';
import 'node:url';
import './server/utils/happyEyeballs.js';
import './server/utils/nodePlatform.js';
import 'node:child_process';
import 'node:readline';
import './server/utils/profiler.js';
import './server/utils/socksProxy.js';
import 'node:os';
import './server/utils/zones.js';
import './protocol/serializers.js';
import { serverSideCallMetadata } from './server/instrumentation.js';
import './server/fetch.js';
import './server/browserContext.js';
import './server/chromium/crConnection.js';
import './server/page.js';
import './server/frames.js';
import './server/network.js';
import './server/dispatchers/webSocketRouteDispatcher.js';
import './server/chromium/crBrowser.js';
import './server/debugger.js';
import './server/android/android.js';
import './server/browser.js';
import './server/electron/electron.js';
import '../../../cloudflare/webSocketTransport.js';

class AndroidServerLauncherImpl {
  async launchServer(options = {}) {
    const playwright = createPlaywright({ sdkLanguage: "javascript", isServer: true });
    const controller = new ProgressController(serverSideCallMetadata(), playwright);
    let devices = await controller.run((progress) => playwright.android.devices(progress, {
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
    const path = options.wsPath ? options.wsPath.startsWith("/") ? options.wsPath : `/${options.wsPath}` : `/${createGuid()}`;
    const server = new PlaywrightServer({ mode: "launchServer", path, maxConnections: 1, preLaunchedAndroidDevice: device });
    const wsEndpoint = await server.listen(options.port, options.host);
    const browserServer = new ws.EventEmitter();
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

export { AndroidServerLauncherImpl };
