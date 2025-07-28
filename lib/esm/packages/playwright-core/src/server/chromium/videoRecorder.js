import { assert } from '../../utils/isomorphic/assert.js';
import { monotonicTime } from '../../utils/isomorphic/time.js';
import '../../../../../_virtual/pixelmatch.js';
import '../../utilsBundle.js';
import 'node:crypto';
import '../utils/debug.js';
import '../utils/debugLogger.js';
import '../../../../../bundles/fs.js';
import 'node:path';
import '../../zipBundle.js';
import '../utils/hostPlatform.js';
import 'node:http';
import 'node:http2';
import 'node:https';
import 'node:url';
import '../utils/happyEyeballs.js';
import '../utils/nodePlatform.js';
import { launchProcess } from '../utils/processLauncher.js';
import '../utils/profiler.js';
import '../utils/socksProxy.js';
import 'node:child_process';
import 'node:os';
import '../utils/zones.js';
import { serverSideCallMetadata } from '../instrumentation.js';
import { Page } from '../page.js';
import { ProgressController } from '../progress.js';

const fps = 25;
class VideoRecorder {
  constructor(page, ffmpegPath, progress) {
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
    page.on(Page.Events.ScreencastFrame, (frame) => this.writeFrame(frame.buffer, frame.frameSwapWallTime / 1e3));
  }
  static async launch(page, ffmpegPath, options) {
    if (!options.outputFile.endsWith(".webm"))
      throw new Error("File must have .webm extension");
    const controller = new ProgressController(serverSideCallMetadata(), page);
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
    const { launchedProcess, gracefullyClose } = await launchProcess({
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
    assert(this._process);
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
    this._lastWriteTimestamp = monotonicTime();
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
    this.writeFrame(Buffer.from([]), this._lastFrameTimestamp + (monotonicTime() - this._lastWriteTimestamp) / 1e3);
    this._isStopped = true;
    await this._lastWritePromise;
    await this._gracefullyClose();
  }
}

export { VideoRecorder };
