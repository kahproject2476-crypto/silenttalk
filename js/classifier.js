import { CLASSES } from "./dataset.js";

const TIP_ANGLE = [
  [2, 3, 4],
  [5, 6, 7],
  [9, 10, 11],
  [13, 14, 15],
  [17, 18, 19]
];

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

export function jointAngle(a, b, c) {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const abz = (a.z || 0) - (b.z || 0);
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const cbz = (c.z || 0) - (b.z || 0);
  const mag = Math.hypot(abx, aby, abz) * Math.hypot(cbx, cby, cbz);
  if (mag < 1e-8) return 0;
  const cos = clamp((abx * cbx + aby * cby + abz * cbz) / mag, -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

/** 0 = curled, 1 = straight. Same features for dataset samples and the webcam. */
export function extensionScores(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  return TIP_ANGLE.map(([a, b, c]) => {
    const ang = jointAngle(landmarks[a], landmarks[b], landmarks[c]);
    return clamp((ang - 70) / 100, 0, 1);
  });
}

const SINGLE = CLASSES.filter((c) => c.hands === 1).map((c) => ({
  id: c.id,
  note: c.note,
  centroid: c.bits.split("").map((bit) => (bit === "1" ? 1 : 0))
}));

let activeCentroids = SINGLE;
let predictor = null;

export function setPredictor(fn) {
  predictor = fn;
}

export function idealCentroids() {
  return SINGLE.map((c) => ({ id: c.id, note: c.note, centroid: c.centroid.slice() }));
}

export function useCentroids(list) {
  activeCentroids = list && list.length ? list : SINGLE;
}

function nearest(scores) {
  let best = null;
  let bestD = Infinity;
  let second = Infinity;
  for (const cls of activeCentroids) {
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      const d = scores[i] - cls.centroid[i];
      sum += d * d;
    }
    const distC = Math.sqrt(sum);
    if (distC < bestD) {
      second = bestD;
      bestD = distC;
      best = cls;
    } else if (distC < second) {
      second = distC;
    }
  }
  return { best, bestD, margin: second - bestD };
}

function pack(label, confidence, scores, note) {
  return {
    label,
    datasetId: label,
    confidence,
    scores,
    bits: scores ? scores.map((s) => (s >= 0.5 ? "1" : "0")).join("") : null,
    note
  };
}

export function classifyHands(hands) {
  if (predictor) return predictor(hands);
  if (!hands || !hands.length) {
    return { label: null, datasetId: null, confidence: 0, bits: null, note: "No hand" };
  }

  if (hands.length >= 2) {
    const gap = dist(hands[0][0], hands[1][0]);
    const s0 = extensionScores(hands[0]);
    const s1 = extensionScores(hands[1]);
    if (s0 && s1) {
      const open0 = s0.filter((s) => s >= 0.62).length >= 4;
      const open1 = s1.filter((s) => s >= 0.62).length >= 4;
      if (open0 && open1 && gap < 0.42) {
        return pack("HELLO", 0.94, s0, "Two open palms · dataset HELLO");
      }
      if (gap < 0.22) {
        return pack("HELP", 0.91, s0, "Two hands close · dataset HELP");
      }
    }
  }

  const scores = extensionScores(hands[0]);
  if (!scores) return { label: null, datasetId: null, confidence: 0, bits: null, note: "Bad landmarks" };

  const { best, bestD, margin } = nearest(scores);
  if (!best || margin < 0.16 || bestD > 0.72) {
    return pack(null, 0, scores, "Between dataset classes — hold a clearer shape");
  }
  const confidence = clamp(0.62 + margin * 0.28 - bestD * 0.2, 0.62, 0.99);
  return pack(best.id, confidence, scores, `${best.note} · dataset ${best.id}`);
}

export class SignStabilizer {
  constructor(needed = 5) {
    this.needed = needed;
    this.current = null;
    this.count = 0;
    this.lastEmit = null;
    this.missing = 0;
  }

  push(label) {
    if (!label) {
      this.missing += 1;
      this.count = Math.max(0, this.count - 1);
      if (this.count === 0) this.current = null;
      if (this.missing > 18) this.lastEmit = null;
      return null;
    }
    this.missing = 0;
    if (label === this.current) this.count += 1;
    else {
      this.current = label;
      this.count = 1;
    }
    if (this.count >= this.needed && this.lastEmit !== label) {
      this.lastEmit = label;
      return label;
    }
    return null;
  }
}
