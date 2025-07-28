'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const require$$0 = require('node:inspector');
const fs = require('../../../../../bundles/fs.js');
const path = require('node:path');

const profileDir = process.env.PWTEST_PROFILE_DIR || "";
let session;
async function startProfiling() {
  if (!profileDir)
    return;
  session = new (require$$0).Session();
  session.connect();
  await new Promise((f) => {
    session.post("Profiler.enable", () => {
      session.post("Profiler.start", f);
    });
  });
}
async function stopProfiling(profileName) {
  if (!profileDir)
    return;
  await new Promise((f) => session.post("Profiler.stop", (err, { profile }) => {
    if (!err) {
      fs.default.mkdirSync(profileDir, { recursive: true });
      fs.default.writeFileSync(path.join(profileDir, profileName + ".json"), JSON.stringify(profile));
    }
    f();
  }));
}

exports.startProfiling = startProfiling;
exports.stopProfiling = stopProfiling;
