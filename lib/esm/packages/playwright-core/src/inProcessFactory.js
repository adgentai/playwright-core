import { AndroidServerLauncherImpl } from './androidServerImpl.js';
import { BrowserServerLauncherImpl } from './browserServerImpl.js';
import './server/registry/index.js';
import { DispatcherConnection, RootDispatcher } from './server/dispatchers/dispatcher.js';
import { PlaywrightDispatcher } from './server/dispatchers/playwrightDispatcher.js';
import { createPlaywright } from './server/playwright.js';
import '../../../bundles/fs.js';
import 'node:path';
import '../../../_virtual/pixelmatch.js';
import './utilsBundle.js';
import 'node:crypto';
import './server/utils/debug.js';
import './server/utils/debugLogger.js';
import './zipBundle.js';
import './server/utils/hostPlatform.js';
import 'node:http';
import 'node:http2';
import 'node:https';
import 'node:url';
import './server/utils/happyEyeballs.js';
import { nodePlatform } from './server/utils/nodePlatform.js';
import 'node:child_process';
import 'node:readline';
import './server/utils/profiler.js';
import './server/utils/socksProxy.js';
import 'node:os';
import './server/utils/zones.js';
import 'node:events';
import './protocol/serializers.js';
import { Connection } from './client/connection.js';

function createInProcessPlaywright() {
  const playwright = createPlaywright({ sdkLanguage: process.env.PW_LANG_NAME || "javascript" });
  const clientConnection = new Connection(nodePlatform);
  clientConnection.useRawBuffers();
  const dispatcherConnection = new DispatcherConnection(
    true
    /* local */
  );
  dispatcherConnection.onmessage = (message) => clientConnection.dispatch(message);
  clientConnection.onmessage = (message) => dispatcherConnection.dispatch(message);
  const rootScope = new RootDispatcher(dispatcherConnection);
  new PlaywrightDispatcher(rootScope, playwright);
  const playwrightAPI = clientConnection.getObjectWithKnownName("Playwright");
  playwrightAPI.chromium._serverLauncher = new BrowserServerLauncherImpl("chromium");
  playwrightAPI.firefox._serverLauncher = new BrowserServerLauncherImpl("firefox");
  playwrightAPI.webkit._serverLauncher = new BrowserServerLauncherImpl("webkit");
  playwrightAPI._android._serverLauncher = new AndroidServerLauncherImpl();
  playwrightAPI._bidiChromium._serverLauncher = new BrowserServerLauncherImpl("_bidiChromium");
  playwrightAPI._bidiFirefox._serverLauncher = new BrowserServerLauncherImpl("_bidiFirefox");
  dispatcherConnection.onmessage = (message) => setImmediate(() => clientConnection.dispatch(message));
  clientConnection.onmessage = (message) => setImmediate(() => dispatcherConnection.dispatch(message));
  clientConnection.toImpl = (x) => x ? dispatcherConnection._dispatcherByGuid.get(x._guid)._object : dispatcherConnection._dispatcherByGuid.get("");
  playwrightAPI._toImpl = clientConnection.toImpl;
  return playwrightAPI;
}

export { createInProcessPlaywright };
