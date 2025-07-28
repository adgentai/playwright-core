'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const assert = require('../../utils/isomorphic/assert.js');
const time = require('../../utils/isomorphic/time.js');
require('../../../../../_virtual/pixelmatch.js');
require('../../utilsBundle.js');
require('node:crypto');
require('../utils/debug.js');
require('../utils/debugLogger.js');
require('../../../../../bundles/fs.js');
require('node:path');
require('../../zipBundle.js');
require('../utils/hostPlatform.js');
require('node:http');
require('node:http2');
require('node:https');
require('node:url');
require('../utils/happyEyeballs.js');
require('../utils/nodePlatform.js');
const processLauncher = require('../utils/processLauncher.js');
require('../utils/profiler.js');
require('../utils/socksProxy.js');
require('node:child_process');
require('node:os');
require('../utils/zones.js');
const instrumentation = require('../instrumentation.js');
const page = require('../page.js');
const progress = require('../progress.js');

const fps = 25;
class VideoRecorder {
  constructor(page$1, ffmpegPath, progress) {
    this._process = null;
    this._gracefullyClose = null;
    this._lastWritePromise = Promise.resolve();
    this._lastFrameTimestamp = 0;
    this._lastFrameBuffer = null;
    this._lastWriteTimestamp = 0;
    this._frameQueue = [];
    this._isStopped = false;
    this._progress = progress;
    this._ffmpegPath = ffmpegPath;
    page$1.on(page.Page.Events.ScreencastFrame, (frame) => this.writeFrame(frame.buffer, frame.frameSwapWallTime / 1e3));
  }
  static async launch(page, ffmpegPath, options) {
    if (!options.outputFile.endsWith(".webm"))
      throw new Error("File must have .webm extension");
    const controller = new progress.ProgressController(instrumentation.serverSideCallMetadata(), page);
    controller.setLogName("browser");
    return await controller.run(async (progress) => {
      const recorder = new VideoRecorder(page, ffmpegPath, progress);
      progress.cleanupWhenAborted(() => recorder.stop());
      await recorder._launch(options);
      return recorder;
    });
  }
  async _launch(options) {
    const w = options.width;
    const h = options.height;
    const args = `-loglevel error -f image2pipe -avioflags direct -fpsprobesize 0 -probesize 32 -analyzeduration 0 -c:v mjpeg -i pipe:0 -y -an -r ${fps} -c:v vp8 -qmin 0 -qmax 50 -crf 8 -deadline realtime -speed 8 -b:v 1M -threads 1 -vf pad=${w}:${h}:0:0:gray,crop=${w}:${h}:0:0`.split(" ");
    args.push(options.outputFile);
    const progress = this._progress;
    const { launchedProcess, gracefullyClose } = await processLauncher.launchProcess({
      command: this._ffmpegPath,
      args,
      stdio: "stdin",
      log: (message) => progress.log(message),
      tempDirectories: [],
      attemptToGracefullyClose: async () => {
        progress.log("Closing stdin...");
        launchedProcess.stdin.end();
      },
      onExit: (exitCode, signal) => {
        progress.log(`ffmpeg onkill exitCode=${exitCode} signal=${signal}`);
      }
    });
    launchedProcess.stdin.on("finish", () => {
      progress.log("ffmpeg finished input.");
    });
    launchedProcess.stdin.on("error", () => {
      progress.log("ffmpeg error.");
    });
    this._process = launchedProcess;
    this._gracefullyClose = gracefullyClose;
  }
  writeFrame(frame, timestamp) {
    assert.assert(this._process);
    if (this._isStopped)
      return;
    if (this._lastFrameBuffer) {
      const durationSec = timestamp - this._lastFrameTimestamp;
      const repeatCount = Math.max(1, Math.round(fps * durationSec));
      for (let i = 0; i < repeatCount; ++i)
        this._frameQueue.push(this._lastFrameBuffer);
      this._lastWritePromise = this._lastWritePromise.then(() => this._sendFrames());
    }
    this._lastFrameBuffer = frame;
    this._lastFrameTimestamp = timestamp;
    this._lastWriteTimestamp = time.monotonicTime();
  }
  async _sendFrames() {
    while (this._frameQueue.length)
      await this._sendFrame(this._frameQueue.shift());
  }
  async _sendFrame(frame) {
    return new Promise((f) => this._process.stdin.write(frame, f)).then((error) => {
      if (error)
        this._progress.log(`ffmpeg failed to write: ${String(error)}`);
    });
  }
  async stop() {
    if (this._isStopped)
      return;
    this.writeFrame(Buffer.from([]), this._lastFrameTimestamp + (time.monotonicTime() - this._lastWriteTimestamp) / 1e3);
    this._isStopped = true;
    await this._lastWritePromise;
    await this._gracefullyClose();
  }
}

exports.VideoRecorder = VideoRecorder;
