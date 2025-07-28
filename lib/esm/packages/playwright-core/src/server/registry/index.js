import { commonjsRequire } from '../../../../../_virtual/_commonjs-dynamic-modules.js';
import require$$0 from '../../../browsers.json.js';
import fs from '../../../../../bundles/fs.js';
import os from 'node:os';
import path from 'node:path';
import * as require$$0$2 from 'node:util';
import { logPolitely, downloadBrowserWithProgressBar } from './browserFetcher.js';
import { validateDependenciesLinux, validateDependenciesWindows, installDependenciesWindows, installDependenciesLinux, transformCommandsForRoot, readDockerVersionSync, dockerVersion } from './dependencies.js';
import { wrapInASCIIBox } from '../utils/ascii.js';
import '../../../../../_virtual/pixelmatch.js';
import { lockfile } from '../../utilsBundle.js';
import { calculateSha1 } from '../utils/crypto.js';
import '../utils/debug.js';
import { debugLogger } from '../utils/debugLogger.js';
import { getFromENV, getAsBooleanFromENV, getPackageManagerExecCommand } from '../utils/env.js';
import { existsAsync, removeFolders, canAccessFile } from '../utils/fileUtils.js';
import { hostPlatform, isOfficiallySupportedPlatform } from '../utils/hostPlatform.js';
import { fetchData, NET_DEFAULT_TIMEOUT } from '../utils/network.js';
import '../utils/nodePlatform.js';
import 'node:child_process';
import 'node:readline';
import '../utils/profiler.js';
import '../utils/socksProxy.js';
import { spawnAsync } from '../utils/spawnAsync.js';
import { getEmbedderName } from '../utils/userAgent.js';
import '../../zipBundle.js';
import '../utils/zones.js';

const PACKAGE_PATH = path.join("/home/runner/work/playwright/playwright/packages/playwright-cloudflare", "..", "..", "..");
const BIN_PATH = path.join("/home/runner/work/playwright/playwright/packages/playwright-cloudflare", "..", "..", "..", "bin");
const PLAYWRIGHT_CDN_MIRRORS = [
  "https://cdn.playwright.dev/dbazure/download/playwright",
  // ESRP CDN
  "https://playwright.download.prss.microsoft.com/dbazure/download/playwright",
  // Directly hit ESRP CDN
  "https://cdn.playwright.dev"
  // Hit the Storage Bucket directly
];
if (process.env.PW_TEST_CDN_THAT_SHOULD_WORK) {
  for (let i = 0; i < PLAYWRIGHT_CDN_MIRRORS.length; i++) {
    const cdn = PLAYWRIGHT_CDN_MIRRORS[i];
    if (cdn !== process.env.PW_TEST_CDN_THAT_SHOULD_WORK) {
      const parsedCDN = new URL(cdn);
      parsedCDN.hostname = parsedCDN.hostname + ".does-not-resolve.playwright.dev";
      PLAYWRIGHT_CDN_MIRRORS[i] = parsedCDN.toString();
    }
  }
}
const EXECUTABLE_PATHS = {
  "chromium": {
    "linux": ["chrome-linux", "chrome"],
    "mac": ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"],
    "win": ["chrome-win", "chrome.exe"]
  },
  "chromium-headless-shell": {
    "linux": ["chrome-linux", "headless_shell"],
    "mac": ["chrome-mac", "headless_shell"],
    "win": ["chrome-win", "headless_shell.exe"]
  },
  "firefox": {
    "linux": ["firefox", "firefox"],
    "mac": ["firefox", "Nightly.app", "Contents", "MacOS", "firefox"],
    "win": ["firefox", "firefox.exe"]
  },
  "webkit": {
    "linux": ["pw_run.sh"],
    "mac": ["pw_run.sh"],
    "win": ["Playwright.exe"]
  },
  "ffmpeg": {
    "linux": ["ffmpeg-linux"],
    "mac": ["ffmpeg-mac"],
    "win": ["ffmpeg-win64.exe"]
  },
  "winldd": {
    "linux": void 0,
    "mac": void 0,
    "win": ["PrintDeps.exe"]
  }
};
const DOWNLOAD_PATHS = {
  "chromium": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/chromium/%s/chromium-linux.zip",
    "ubuntu22.04-x64": "builds/chromium/%s/chromium-linux.zip",
    "ubuntu24.04-x64": "builds/chromium/%s/chromium-linux.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": "builds/chromium/%s/chromium-linux-arm64.zip",
    "ubuntu22.04-arm64": "builds/chromium/%s/chromium-linux-arm64.zip",
    "ubuntu24.04-arm64": "builds/chromium/%s/chromium-linux-arm64.zip",
    "debian11-x64": "builds/chromium/%s/chromium-linux.zip",
    "debian11-arm64": "builds/chromium/%s/chromium-linux-arm64.zip",
    "debian12-x64": "builds/chromium/%s/chromium-linux.zip",
    "debian12-arm64": "builds/chromium/%s/chromium-linux-arm64.zip",
    "mac10.13": "builds/chromium/%s/chromium-mac.zip",
    "mac10.14": "builds/chromium/%s/chromium-mac.zip",
    "mac10.15": "builds/chromium/%s/chromium-mac.zip",
    "mac11": "builds/chromium/%s/chromium-mac.zip",
    "mac11-arm64": "builds/chromium/%s/chromium-mac-arm64.zip",
    "mac12": "builds/chromium/%s/chromium-mac.zip",
    "mac12-arm64": "builds/chromium/%s/chromium-mac-arm64.zip",
    "mac13": "builds/chromium/%s/chromium-mac.zip",
    "mac13-arm64": "builds/chromium/%s/chromium-mac-arm64.zip",
    "mac14": "builds/chromium/%s/chromium-mac.zip",
    "mac14-arm64": "builds/chromium/%s/chromium-mac-arm64.zip",
    "mac15": "builds/chromium/%s/chromium-mac.zip",
    "mac15-arm64": "builds/chromium/%s/chromium-mac-arm64.zip",
    "win64": "builds/chromium/%s/chromium-win64.zip"
  },
  "chromium-headless-shell": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/chromium/%s/chromium-headless-shell-linux.zip",
    "ubuntu22.04-x64": "builds/chromium/%s/chromium-headless-shell-linux.zip",
    "ubuntu24.04-x64": "builds/chromium/%s/chromium-headless-shell-linux.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": "builds/chromium/%s/chromium-headless-shell-linux-arm64.zip",
    "ubuntu22.04-arm64": "builds/chromium/%s/chromium-headless-shell-linux-arm64.zip",
    "ubuntu24.04-arm64": "builds/chromium/%s/chromium-headless-shell-linux-arm64.zip",
    "debian11-x64": "builds/chromium/%s/chromium-headless-shell-linux.zip",
    "debian11-arm64": "builds/chromium/%s/chromium-headless-shell-linux-arm64.zip",
    "debian12-x64": "builds/chromium/%s/chromium-headless-shell-linux.zip",
    "debian12-arm64": "builds/chromium/%s/chromium-headless-shell-linux-arm64.zip",
    "mac10.13": void 0,
    "mac10.14": void 0,
    "mac10.15": void 0,
    "mac11": "builds/chromium/%s/chromium-headless-shell-mac.zip",
    "mac11-arm64": "builds/chromium/%s/chromium-headless-shell-mac-arm64.zip",
    "mac12": "builds/chromium/%s/chromium-headless-shell-mac.zip",
    "mac12-arm64": "builds/chromium/%s/chromium-headless-shell-mac-arm64.zip",
    "mac13": "builds/chromium/%s/chromium-headless-shell-mac.zip",
    "mac13-arm64": "builds/chromium/%s/chromium-headless-shell-mac-arm64.zip",
    "mac14": "builds/chromium/%s/chromium-headless-shell-mac.zip",
    "mac14-arm64": "builds/chromium/%s/chromium-headless-shell-mac-arm64.zip",
    "mac15": "builds/chromium/%s/chromium-headless-shell-mac.zip",
    "mac15-arm64": "builds/chromium/%s/chromium-headless-shell-mac-arm64.zip",
    "win64": "builds/chromium/%s/chromium-headless-shell-win64.zip"
  },
  "chromium-tip-of-tree": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip",
    "ubuntu22.04-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip",
    "ubuntu24.04-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip",
    "ubuntu22.04-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip",
    "ubuntu24.04-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip",
    "debian11-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip",
    "debian11-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip",
    "debian12-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip",
    "debian12-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip",
    "mac10.13": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip",
    "mac10.14": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip",
    "mac10.15": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip",
    "mac11": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip",
    "mac11-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac-arm64.zip",
    "mac12": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip",
    "mac12-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac-arm64.zip",
    "mac13": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip",
    "mac13-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac-arm64.zip",
    "mac14": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip",
    "mac14-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac-arm64.zip",
    "mac15": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip",
    "mac15-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac-arm64.zip",
    "win64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-win64.zip"
  },
  "chromium-tip-of-tree-headless-shell": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux.zip",
    "ubuntu22.04-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux.zip",
    "ubuntu24.04-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux-arm64.zip",
    "ubuntu22.04-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux-arm64.zip",
    "ubuntu24.04-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux-arm64.zip",
    "debian11-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux.zip",
    "debian11-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux-arm64.zip",
    "debian12-x64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux.zip",
    "debian12-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-linux-arm64.zip",
    "mac10.13": void 0,
    "mac10.14": void 0,
    "mac10.15": void 0,
    "mac11": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac.zip",
    "mac11-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac-arm64.zip",
    "mac12": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac.zip",
    "mac12-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac-arm64.zip",
    "mac13": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac.zip",
    "mac13-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac-arm64.zip",
    "mac14": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac.zip",
    "mac14-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac-arm64.zip",
    "mac15": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac.zip",
    "mac15-arm64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-mac-arm64.zip",
    "win64": "builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-headless-shell-win64.zip"
  },
  "firefox": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/firefox/%s/firefox-ubuntu-20.04.zip",
    "ubuntu22.04-x64": "builds/firefox/%s/firefox-ubuntu-22.04.zip",
    "ubuntu24.04-x64": "builds/firefox/%s/firefox-ubuntu-24.04.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": "builds/firefox/%s/firefox-ubuntu-20.04-arm64.zip",
    "ubuntu22.04-arm64": "builds/firefox/%s/firefox-ubuntu-22.04-arm64.zip",
    "ubuntu24.04-arm64": "builds/firefox/%s/firefox-ubuntu-24.04-arm64.zip",
    "debian11-x64": "builds/firefox/%s/firefox-debian-11.zip",
    "debian11-arm64": "builds/firefox/%s/firefox-debian-11-arm64.zip",
    "debian12-x64": "builds/firefox/%s/firefox-debian-12.zip",
    "debian12-arm64": "builds/firefox/%s/firefox-debian-12-arm64.zip",
    "mac10.13": "builds/firefox/%s/firefox-mac.zip",
    "mac10.14": "builds/firefox/%s/firefox-mac.zip",
    "mac10.15": "builds/firefox/%s/firefox-mac.zip",
    "mac11": "builds/firefox/%s/firefox-mac.zip",
    "mac11-arm64": "builds/firefox/%s/firefox-mac-arm64.zip",
    "mac12": "builds/firefox/%s/firefox-mac.zip",
    "mac12-arm64": "builds/firefox/%s/firefox-mac-arm64.zip",
    "mac13": "builds/firefox/%s/firefox-mac.zip",
    "mac13-arm64": "builds/firefox/%s/firefox-mac-arm64.zip",
    "mac14": "builds/firefox/%s/firefox-mac.zip",
    "mac14-arm64": "builds/firefox/%s/firefox-mac-arm64.zip",
    "mac15": "builds/firefox/%s/firefox-mac.zip",
    "mac15-arm64": "builds/firefox/%s/firefox-mac-arm64.zip",
    "win64": "builds/firefox/%s/firefox-win64.zip"
  },
  "firefox-beta": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/firefox-beta/%s/firefox-beta-ubuntu-20.04.zip",
    "ubuntu22.04-x64": "builds/firefox-beta/%s/firefox-beta-ubuntu-22.04.zip",
    "ubuntu24.04-x64": "builds/firefox-beta/%s/firefox-beta-ubuntu-24.04.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": void 0,
    "ubuntu22.04-arm64": "builds/firefox-beta/%s/firefox-beta-ubuntu-22.04-arm64.zip",
    "ubuntu24.04-arm64": "builds/firefox-beta/%s/firefox-beta-ubuntu-24.04-arm64.zip",
    "debian11-x64": "builds/firefox-beta/%s/firefox-beta-debian-11.zip",
    "debian11-arm64": "builds/firefox-beta/%s/firefox-beta-debian-11-arm64.zip",
    "debian12-x64": "builds/firefox-beta/%s/firefox-beta-debian-12.zip",
    "debian12-arm64": "builds/firefox-beta/%s/firefox-beta-debian-12-arm64.zip",
    "mac10.13": "builds/firefox-beta/%s/firefox-beta-mac.zip",
    "mac10.14": "builds/firefox-beta/%s/firefox-beta-mac.zip",
    "mac10.15": "builds/firefox-beta/%s/firefox-beta-mac.zip",
    "mac11": "builds/firefox-beta/%s/firefox-beta-mac.zip",
    "mac11-arm64": "builds/firefox-beta/%s/firefox-beta-mac-arm64.zip",
    "mac12": "builds/firefox-beta/%s/firefox-beta-mac.zip",
    "mac12-arm64": "builds/firefox-beta/%s/firefox-beta-mac-arm64.zip",
    "mac13": "builds/firefox-beta/%s/firefox-beta-mac.zip",
    "mac13-arm64": "builds/firefox-beta/%s/firefox-beta-mac-arm64.zip",
    "mac14": "builds/firefox-beta/%s/firefox-beta-mac.zip",
    "mac14-arm64": "builds/firefox-beta/%s/firefox-beta-mac-arm64.zip",
    "mac15": "builds/firefox-beta/%s/firefox-beta-mac.zip",
    "mac15-arm64": "builds/firefox-beta/%s/firefox-beta-mac-arm64.zip",
    "win64": "builds/firefox-beta/%s/firefox-beta-win64.zip"
  },
  "webkit": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/webkit/%s/webkit-ubuntu-20.04.zip",
    "ubuntu22.04-x64": "builds/webkit/%s/webkit-ubuntu-22.04.zip",
    "ubuntu24.04-x64": "builds/webkit/%s/webkit-ubuntu-24.04.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": "builds/webkit/%s/webkit-ubuntu-20.04-arm64.zip",
    "ubuntu22.04-arm64": "builds/webkit/%s/webkit-ubuntu-22.04-arm64.zip",
    "ubuntu24.04-arm64": "builds/webkit/%s/webkit-ubuntu-24.04-arm64.zip",
    "debian11-x64": "builds/webkit/%s/webkit-debian-11.zip",
    "debian11-arm64": "builds/webkit/%s/webkit-debian-11-arm64.zip",
    "debian12-x64": "builds/webkit/%s/webkit-debian-12.zip",
    "debian12-arm64": "builds/webkit/%s/webkit-debian-12-arm64.zip",
    "mac10.13": void 0,
    "mac10.14": "builds/deprecated-webkit-mac-10.14/%s/deprecated-webkit-mac-10.14.zip",
    "mac10.15": "builds/deprecated-webkit-mac-10.15/%s/deprecated-webkit-mac-10.15.zip",
    "mac11": "builds/webkit/%s/webkit-mac-11.zip",
    "mac11-arm64": "builds/webkit/%s/webkit-mac-11-arm64.zip",
    "mac12": "builds/webkit/%s/webkit-mac-12.zip",
    "mac12-arm64": "builds/webkit/%s/webkit-mac-12-arm64.zip",
    "mac13": "builds/webkit/%s/webkit-mac-13.zip",
    "mac13-arm64": "builds/webkit/%s/webkit-mac-13-arm64.zip",
    "mac14": "builds/webkit/%s/webkit-mac-14.zip",
    "mac14-arm64": "builds/webkit/%s/webkit-mac-14-arm64.zip",
    "mac15": "builds/webkit/%s/webkit-mac-15.zip",
    "mac15-arm64": "builds/webkit/%s/webkit-mac-15-arm64.zip",
    "win64": "builds/webkit/%s/webkit-win64.zip"
  },
  "ffmpeg": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/ffmpeg/%s/ffmpeg-linux.zip",
    "ubuntu22.04-x64": "builds/ffmpeg/%s/ffmpeg-linux.zip",
    "ubuntu24.04-x64": "builds/ffmpeg/%s/ffmpeg-linux.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": "builds/ffmpeg/%s/ffmpeg-linux-arm64.zip",
    "ubuntu22.04-arm64": "builds/ffmpeg/%s/ffmpeg-linux-arm64.zip",
    "ubuntu24.04-arm64": "builds/ffmpeg/%s/ffmpeg-linux-arm64.zip",
    "debian11-x64": "builds/ffmpeg/%s/ffmpeg-linux.zip",
    "debian11-arm64": "builds/ffmpeg/%s/ffmpeg-linux-arm64.zip",
    "debian12-x64": "builds/ffmpeg/%s/ffmpeg-linux.zip",
    "debian12-arm64": "builds/ffmpeg/%s/ffmpeg-linux-arm64.zip",
    "mac10.13": "builds/ffmpeg/%s/ffmpeg-mac.zip",
    "mac10.14": "builds/ffmpeg/%s/ffmpeg-mac.zip",
    "mac10.15": "builds/ffmpeg/%s/ffmpeg-mac.zip",
    "mac11": "builds/ffmpeg/%s/ffmpeg-mac.zip",
    "mac11-arm64": "builds/ffmpeg/%s/ffmpeg-mac-arm64.zip",
    "mac12": "builds/ffmpeg/%s/ffmpeg-mac.zip",
    "mac12-arm64": "builds/ffmpeg/%s/ffmpeg-mac-arm64.zip",
    "mac13": "builds/ffmpeg/%s/ffmpeg-mac.zip",
    "mac13-arm64": "builds/ffmpeg/%s/ffmpeg-mac-arm64.zip",
    "mac14": "builds/ffmpeg/%s/ffmpeg-mac.zip",
    "mac14-arm64": "builds/ffmpeg/%s/ffmpeg-mac-arm64.zip",
    "mac15": "builds/ffmpeg/%s/ffmpeg-mac.zip",
    "mac15-arm64": "builds/ffmpeg/%s/ffmpeg-mac-arm64.zip",
    "win64": "builds/ffmpeg/%s/ffmpeg-win64.zip"
  },
  "winldd": {
    "<unknown>": void 0,
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": void 0,
    "ubuntu22.04-x64": void 0,
    "ubuntu24.04-x64": void 0,
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": void 0,
    "ubuntu22.04-arm64": void 0,
    "ubuntu24.04-arm64": void 0,
    "debian11-x64": void 0,
    "debian11-arm64": void 0,
    "debian12-x64": void 0,
    "debian12-arm64": void 0,
    "mac10.13": void 0,
    "mac10.14": void 0,
    "mac10.15": void 0,
    "mac11": void 0,
    "mac11-arm64": void 0,
    "mac12": void 0,
    "mac12-arm64": void 0,
    "mac13": void 0,
    "mac13-arm64": void 0,
    "mac14": void 0,
    "mac14-arm64": void 0,
    "mac15": void 0,
    "mac15-arm64": void 0,
    "win64": "builds/winldd/%s/winldd-win64.zip"
  },
  "android": {
    "<unknown>": "builds/android/%s/android.zip",
    "ubuntu18.04-x64": void 0,
    "ubuntu20.04-x64": "builds/android/%s/android.zip",
    "ubuntu22.04-x64": "builds/android/%s/android.zip",
    "ubuntu24.04-x64": "builds/android/%s/android.zip",
    "ubuntu18.04-arm64": void 0,
    "ubuntu20.04-arm64": "builds/android/%s/android.zip",
    "ubuntu22.04-arm64": "builds/android/%s/android.zip",
    "ubuntu24.04-arm64": "builds/android/%s/android.zip",
    "debian11-x64": "builds/android/%s/android.zip",
    "debian11-arm64": "builds/android/%s/android.zip",
    "debian12-x64": "builds/android/%s/android.zip",
    "debian12-arm64": "builds/android/%s/android.zip",
    "mac10.13": "builds/android/%s/android.zip",
    "mac10.14": "builds/android/%s/android.zip",
    "mac10.15": "builds/android/%s/android.zip",
    "mac11": "builds/android/%s/android.zip",
    "mac11-arm64": "builds/android/%s/android.zip",
    "mac12": "builds/android/%s/android.zip",
    "mac12-arm64": "builds/android/%s/android.zip",
    "mac13": "builds/android/%s/android.zip",
    "mac13-arm64": "builds/android/%s/android.zip",
    "mac14": "builds/android/%s/android.zip",
    "mac14-arm64": "builds/android/%s/android.zip",
    "mac15": "builds/android/%s/android.zip",
    "mac15-arm64": "builds/android/%s/android.zip",
    "win64": "builds/android/%s/android.zip"
  },
  // TODO(bidi): implement downloads.
  "_bidiFirefox": {},
  "_bidiChromium": {}
};
const registryDirectory = (() => {
  let result;
  const envDefined = getFromENV("PLAYWRIGHT_BROWSERS_PATH");
  if (envDefined === "0") {
    result = path.join("/home/runner/work/playwright/playwright/packages/playwright-cloudflare", "..", "..", "..", ".local-browsers");
  } else if (envDefined) {
    result = envDefined;
  } else {
    let cacheDirectory;
    if (process.platform === "linux")
      cacheDirectory = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
    else if (process.platform === "darwin")
      cacheDirectory = path.join(os.homedir(), "Library", "Caches");
    else if (process.platform === "win32")
      cacheDirectory = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    else
      throw new Error("Unsupported platform: " + process.platform);
    result = path.join(cacheDirectory, "ms-playwright");
  }
  if (!path.isAbsolute(result)) {
    result = path.resolve(getFromENV("INIT_CWD") || process.cwd(), result);
  }
  return result;
})();
function isBrowserDirectory(browserDirectory) {
  const baseName = path.basename(browserDirectory);
  for (const browserName of allDownloadable) {
    if (baseName.startsWith(browserName.replace(/-/g, "_") + "-"))
      return true;
  }
  return false;
}
function readDescriptors(browsersJSON) {
  return browsersJSON["browsers"].map((obj) => {
    const name = obj.name;
    const revisionOverride = (obj.revisionOverrides || {})[hostPlatform];
    const revision = revisionOverride || obj.revision;
    const browserDirectoryPrefix = revisionOverride ? `${name}_${hostPlatform}_special` : `${name}`;
    const descriptor = {
      name,
      revision,
      hasRevisionOverride: !!revisionOverride,
      // We only put browser version for the supported operating systems.
      browserVersion: revisionOverride ? void 0 : obj.browserVersion,
      installByDefault: !!obj.installByDefault,
      // Method `isBrowserDirectory` determines directory to be browser iff
      // it starts with some browser name followed by '-'. Some browser names
      // are prefixes of others, e.g. 'webkit' is a prefix of `webkit-technology-preview`.
      // To avoid older registries erroneously removing 'webkit-technology-preview', we have to
      // ensure that browser folders to never include dashes inside.
      dir: path.join(registryDirectory, browserDirectoryPrefix.replace(/-/g, "_") + "-" + revision)
    };
    return descriptor;
  });
}
const allDownloadable = ["android", "chromium", "firefox", "webkit", "ffmpeg", "firefox-beta", "chromium-tip-of-tree", "chromium-headless-shell", "chromium-tip-of-tree-headless-shell"];
class Registry {
  constructor(browsersJSON) {
    const descriptors = readDescriptors(browsersJSON);
    const findExecutablePath = (dir, name) => {
      let tokens = void 0;
      if (process.platform === "linux")
        tokens = EXECUTABLE_PATHS[name]["linux"];
      else if (process.platform === "darwin")
        tokens = EXECUTABLE_PATHS[name]["mac"];
      else if (process.platform === "win32")
        tokens = EXECUTABLE_PATHS[name]["win"];
      return tokens ? path.join(dir, ...tokens) : void 0;
    };
    const executablePathOrDie = (name, e, installByDefault, sdkLanguage) => {
      if (!e)
        throw new Error(`${name} is not supported on ${hostPlatform}`);
      const installCommand = buildPlaywrightCLICommand(sdkLanguage, `install${installByDefault ? "" : " " + name}`);
      if (!canAccessFile(e)) {
        const currentDockerVersion = readDockerVersionSync();
        const preferredDockerVersion = currentDockerVersion ? dockerVersion(currentDockerVersion.dockerImageNameTemplate) : null;
        const isOutdatedDockerImage = currentDockerVersion && preferredDockerVersion && currentDockerVersion.dockerImageName !== preferredDockerVersion.dockerImageName;
        const prettyMessage = isOutdatedDockerImage ? [
          `Looks like ${sdkLanguage === "javascript" ? "Playwright Test or " : ""}Playwright was just updated to ${preferredDockerVersion.driverVersion}.`,
          `Please update docker image as well.`,
          `-  current: ${currentDockerVersion.dockerImageName}`,
          `- required: ${preferredDockerVersion.dockerImageName}`,
          ``,
          `<3 Playwright Team`
        ].join("\n") : [
          `Looks like ${sdkLanguage === "javascript" ? "Playwright Test or " : ""}Playwright was just installed or updated.`,
          `Please run the following command to download new browser${installByDefault ? "s" : ""}:`,
          ``,
          `    ${installCommand}`,
          ``,
          `<3 Playwright Team`
        ].join("\n");
        throw new Error(`Executable doesn't exist at ${e}
${wrapInASCIIBox(prettyMessage, 1)}`);
      }
      return e;
    };
    this._executables = [];
    const chromium = descriptors.find((d) => d.name === "chromium");
    const chromiumExecutable = findExecutablePath(chromium.dir, "chromium");
    this._executables.push({
      type: "browser",
      name: "chromium",
      browserName: "chromium",
      directory: chromium.dir,
      executablePath: () => chromiumExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("chromium", chromiumExecutable, chromium.installByDefault, sdkLanguage),
      installType: chromium.installByDefault ? "download-by-default" : "download-on-demand",
      _validateHostRequirements: (sdkLanguage) => this._validateHostRequirements(sdkLanguage, chromium.dir, ["chrome-linux"], [], ["chrome-win"]),
      downloadURLs: this._downloadURLs(chromium),
      browserVersion: chromium.browserVersion,
      _install: () => this._downloadExecutable(chromium, chromiumExecutable),
      _dependencyGroup: "chromium",
      _isHermeticInstallation: true
    });
    const chromiumHeadlessShell = descriptors.find((d) => d.name === "chromium-headless-shell");
    const chromiumHeadlessShellExecutable = findExecutablePath(chromiumHeadlessShell.dir, "chromium-headless-shell");
    this._executables.push({
      type: "channel",
      name: "chromium-headless-shell",
      browserName: "chromium",
      directory: chromiumHeadlessShell.dir,
      executablePath: () => chromiumHeadlessShellExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("chromium", chromiumHeadlessShellExecutable, chromiumHeadlessShell.installByDefault, sdkLanguage),
      installType: chromiumHeadlessShell.installByDefault ? "download-by-default" : "download-on-demand",
      _validateHostRequirements: (sdkLanguage) => this._validateHostRequirements(sdkLanguage, chromiumHeadlessShell.dir, ["chrome-linux"], [], ["chrome-win"]),
      downloadURLs: this._downloadURLs(chromiumHeadlessShell),
      browserVersion: chromium.browserVersion,
      _install: () => this._downloadExecutable(chromiumHeadlessShell, chromiumHeadlessShellExecutable),
      _dependencyGroup: "chromium",
      _isHermeticInstallation: true
    });
    const chromiumTipOfTreeHeadlessShell = descriptors.find((d) => d.name === "chromium-tip-of-tree-headless-shell");
    const chromiumTipOfTreeHeadlessShellExecutable = findExecutablePath(chromiumTipOfTreeHeadlessShell.dir, "chromium-headless-shell");
    this._executables.push({
      type: "channel",
      name: "chromium-tip-of-tree-headless-shell",
      browserName: "chromium",
      directory: chromiumTipOfTreeHeadlessShell.dir,
      executablePath: () => chromiumTipOfTreeHeadlessShellExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("chromium", chromiumTipOfTreeHeadlessShellExecutable, chromiumTipOfTreeHeadlessShell.installByDefault, sdkLanguage),
      installType: chromiumTipOfTreeHeadlessShell.installByDefault ? "download-by-default" : "download-on-demand",
      _validateHostRequirements: (sdkLanguage) => this._validateHostRequirements(sdkLanguage, chromiumTipOfTreeHeadlessShell.dir, ["chrome-linux"], [], ["chrome-win"]),
      downloadURLs: this._downloadURLs(chromiumTipOfTreeHeadlessShell),
      browserVersion: chromium.browserVersion,
      _install: () => this._downloadExecutable(chromiumTipOfTreeHeadlessShell, chromiumTipOfTreeHeadlessShellExecutable),
      _dependencyGroup: "chromium",
      _isHermeticInstallation: true
    });
    const chromiumTipOfTree = descriptors.find((d) => d.name === "chromium-tip-of-tree");
    const chromiumTipOfTreeExecutable = findExecutablePath(chromiumTipOfTree.dir, "chromium");
    this._executables.push({
      type: "tool",
      name: "chromium-tip-of-tree",
      browserName: "chromium",
      directory: chromiumTipOfTree.dir,
      executablePath: () => chromiumTipOfTreeExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("chromium-tip-of-tree", chromiumTipOfTreeExecutable, chromiumTipOfTree.installByDefault, sdkLanguage),
      installType: chromiumTipOfTree.installByDefault ? "download-by-default" : "download-on-demand",
      _validateHostRequirements: (sdkLanguage) => this._validateHostRequirements(sdkLanguage, chromiumTipOfTree.dir, ["chrome-linux"], [], ["chrome-win"]),
      downloadURLs: this._downloadURLs(chromiumTipOfTree),
      browserVersion: chromiumTipOfTree.browserVersion,
      _install: () => this._downloadExecutable(chromiumTipOfTree, chromiumTipOfTreeExecutable),
      _dependencyGroup: "chromium",
      _isHermeticInstallation: true
    });
    this._executables.push(this._createChromiumChannel("chrome", {
      "linux": "/opt/google/chrome/chrome",
      "darwin": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "win32": `\\Google\\Chrome\\Application\\chrome.exe`
    }, () => this._installChromiumChannel("chrome", {
      "linux": "reinstall_chrome_stable_linux.sh",
      "darwin": "reinstall_chrome_stable_mac.sh",
      "win32": "reinstall_chrome_stable_win.ps1"
    })));
    this._executables.push(this._createChromiumChannel("chrome-beta", {
      "linux": "/opt/google/chrome-beta/chrome",
      "darwin": "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
      "win32": `\\Google\\Chrome Beta\\Application\\chrome.exe`
    }, () => this._installChromiumChannel("chrome-beta", {
      "linux": "reinstall_chrome_beta_linux.sh",
      "darwin": "reinstall_chrome_beta_mac.sh",
      "win32": "reinstall_chrome_beta_win.ps1"
    })));
    this._executables.push(this._createChromiumChannel("chrome-dev", {
      "linux": "/opt/google/chrome-unstable/chrome",
      "darwin": "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev",
      "win32": `\\Google\\Chrome Dev\\Application\\chrome.exe`
    }));
    this._executables.push(this._createChromiumChannel("chrome-canary", {
      "linux": "",
      "darwin": "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      "win32": `\\Google\\Chrome SxS\\Application\\chrome.exe`
    }));
    this._executables.push(this._createChromiumChannel("msedge", {
      "linux": "/opt/microsoft/msedge/msedge",
      "darwin": "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "win32": `\\Microsoft\\Edge\\Application\\msedge.exe`
    }, () => this._installMSEdgeChannel("msedge", {
      "linux": "reinstall_msedge_stable_linux.sh",
      "darwin": "reinstall_msedge_stable_mac.sh",
      "win32": "reinstall_msedge_stable_win.ps1"
    })));
    this._executables.push(this._createChromiumChannel("msedge-beta", {
      "linux": "/opt/microsoft/msedge-beta/msedge",
      "darwin": "/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta",
      "win32": `\\Microsoft\\Edge Beta\\Application\\msedge.exe`
    }, () => this._installMSEdgeChannel("msedge-beta", {
      "darwin": "reinstall_msedge_beta_mac.sh",
      "linux": "reinstall_msedge_beta_linux.sh",
      "win32": "reinstall_msedge_beta_win.ps1"
    })));
    this._executables.push(this._createChromiumChannel("msedge-dev", {
      "linux": "/opt/microsoft/msedge-dev/msedge",
      "darwin": "/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev",
      "win32": `\\Microsoft\\Edge Dev\\Application\\msedge.exe`
    }, () => this._installMSEdgeChannel("msedge-dev", {
      "darwin": "reinstall_msedge_dev_mac.sh",
      "linux": "reinstall_msedge_dev_linux.sh",
      "win32": "reinstall_msedge_dev_win.ps1"
    })));
    this._executables.push(this._createChromiumChannel("msedge-canary", {
      "linux": "",
      "darwin": "/Applications/Microsoft Edge Canary.app/Contents/MacOS/Microsoft Edge Canary",
      "win32": `\\Microsoft\\Edge SxS\\Application\\msedge.exe`
    }));
    this._executables.push(this._createBidiFirefoxChannel("moz-firefox", {
      "linux": "/snap/bin/firefox",
      "darwin": "/Applications/Firefox.app/Contents/MacOS/firefox",
      "win32": "\\Mozilla Firefox\\firefox.exe"
    }));
    this._executables.push(this._createBidiFirefoxChannel("moz-firefox-beta", {
      "linux": "/opt/firefox-beta/firefox",
      "darwin": "/Applications/Firefox.app/Contents/MacOS/firefox",
      "win32": "\\Mozilla Firefox\\firefox.exe"
    }));
    this._executables.push(this._createBidiFirefoxChannel("moz-firefox-nightly", {
      "linux": "/opt/firefox-nightly/firefox",
      "darwin": "/Applications/Firefox Nightly.app/Contents/MacOS/firefox",
      "win32": "\\Mozilla Firefox\\firefox.exe"
    }));
    this._executables.push(this._createBidiChromiumChannel("bidi-chrome-stable", {
      "linux": "/opt/google/chrome/chrome",
      "darwin": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "win32": `\\Google\\Chrome\\Application\\chrome.exe`
    }));
    this._executables.push(this._createBidiChromiumChannel("bidi-chrome-canary", {
      "linux": "",
      "darwin": "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      "win32": `\\Google\\Chrome SxS\\Application\\chrome.exe`
    }));
    this._executables.push({
      type: "browser",
      name: "_bidiChromium",
      browserName: "_bidiChromium",
      directory: chromium.dir,
      executablePath: () => chromiumExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("chromium", chromiumExecutable, chromium.installByDefault, sdkLanguage),
      installType: "download-on-demand",
      _validateHostRequirements: (sdkLanguage) => this._validateHostRequirements(sdkLanguage, chromium.dir, ["chrome-linux"], [], ["chrome-win"]),
      downloadURLs: this._downloadURLs(chromium),
      browserVersion: chromium.browserVersion,
      _install: () => this._downloadExecutable(chromium, chromiumExecutable),
      _dependencyGroup: "chromium",
      _isHermeticInstallation: true
    });
    const firefox = descriptors.find((d) => d.name === "firefox");
    const firefoxExecutable = findExecutablePath(firefox.dir, "firefox");
    this._executables.push({
      type: "browser",
      name: "firefox",
      browserName: "firefox",
      directory: firefox.dir,
      executablePath: () => firefoxExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("firefox", firefoxExecutable, firefox.installByDefault, sdkLanguage),
      installType: firefox.installByDefault ? "download-by-default" : "download-on-demand",
      _validateHostRequirements: (sdkLanguage) => this._validateHostRequirements(sdkLanguage, firefox.dir, ["firefox"], [], ["firefox"]),
      downloadURLs: this._downloadURLs(firefox),
      browserVersion: firefox.browserVersion,
      _install: () => this._downloadExecutable(firefox, firefoxExecutable),
      _dependencyGroup: "firefox",
      _isHermeticInstallation: true
    });
    const firefoxBeta = descriptors.find((d) => d.name === "firefox-beta");
    const firefoxBetaExecutable = findExecutablePath(firefoxBeta.dir, "firefox");
    this._executables.push({
      type: "tool",
      name: "firefox-beta",
      browserName: "firefox",
      directory: firefoxBeta.dir,
      executablePath: () => firefoxBetaExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("firefox-beta", firefoxBetaExecutable, firefoxBeta.installByDefault, sdkLanguage),
      installType: firefoxBeta.installByDefault ? "download-by-default" : "download-on-demand",
      _validateHostRequirements: (sdkLanguage) => this._validateHostRequirements(sdkLanguage, firefoxBeta.dir, ["firefox"], [], ["firefox"]),
      downloadURLs: this._downloadURLs(firefoxBeta),
      browserVersion: firefoxBeta.browserVersion,
      _install: () => this._downloadExecutable(firefoxBeta, firefoxBetaExecutable),
      _dependencyGroup: "firefox",
      _isHermeticInstallation: true
    });
    const webkit = descriptors.find((d) => d.name === "webkit");
    const webkitExecutable = findExecutablePath(webkit.dir, "webkit");
    const webkitLinuxLddDirectories = [
      path.join("minibrowser-gtk"),
      path.join("minibrowser-gtk", "bin"),
      path.join("minibrowser-gtk", "lib"),
      path.join("minibrowser-gtk", "sys", "lib"),
      path.join("minibrowser-wpe"),
      path.join("minibrowser-wpe", "bin"),
      path.join("minibrowser-wpe", "lib"),
      path.join("minibrowser-wpe", "sys", "lib")
    ];
    this._executables.push({
      type: "browser",
      name: "webkit",
      browserName: "webkit",
      directory: webkit.dir,
      executablePath: () => webkitExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("webkit", webkitExecutable, webkit.installByDefault, sdkLanguage),
      installType: webkit.installByDefault ? "download-by-default" : "download-on-demand",
      _validateHostRequirements: (sdkLanguage) => this._validateHostRequirements(sdkLanguage, webkit.dir, webkitLinuxLddDirectories, ["libGLESv2.so.2", "libx264.so"], [""]),
      downloadURLs: this._downloadURLs(webkit),
      browserVersion: webkit.browserVersion,
      _install: () => this._downloadExecutable(webkit, webkitExecutable),
      _dependencyGroup: "webkit",
      _isHermeticInstallation: true
    });
    const ffmpeg = descriptors.find((d) => d.name === "ffmpeg");
    const ffmpegExecutable = findExecutablePath(ffmpeg.dir, "ffmpeg");
    this._executables.push({
      type: "tool",
      name: "ffmpeg",
      browserName: void 0,
      directory: ffmpeg.dir,
      executablePath: () => ffmpegExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("ffmpeg", ffmpegExecutable, ffmpeg.installByDefault, sdkLanguage),
      installType: ffmpeg.installByDefault ? "download-by-default" : "download-on-demand",
      _validateHostRequirements: () => Promise.resolve(),
      downloadURLs: this._downloadURLs(ffmpeg),
      _install: () => this._downloadExecutable(ffmpeg, ffmpegExecutable),
      _dependencyGroup: "tools",
      _isHermeticInstallation: true
    });
    const winldd = descriptors.find((d) => d.name === "winldd");
    const winlddExecutable = findExecutablePath(winldd.dir, "winldd");
    this._executables.push({
      type: "tool",
      name: "winldd",
      browserName: void 0,
      directory: winldd.dir,
      executablePath: () => winlddExecutable,
      executablePathOrDie: (sdkLanguage) => executablePathOrDie("winldd", winlddExecutable, winldd.installByDefault, sdkLanguage),
      installType: process.platform === "win32" ? "download-by-default" : "none",
      _validateHostRequirements: () => Promise.resolve(),
      downloadURLs: this._downloadURLs(winldd),
      _install: () => this._downloadExecutable(winldd, winlddExecutable),
      _dependencyGroup: "tools",
      _isHermeticInstallation: true
    });
    const android = descriptors.find((d) => d.name === "android");
    this._executables.push({
      type: "tool",
      name: "android",
      browserName: void 0,
      directory: android.dir,
      executablePath: () => void 0,
      executablePathOrDie: () => "",
      installType: "download-on-demand",
      _validateHostRequirements: () => Promise.resolve(),
      downloadURLs: this._downloadURLs(android),
      _install: () => this._downloadExecutable(android),
      _dependencyGroup: "tools",
      _isHermeticInstallation: true
    });
  }
  _createChromiumChannel(name, lookAt, install) {
    const executablePath = (sdkLanguage, shouldThrow) => {
      const suffix = lookAt[process.platform];
      if (!suffix) {
        if (shouldThrow)
          throw new Error(`Chromium distribution '${name}' is not supported on ${process.platform}`);
        return void 0;
      }
      const prefixes = process.platform === "win32" ? [
        process.env.LOCALAPPDATA,
        process.env.PROGRAMFILES,
        process.env["PROGRAMFILES(X86)"],
        // In some cases there is no PROGRAMFILES/(86) env var set but HOMEDRIVE is set.
        process.env.HOMEDRIVE + "\\Program Files",
        process.env.HOMEDRIVE + "\\Program Files (x86)"
      ].filter(Boolean) : [""];
      for (const prefix of prefixes) {
        const executablePath2 = path.join(prefix, suffix);
        if (canAccessFile(executablePath2))
          return executablePath2;
      }
      if (!shouldThrow)
        return void 0;
      const location = prefixes.length ? ` at ${path.join(prefixes[0], suffix)}` : ``;
      const installation = install ? `
Run "${buildPlaywrightCLICommand(sdkLanguage, "install " + name)}"` : "";
      throw new Error(`Chromium distribution '${name}' is not found${location}${installation}`);
    };
    return {
      type: "channel",
      name,
      browserName: "chromium",
      directory: void 0,
      executablePath: (sdkLanguage) => executablePath(sdkLanguage, false),
      executablePathOrDie: (sdkLanguage) => executablePath(sdkLanguage, true),
      installType: install ? "install-script" : "none",
      _validateHostRequirements: () => Promise.resolve(),
      _isHermeticInstallation: false,
      _install: install
    };
  }
  _createBidiFirefoxChannel(name, lookAt, install) {
    const executablePath = (sdkLanguage, shouldThrow) => {
      const suffix = lookAt[process.platform];
      if (!suffix) {
        if (shouldThrow)
          throw new Error(`Firefox distribution '${name}' is not supported on ${process.platform}`);
        return void 0;
      }
      const prefixes = process.platform === "win32" ? [
        process.env.LOCALAPPDATA,
        process.env.PROGRAMFILES,
        process.env["PROGRAMFILES(X86)"],
        // In some cases there is no PROGRAMFILES/(86) env var set but HOMEDRIVE is set.
        process.env.HOMEDRIVE + "\\Program Files",
        process.env.HOMEDRIVE + "\\Program Files (x86)"
      ].filter(Boolean) : [""];
      for (const prefix of prefixes) {
        const executablePath2 = path.join(prefix, suffix);
        if (canAccessFile(executablePath2))
          return executablePath2;
      }
      if (shouldThrow)
        throw new Error(`Cannot find Firefox installation for channel '${name}' at the standard system paths.`);
      return void 0;
    };
    return {
      type: "channel",
      name,
      browserName: "_bidiFirefox",
      directory: void 0,
      executablePath: (sdkLanguage) => executablePath(sdkLanguage, false),
      executablePathOrDie: (sdkLanguage) => executablePath(sdkLanguage, true),
      installType: "none",
      _validateHostRequirements: () => Promise.resolve(),
      _isHermeticInstallation: true,
      _install: install
    };
  }
  _createBidiChromiumChannel(name, lookAt, install) {
    const executablePath = (sdkLanguage, shouldThrow) => {
      const suffix = lookAt[process.platform];
      if (!suffix) {
        if (shouldThrow)
          throw new Error(`Chromium distribution '${name}' is not supported on ${process.platform}`);
        return void 0;
      }
      const prefixes = process.platform === "win32" ? [
        process.env.LOCALAPPDATA,
        process.env.PROGRAMFILES,
        process.env["PROGRAMFILES(X86)"],
        // In some cases there is no PROGRAMFILES/(86) env var set but HOMEDRIVE is set.
        process.env.HOMEDRIVE + "\\Program Files",
        process.env.HOMEDRIVE + "\\Program Files (x86)"
      ].filter(Boolean) : [""];
      for (const prefix of prefixes) {
        const executablePath2 = path.join(prefix, suffix);
        if (canAccessFile(executablePath2))
          return executablePath2;
      }
      if (!shouldThrow)
        return void 0;
      const location = prefixes.length ? ` at ${path.join(prefixes[0], suffix)}` : ``;
      const installation = install ? `
Run "${buildPlaywrightCLICommand(sdkLanguage, "install " + name)}"` : "";
      throw new Error(`Chromium distribution '${name}' is not found${location}${installation}`);
    };
    return {
      type: "channel",
      name,
      browserName: "_bidiChromium",
      directory: void 0,
      executablePath: (sdkLanguage) => executablePath(sdkLanguage, false),
      executablePathOrDie: (sdkLanguage) => executablePath(sdkLanguage, true),
      installType: install ? "install-script" : "none",
      _validateHostRequirements: () => Promise.resolve(),
      _isHermeticInstallation: false,
      _install: install
    };
  }
  executables() {
    return this._executables;
  }
  findExecutable(name) {
    return this._executables.find((b) => b.name === name);
  }
  defaultExecutables() {
    return this._executables.filter((e) => e.installType === "download-by-default");
  }
  _dedupe(executables) {
    return Array.from(new Set(executables));
  }
  async _validateHostRequirements(sdkLanguage, browserDirectory, linuxLddDirectories, dlOpenLibraries, windowsExeAndDllDirectories) {
    if (os.platform() === "linux")
      return await validateDependenciesLinux(sdkLanguage, linuxLddDirectories.map((d) => path.join(browserDirectory, d)), dlOpenLibraries);
    if (os.platform() === "win32" && os.arch() === "x64")
      return await validateDependenciesWindows(sdkLanguage, windowsExeAndDllDirectories.map((d) => path.join(browserDirectory, d)));
  }
  async installDeps(executablesToInstallDeps, dryRun) {
    const executables = this._dedupe(executablesToInstallDeps);
    const targets = /* @__PURE__ */ new Set();
    for (const executable of executables) {
      if (executable._dependencyGroup)
        targets.add(executable._dependencyGroup);
    }
    targets.add("tools");
    if (os.platform() === "win32")
      return await installDependenciesWindows(targets, dryRun);
    if (os.platform() === "linux")
      return await installDependenciesLinux(targets, dryRun);
  }
  async install(executablesToInstall, forceReinstall) {
    const executables = this._dedupe(executablesToInstall);
    await fs.promises.mkdir(registryDirectory, { recursive: true });
    const lockfilePath = path.join(registryDirectory, "__dirlock");
    const linksDir = path.join(registryDirectory, ".links");
    let releaseLock;
    try {
      releaseLock = await lockfile.lock(registryDirectory, {
        retries: {
          // Retry 20 times during 10 minutes with
          // exponential back-off.
          // See documentation at: https://www.npmjs.com/package/retry#retrytimeoutsoptions
          retries: 20,
          factor: 1.27579
        },
        onCompromised: (err) => {
          throw new Error(`${err.message} Path: ${lockfilePath}`);
        },
        lockfilePath
      });
      await fs.promises.mkdir(linksDir, { recursive: true });
      await fs.promises.writeFile(path.join(linksDir, calculateSha1(PACKAGE_PATH)), PACKAGE_PATH);
      if (!getAsBooleanFromENV("PLAYWRIGHT_SKIP_BROWSER_GC"))
        await this._validateInstallationCache(linksDir);
      for (const executable of executables) {
        if (!executable._install)
          throw new Error(`ERROR: Playwright does not support installing ${executable.name}`);
        const { embedderName } = getEmbedderName();
        if (!getAsBooleanFromENV("CI") && !executable._isHermeticInstallation && !forceReinstall && executable.executablePath(embedderName)) {
          const command = buildPlaywrightCLICommand(embedderName, "install --force " + executable.name);
          process.stderr.write("\n" + wrapInASCIIBox([
            `ATTENTION: "${executable.name}" is already installed on the system!`,
            ``,
            `"${executable.name}" installation is not hermetic; installing newer version`,
            `requires *removal* of a current installation first.`,
            ``,
            `To *uninstall* current version and re-install latest "${executable.name}":`,
            ``,
            `- Close all running instances of "${executable.name}", if any`,
            `- Use "--force" to install browser:`,
            ``,
            `    ${command}`,
            ``,
            `<3 Playwright Team`
          ].join("\n"), 1) + "\n\n");
          return;
        }
        await executable._install();
      }
    } catch (e) {
      if (e.code === "ELOCKED") {
        const rmCommand = process.platform === "win32" ? "rm -R" : "rm -rf";
        throw new Error("\n" + wrapInASCIIBox([
          `An active lockfile is found at:`,
          ``,
          `  ${lockfilePath}`,
          ``,
          `Either:`,
          `- wait a few minutes if other Playwright is installing browsers in parallel`,
          `- remove lock manually with:`,
          ``,
          `    ${rmCommand} ${lockfilePath}`,
          ``,
          `<3 Playwright Team`
        ].join("\n"), 1));
      } else {
        throw e;
      }
    } finally {
      if (releaseLock)
        await releaseLock();
    }
  }
  async uninstall(all) {
    const linksDir = path.join(registryDirectory, ".links");
    if (all) {
      const links = await fs.promises.readdir(linksDir).catch(() => []);
      for (const link of links)
        await fs.promises.unlink(path.join(linksDir, link));
    } else {
      await fs.promises.unlink(path.join(linksDir, calculateSha1(PACKAGE_PATH))).catch(() => {
      });
    }
    await this._validateInstallationCache(linksDir);
    return {
      numberOfBrowsersLeft: (await fs.promises.readdir(registryDirectory).catch(() => [])).filter((browserDirectory) => isBrowserDirectory(browserDirectory)).length
    };
  }
  async validateHostRequirementsForExecutablesIfNeeded(executables, sdkLanguage) {
    if (getAsBooleanFromENV("PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS")) {
      process.stderr.write("Skipping host requirements validation logic because `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS` env variable is set.\n");
      return;
    }
    for (const executable of executables)
      await this._validateHostRequirementsForExecutableIfNeeded(executable, sdkLanguage);
  }
  async _validateHostRequirementsForExecutableIfNeeded(executable, sdkLanguage) {
    const kMaximumReValidationPeriod = 30 * 24 * 60 * 60 * 1e3;
    if (!executable.directory)
      return;
    const markerFile = path.join(executable.directory, "DEPENDENCIES_VALIDATED");
    if (await fs.promises.stat(markerFile).then((stat) => Date.now() - stat.mtime.getTime() < kMaximumReValidationPeriod).catch(() => false))
      return;
    debugLogger.log("install", `validating host requirements for "${executable.name}"`);
    try {
      await executable._validateHostRequirements(sdkLanguage);
      debugLogger.log("install", `validation passed for ${executable.name}`);
    } catch (error) {
      debugLogger.log("install", `validation failed for ${executable.name}`);
      throw error;
    }
    await fs.promises.writeFile(markerFile, "").catch(() => {
    });
  }
  _downloadURLs(descriptor) {
    const paths = DOWNLOAD_PATHS[descriptor.name];
    const downloadPathTemplate = paths[hostPlatform] || paths["<unknown>"];
    if (!downloadPathTemplate)
      return [];
    const downloadPath = require$$0$2.format(downloadPathTemplate, descriptor.revision);
    let downloadURLs = PLAYWRIGHT_CDN_MIRRORS.map((mirror) => `${mirror}/${downloadPath}`);
    let downloadHostEnv;
    if (descriptor.name.startsWith("chromium"))
      downloadHostEnv = "PLAYWRIGHT_CHROMIUM_DOWNLOAD_HOST";
    else if (descriptor.name.startsWith("firefox"))
      downloadHostEnv = "PLAYWRIGHT_FIREFOX_DOWNLOAD_HOST";
    else if (descriptor.name.startsWith("webkit"))
      downloadHostEnv = "PLAYWRIGHT_WEBKIT_DOWNLOAD_HOST";
    const customHostOverride = downloadHostEnv && getFromENV(downloadHostEnv) || getFromENV("PLAYWRIGHT_DOWNLOAD_HOST");
    if (customHostOverride)
      downloadURLs = [`${customHostOverride}/${downloadPath}`];
    return downloadURLs;
  }
  async _downloadExecutable(descriptor, executablePath) {
    const downloadURLs = this._downloadURLs(descriptor);
    if (!downloadURLs.length)
      throw new Error(`ERROR: Playwright does not support ${descriptor.name} on ${hostPlatform}`);
    if (!isOfficiallySupportedPlatform)
      logPolitely(`BEWARE: your OS is not officially supported by Playwright; downloading fallback build for ${hostPlatform}.`);
    if (descriptor.hasRevisionOverride) {
      const message = `You are using a frozen ${descriptor.name} browser which does not receive updates anymore on ${hostPlatform}. Please update to the latest version of your operating system to test up-to-date browsers.`;
      if (process.env.GITHUB_ACTIONS)
        console.log(`::warning title=Playwright::${message}`);
      else
        logPolitely(message);
    }
    const displayName = descriptor.name.split("-").map((word) => {
      return word === "ffmpeg" ? "FFMPEG" : word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
    const title = descriptor.browserVersion ? `${displayName} ${descriptor.browserVersion} (playwright build v${descriptor.revision})` : `${displayName} playwright build v${descriptor.revision}`;
    const downloadFileName = `playwright-download-${descriptor.name}-${hostPlatform}-${descriptor.revision}.zip`;
    const downloadSocketTimeoutEnv = getFromENV("PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT");
    const downloadSocketTimeout = +(downloadSocketTimeoutEnv || "0") || NET_DEFAULT_TIMEOUT;
    await downloadBrowserWithProgressBar(title, descriptor.dir, executablePath, downloadURLs, downloadFileName, downloadSocketTimeout).catch((e) => {
      throw new Error(`Failed to download ${title}, caused by
${e.stack}`);
    });
  }
  async _installMSEdgeChannel(channel, scripts) {
    const scriptArgs = [];
    if (process.platform !== "linux") {
      const products = lowercaseAllKeys(JSON.parse(await fetchData(void 0, { url: "https://edgeupdates.microsoft.com/api/products" })));
      const productName = {
        "msedge": "Stable",
        "msedge-beta": "Beta",
        "msedge-dev": "Dev"
      }[channel];
      const product = products.find((product2) => product2.product === productName);
      const searchConfig = {
        darwin: { platform: "MacOS", arch: "universal", artifact: "pkg" },
        win32: { platform: "Windows", arch: "x64", artifact: "msi" }
      }[process.platform];
      const release = searchConfig ? product.releases.find((release2) => release2.platform === searchConfig.platform && release2.architecture === searchConfig.arch && release2.artifacts.length > 0) : null;
      const artifact = release ? release.artifacts.find((artifact2) => artifact2.artifactname === searchConfig.artifact) : null;
      if (artifact)
        scriptArgs.push(
          artifact.location
          /* url */
        );
      else
        throw new Error(`Cannot install ${channel} on ${process.platform}`);
    }
    await this._installChromiumChannel(channel, scripts, scriptArgs);
  }
  async _installChromiumChannel(channel, scripts, scriptArgs = []) {
    const scriptName = scripts[process.platform];
    if (!scriptName)
      throw new Error(`Cannot install ${channel} on ${process.platform}`);
    const cwd = BIN_PATH;
    const isPowerShell = scriptName.endsWith(".ps1");
    if (isPowerShell) {
      const args = [
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.join(BIN_PATH, scriptName),
        ...scriptArgs
      ];
      const { code } = await spawnAsync("powershell.exe", args, { cwd, stdio: "inherit" });
      if (code !== 0)
        throw new Error(`Failed to install ${channel}`);
    } else {
      const { command, args, elevatedPermissions } = await transformCommandsForRoot([`bash "${path.join(BIN_PATH, scriptName)}" ${scriptArgs.join("")}`]);
      if (elevatedPermissions)
        console.log("Switching to root user to install dependencies...");
      const { code } = await spawnAsync(command, args, { cwd, stdio: "inherit" });
      if (code !== 0)
        throw new Error(`Failed to install ${channel}`);
    }
  }
  async listInstalledBrowsers() {
    const linksDir = path.join(registryDirectory, ".links");
    const { browsers } = await this._traverseBrowserInstallations(linksDir);
    return browsers.filter((browser) => fs.existsSync(browser.browserPath));
  }
  async _validateInstallationCache(linksDir) {
    const { browsers, brokenLinks } = await this._traverseBrowserInstallations(linksDir);
    await this._deleteStaleBrowsers(browsers);
    await this._deleteBrokenInstallations(brokenLinks);
  }
  async _traverseBrowserInstallations(linksDir) {
    const browserList = [];
    const brokenLinks = [];
    for (const fileName of await fs.promises.readdir(linksDir)) {
      const linkPath = path.join(linksDir, fileName);
      let linkTarget = "";
      try {
        linkTarget = (await fs.promises.readFile(linkPath)).toString();
        const browsersJSON = commonjsRequire(path.join(linkTarget, "browsers.json"));
        const descriptors = readDescriptors(browsersJSON);
        for (const browserName of allDownloadable) {
          const descriptor = descriptors.find((d) => d.name === browserName);
          if (!descriptor)
            continue;
          const browserPath = descriptor.dir;
          const browserVersion = parseInt(descriptor.revision, 10);
          browserList.push({
            browserName,
            browserVersion,
            browserPath,
            referenceDir: linkTarget
          });
        }
      } catch (e) {
        brokenLinks.push(linkPath);
      }
    }
    return { browsers: browserList, brokenLinks };
  }
  async _deleteStaleBrowsers(browserList) {
    const usedBrowserPaths = /* @__PURE__ */ new Set();
    for (const browser of browserList) {
      const { browserName, browserVersion, browserPath } = browser;
      const shouldHaveMarkerFile = browserName === "chromium" && (browserVersion >= 786218 || browserVersion < 3e5) || browserName === "firefox" && browserVersion >= 1128 || browserName === "webkit" && browserVersion >= 1307 || // All new applications have a marker file right away.
      browserName !== "firefox" && browserName !== "chromium" && browserName !== "webkit";
      if (!shouldHaveMarkerFile || await existsAsync(browserDirectoryToMarkerFilePath(browserPath)))
        usedBrowserPaths.add(browserPath);
    }
    let downloadedBrowsers = (await fs.promises.readdir(registryDirectory)).map((file) => path.join(registryDirectory, file));
    downloadedBrowsers = downloadedBrowsers.filter((file) => isBrowserDirectory(file));
    const directories = new Set(downloadedBrowsers);
    for (const browserDirectory of usedBrowserPaths)
      directories.delete(browserDirectory);
    for (const directory of directories)
      logPolitely("Removing unused browser at " + directory);
    await removeFolders([...directories]);
  }
  async _deleteBrokenInstallations(brokenLinks) {
    for (const linkPath of brokenLinks)
      await fs.promises.unlink(linkPath).catch((e) => {
      });
  }
}
function browserDirectoryToMarkerFilePath(browserDirectory) {
  return path.join(browserDirectory, "INSTALLATION_COMPLETE");
}
function buildPlaywrightCLICommand(sdkLanguage, parameters) {
  switch (sdkLanguage) {
    case "python":
      return `playwright ${parameters}`;
    case "java":
      return `mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="${parameters}"`;
    case "csharp":
      return `pwsh bin/Debug/netX/playwright.ps1 ${parameters}`;
    default: {
      const packageManagerCommand = getPackageManagerExecCommand();
      return `${packageManagerCommand} playwright ${parameters}`;
    }
  }
}
function findChromiumChannel(sdkLanguage) {
  let channel = null;
  for (const name of ["chromium", "chrome", "msedge"]) {
    try {
      registry.findExecutable(name).executablePathOrDie(sdkLanguage);
      channel = name === "chromium" ? void 0 : name;
      break;
    } catch (e) {
    }
  }
  if (channel === null) {
    const installCommand = buildPlaywrightCLICommand(sdkLanguage, `install chromium`);
    const prettyMessage = [
      `No chromium-based browser found on the system.`,
      `Please run the following command to download one:`,
      ``,
      `    ${installCommand}`,
      ``,
      `<3 Playwright Team`
    ].join("\n");
    throw new Error("\n" + wrapInASCIIBox(prettyMessage, 1));
  }
  return channel;
}
function lowercaseAllKeys(json) {
  if (typeof json !== "object" || !json)
    return json;
  if (Array.isArray(json))
    return json.map(lowercaseAllKeys);
  const result = {};
  for (const [key, value] of Object.entries(json))
    result[key.toLowerCase()] = lowercaseAllKeys(value);
  return result;
}
const registry = new Registry(require$$0);

export { Registry, browserDirectoryToMarkerFilePath, buildPlaywrightCLICommand, findChromiumChannel, registry, registryDirectory };
