import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const names = ['nose','eyeL','eyeR','earL','earR','shoulderL','shoulderR','elbowL','elbowR','wristL','wristR','pinkyL','pinkyR','indexL','indexR','thumbL','thumbR','hipL','hipR','kneeL','kneeR','ankleL','ankleR','heelL','heelR','footL','footR'];
const map = { nose:0, eyeL:2, eyeR:5, earL:7, earR:8, shoulderL:11, shoulderR:12, elbowL:13, elbowR:14, wristL:15, wristR:16, pinkyL:17, pinkyR:18, indexL:19, indexR:20, thumbL:21, thumbR:22, hipL:23, hipR:24, kneeL:25, kneeR:26, ankleL:27, ankleR:28, heelL:29, heelR:30, footL:31, footR:32 };

export class PoseTracker {
  constructor() {
    this.landmarker = null; this.video = null; this.raw = null; this.smooth = null;
    this.status = 'IDLE'; this.jsStatus = 'BUNDLED'; this.wasmStatus = 'IDLE'; this.modelStatus = 'IDLE';
    this.error = ''; this.poseFps = 0; this.lastInfer = 0; this.confidence = 0; this.landmarkCount = 0;
  }
  async start(video) {
    this.video = video; this.status = 'LOADING'; this.error = ''; this.wasmStatus = 'LOADING'; this.modelStatus = 'LOADING';
    try {
      const files = await FilesetResolver.forVisionTasks(WASM_URL);
      this.wasmStatus = 'READY';
      this.landmarker = await PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL_URL }, runningMode: 'VIDEO', numPoses: 1,
        minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5
      });
      this.modelStatus = 'READY'; this.status = 'READY'; console.info('[Pose] MediaPipe JS, WASM and model ready'); return true;
    } catch (error) {
      this.status = 'ERROR'; this.error = String(error?.message || error);
      if (this.wasmStatus === 'LOADING') this.wasmStatus = 'ERROR'; else this.modelStatus = 'ERROR';
      console.error('[Pose] initialization failed', error); return false;
    }
  }
  update(w, h, now, mirror) {
    if (!this.landmarker || !this.video || this.video.readyState < 2 || !this.video.videoWidth) return null;
    try {
      const result = this.landmarker.detectForVideo(this.video, now), landmarks = result.landmarks?.[0];
      this.poseFps = this.lastInfer ? this.poseFps * .85 + 1000 / (now - this.lastInfer) * .15 : 0; this.lastInfer = now;
      if (!landmarks) { this.raw = null; this.smooth = null; this.confidence = 0; this.landmarkCount = 0; return null; }
      this.confidence = landmarks.reduce((sum, point) => sum + (point.visibility ?? 1), 0) / landmarks.length; this.landmarkCount = landmarks.length;
      this.raw = this.fromLandmarks(landmarks, w, h, mirror); this.smooth = this.smooth ? this.ema(this.smooth, this.raw, .35) : structuredClone(this.raw); return this.smooth;
    } catch (error) { this.status = 'ERROR'; this.error = String(error?.message || error); console.error('[Pose] inference failed', error); return null; }
  }
  fromLandmarks(landmarks, w, h, mirror) {
    const scale = Math.max(w / this.video.videoWidth, h / this.video.videoHeight), drawW = this.video.videoWidth * scale, drawH = this.video.videoHeight * scale, offsetX = (w - drawW) / 2, offsetY = (h - drawH) / 2;
    const rawLandmarks = landmarks.map(point => ({ x: offsetX + (mirror ? 1 - point.x : point.x) * drawW, y: offsetY + point.y * drawH, z: point.z, visibility: point.visibility ?? 1 }));
    const joints = {}; for (const name of names) joints[name] = rawLandmarks[map[name]];
    const head = rawLandmarks[0], shoulderWidth = Math.hypot(joints.shoulderL.x - joints.shoulderR.x, joints.shoulderL.y - joints.shoulderR.y);
    return { joints, head, scale: Math.max(36, shoulderWidth * .8), rawLandmarks };
  }
  ema(previous, next, alpha) { const output = structuredClone(next); for (const [name, point] of Object.entries(next.joints)) { output.joints[name].x = previous.joints[name].x * (1 - alpha) + point.x * alpha; output.joints[name].y = previous.joints[name].y * (1 - alpha) + point.y * alpha; } output.head.x = previous.head.x * (1 - alpha) + next.head.x * alpha; output.head.y = previous.head.y * (1 - alpha) + next.head.y * alpha; return output; }
}
