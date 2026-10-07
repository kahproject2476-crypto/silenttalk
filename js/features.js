/** Same hand features as the video_features clips: 21 points × xyz, wrist at the origin, scaled so the farthest point is 1. */

function zeros(n) {
  return new Array(n).fill(0);
}

export function packHand(landmarks) {
  if (!landmarks || landmarks.length < 21) return zeros(63);
  const wrist = landmarks[0];
  const pts = landmarks.slice(0, 21).map((p) => [
    p.x - wrist.x,
    p.y - wrist.y,
    (p.z || 0) - (wrist.z || 0)
  ]);
  let scale = 0;
  for (const p of pts) scale = Math.max(scale, Math.hypot(p[0], p[1], p[2]));
  if (scale < 1e-6) return zeros(63);
  const out = [];
  for (const p of pts) out.push(p[0] / scale, p[1] / scale, p[2] / scale);
  return out;
}

/** One hand always goes in the first 63 numbers, because that is how the one-hand clips are stored.
 *  Two hands are kept as right-then-left, and the matcher also tries the swapped order. */
export function framePair(hands, sides) {
  const empty = zeros(63);
  if (!hands || !hands.length) return { first: empty, second: empty.slice() };
  if (hands.length === 1) return { first: packHand(hands[0]), second: empty };
  let right = null;
  let left = null;
  hands.forEach((landmarks, i) => {
    const packed = packHand(landmarks);
    if (sides && sides[i] === "Left") left = packed;
    else right = packed;
  });
  if (!right || !left) {
    const ordered = hands.slice().sort((a, b) => a[0].x - b[0].x);
    return { first: packHand(ordered[0]), second: packHand(ordered[1]) };
  }
  return { first: right, second: left };
}

export function meanFeatures(frames) {
  const n = frames.length;
  const dim = frames[0].length;
  const mean = new Array(dim).fill(0);
  for (const frame of frames) {
    for (let i = 0; i < dim; i++) mean[i] += frame[i];
  }
  for (let i = 0; i < dim; i++) mean[i] /= n;
  return mean;
}

export class FrameBuffer {
  constructor(length = 24) {
    this.length = length;
    this.frames = [];
  }

  push(pair) {
    this.frames.push(pair);
    if (this.frames.length > this.length) this.frames.shift();
  }

  clear() {
    this.frames = [];
  }

  ready() {
    return this.frames.length >= this.length;
  }

  means() {
    const first = meanFeatures(this.frames.map((pair) => pair.first));
    const second = meanFeatures(this.frames.map((pair) => pair.second));
    return { first, second };
  }
}
