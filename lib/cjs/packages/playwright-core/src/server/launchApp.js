'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const fs = require('../../../../bundles/fs.js');
const path = require('node:path');
require('../../../../_virtual/pixelmatch.js');
require('../utilsBundle.js');
require('node:crypto');
const debug = require('./utils/debug.js');
require('./utils/debugLogger.js');
require('../zipBundle.js');
require('./utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('./utils/happyEyeballs.js');
require('./utils/nodePlatform.js');
require('node:child_process');
require('node:readline');
require('./utils/profiler.js');
require('./utils/socksProxy.js');
require('node:os');
require('./utils/zones.js');
const instrumentation = require('./instrumentation.js');
const index = require('./registry/index.js');
const progress = require('./progress.js');

async function launchApp(browserType, options) {
  const args = [...options.persistentContextOptions?.args ?? []];
  let channel = options.persistentContextOptions?.channel;
  if (browserType.name() === "chromium") {
    args.push(
      "--app=data:text/html,",
      `--window-size=${options.windowSize.width},${options.windowSize.height}`,
      ...options.windowPosition ? [`--window-position=${options.windowPosition.x},${options.windowPosition.y}`] : [],
      "--test-type="
    );
    if (!channel && !options.persistentContextOptions?.executablePath)
      channel = index.findChromiumChannel(options.sdkLanguage);
  }
  const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), browserType);
  const context = await controller.run((progress) => browserType.launchPersistentContext(progress, "", {
    ignoreDefaultArgs: ["--enable-automation"],
    ...options?.persistentContextOptions,
    channel,
    noDefaultViewport: options.persistentContextOptions?.noDefaultViewport ?? true,
    acceptDownloads: options?.persistentContextOptions?.acceptDownloads ?? (debug.isUnderTest() ? "accept" : "internal-browser-default"),
    colorScheme: options?.persistentContextOptions?.colorScheme ?? "no-override",
    args
  }), 0);
  const [page] = context.pages();
  if (browserType.name() === "chromium" && process.platform === "darwin") {
    context.on("page", async (newPage) => {
      if (newPage.mainFrame().url() === "chrome://new-tab-page/") {
        await page.bringToFront();
        await newPage.close();
      }
    });
  }
  if (browserType.name() === "chromium")
    await installAppIcon(page);
  return { context, page };
}
async function installAppIcon(page) {
  const icon = await fs.default.promises.readFile(require.resolve("./chromium/appIcon.png"));
  const crPage = page.delegate;
  await crPage._mainFrameSession._client.send("Browser.setDockTile", {
    image: icon.toString("base64")
  });
}
async function syncLocalStorageWithSettings(page, appName) {
  if (debug.isUnderTest())
    return;
  const settingsFile = path.join(index.registryDirectory, ".settings", `${appName}.json`);
  const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), page);
  await controller.run(async (progress) => {
    await page.exposeBinding(progress, "_saveSerializedSettings", false, (_, settings2) => {
      fs.default.mkdirSync(path.dirname(settingsFile), { recursive: true });
      fs.default.writeFileSync(settingsFile, settings2);
    });
    const settings = await fs.default.promises.readFile(settingsFile, "utf-8").catch(() => "{}");
    await page.addInitScript(
      progress,
      `(${String((settings2) => {
        if (location && location.protocol === "data:")
          return;
        if (window.top !== window)
          return;
        Object.entries(settings2).map(([k, v]) => localStorage[k] = v);
        window.saveSettings = () => {
          window._saveSerializedSettings(JSON.stringify({ ...localStorage }));
        };
      })})(${settings});
    `
    );
  });
}

exports.launchApp = launchApp;
exports.syncLocalStorageWithSettings = syncLocalStorageWithSettings;
