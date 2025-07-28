'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const androidServerImpl = require('./androidServerImpl.js');
const browserServerImpl = require('./browserServerImpl.js');
require('./server/registry/index.js');
const dispatcher = require('./server/dispatchers/dispatcher.js');
const playwrightDispatcher = require('./server/dispatchers/playwrightDispatcher.js');
const playwright = require('./server/playwright.js');
require('../../../bundles/fs.js');
require('node:path');
require('../../../_virtual/pixelmatch.js');
require('./utilsBundle.js');
require('node:crypto');
require('./server/utils/debug.js');
require('./server/utils/debugLogger.js');
require('./zipBundle.js');
require('./server/utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./server/utils/happyEyeballs.js');
const nodePlatform = require('./server/utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./server/utils/profiler.js');
require('./server/utils/socksProxy.js');
require('node:os');
require('./server/utils/zones.js');
require('node:events');
require('./protocol/serializers.js');
const connection = require('./client/connection.js');

function createInProcessPlaywright() {
  const playwright$1 = playwright.createPlaywright({ sdkLanguage: process.env.PW_LANG_NAME || "javascript" });
  const clientConnection = new connection.Connection(nodePlatform.nodePlatform);
  clientConnection.useRawBuffers();
  const dispatcherConnection = new dispatcher.DispatcherConnection(
    true
    /* local */
  );
  dispatcherConnection.onmessage = (message) => clientConnection.dispatch(message);
  clientConnection.onmessage = (message) => dispatcherConnection.dispatch(message);
  const rootScope = new dispatcher.RootDispatcher(dispatcherConnection);
  new playwrightDispatcher.PlaywrightDispatcher(rootScope, playwright$1);
  const playwrightAPI = clientConnection.getObjectWithKnownName("Playwright");
  playwrightAPI.chromium._serverLauncher = new browserServerImpl.BrowserServerLauncherImpl("chromium");
  playwrightAPI.firefox._serverLauncher = new browserServerImpl.BrowserServerLauncherImpl("firefox");
  playwrightAPI.webkit._serverLauncher = new browserServerImpl.BrowserServerLauncherImpl("webkit");
  playwrightAPI._android._serverLauncher = new androidServerImpl.AndroidServerLauncherImpl();
  playwrightAPI._bidiChromium._serverLauncher = new browserServerImpl.BrowserServerLauncherImpl("_bidiChromium");
  playwrightAPI._bidiFirefox._serverLauncher = new browserServerImpl.BrowserServerLauncherImpl("_bidiFirefox");
  dispatcherConnection.onmessage = (message) => setImmediate(() => clientConnection.dispatch(message));
  clientConnection.onmessage = (message) => setImmediate(() => dispatcherConnection.dispatch(message));
  clientConnection.toImpl = (x) => x ? dispatcherConnection._dispatcherByGuid.get(x._guid)._object : dispatcherConnection._dispatcherByGuid.get("");
  playwrightAPI._toImpl = clientConnection.toImpl;
  return playwrightAPI;
}

exports.createInProcessPlaywright = createInProcessPlaywright;
