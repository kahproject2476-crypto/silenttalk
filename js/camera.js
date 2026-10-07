import { classifyHands, SignStabilizer } from "./classifier.js";

export class IslCamera {
  constructor({ video, overlay, onSign, onStatus, onHands }) {
    this.video = video;
    this.overlay = overlay;
    this.ctx = overlay.getContext("2d");
    this.onSign = onSign;
    this.onStatus = onStatus;
    this.onHands = onHands || (() => {});
    this.hands = null;
    this.camera = null;
    this.running = false;
    this.stab = new SignStabilizer(5);
    this.minConfidence = 0.75;
    this.roi = { x: 0.16, y: 0.1, w: 0.68, h: 0.78 };
  }

  async start() {
    this.onStatus("Loading MediaPipe Hands…");
    await this.ensureScripts();
    this.hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,
      selfieMode: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });
    this.hands.onResults((res) => this.onResults(res));

    this.camera = new window.Camera(this.video, {
      onFrame: async () => {
        if (this.running) await this.hands.send({ image: this.video });
      },
      width: 640,
      height: 480
    });
    this.running = true;
    await this.camera.start();
    this.onStatus("Camera on — keep the hand inside the box");
  }

  stop() {
    this.running = false;
    if (this.camera && this.camera.stop) this.camera.stop();
    const stream = this.video.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    this.video.srcObject = null;
    this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.onStatus("Camera stopped");
  }

  onResults(results) {
    const w = this.overlay.width = this.video.videoWidth || 780;
    const h = this.overlay.height = this.video.videoHeight || 440;
    this.ctx.save();
    this.ctx.clearRect(0, 0, w, h);
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(this.ctx, landmarks, window.HAND_CONNECTIONS, { color: "#7BE0B0", lineWidth: 3 });
        window.drawLandmarks(this.ctx, landmarks, { color: "#E8B86A", lineWidth: 1, radius: 3 });
      }
    }
    const roi = this.roi;
    this.ctx.strokeStyle = "rgba(123, 224, 176, 0.95)";
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(roi.x * w, roi.y * h, roi.w * w, roi.h * h);
    this.ctx.restore();

    const hands = [];
    const sides = [];
    (results.multiHandLandmarks || []).forEach((hand, i) => {
      if (!inRoi(hand[0], roi)) return;
      hands.push(hand);
      sides.push(results.multiHandedness?.[i]?.label || "Right");
    });
    this.onHands(hands, sides);
    const t0 = performance.now();
    const guess = classifyHands(hands);
    guess.ms = performance.now() - t0;
    guess.hands = hands.length;
    const accepted = guess.label && guess.confidence >= this.minConfidence ? guess.label : null;
    if (guess.label && !accepted) guess.note = "Below confidence threshold";
    if ((results.multiHandLandmarks || []).length && !hands.length) {
      guess.label = null;
      guess.note = "Move the hand into the box";
    }
    const stable = this.stab.push(accepted);
    this.onSign({ live: guess, committed: stable });
  }

  ensureScripts() {
    const urls = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
    ];
    return urls.reduce((p, src) => p.then(() => loadScript(src)), Promise.resolve());
  }
}

function inRoi(point, roi) {
  return point.x >= roi.x && point.x <= roi.x + roi.w && point.y >= roi.y && point.y <= roi.y + roi.h;
}

function loadScript(src) {
  if ([...document.scripts].some((s) => s.src.includes(src.split("/").pop()))) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.crossOrigin = "anonymous";
    el.onload = resolve;
    el.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(el);
  });
}
