/** Handshape dataset for SilentTalk.
 *  Each class is a 5-finger pattern: thumb, index, middle, ring, pinky.
 *  1 = extended, 0 = curled. Two-hand classes use a second landmark set.
 */

export const CLASSES = [
  { id: "HELLO", bits: "11111", hands: 1, note: "Open palm" },
  { id: "YES", bits: "10000", hands: 1, note: "Thumb up" },
  { id: "A", bits: "00000", hands: 1, note: "Fist / letter A" },
  { id: "1", bits: "01000", hands: 1, note: "Index" },
  { id: "2", bits: "01100", hands: 1, note: "Index + middle" },
  { id: "WATER", bits: "01110", hands: 1, note: "Three fingers" },
  { id: "B", bits: "01111", hands: 1, note: "Four fingers / letter B" },
  { id: "NO", bits: "01001", hands: 1, note: "Index + pinky" },
  { id: "L", bits: "11000", hands: 1, note: "Thumb + index" },
  { id: "Y", bits: "10001", hands: 1, note: "Thumb + pinky" },
  { id: "I", bits: "00001", hands: 1, note: "Pinky" },
  { id: "GOOD", bits: "11100", hands: 1, note: "Thumb + index + middle" },
  { id: "HELP", bits: "10000", hands: 2, gap: 0.12, note: "Two hands close" },
  { id: "HELLO", bits: "11111", hands: 2, gap: 0.16, variant: "namaste", note: "Two open palms" }
];

const FINGERS = [
  { joints: [2, 3, 4], origin: [0.07, -0.025], dir: [0.72, -0.58] },
  { joints: [5, 6, 7, 8], origin: [0.042, -0.09], dir: [0.06, -1] },
  { joints: [9, 10, 11, 12], origin: [0.0, -0.1], dir: [0.0, -1] },
  { joints: [13, 14, 15, 16], origin: [-0.04, -0.088], dir: [-0.05, -1] },
  { joints: [17, 18, 19, 20], origin: [-0.072, -0.068], dir: [-0.14, -1] }
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function norm(v) {
  const l = Math.hypot(v.x, v.y, v.z || 0) || 1;
  return { x: v.x / l, y: v.y / l, z: (v.z || 0) / l };
}

function add(p, d, s) {
  return { x: p.x + d.x * s, y: p.y + d.y * s, z: (p.z || 0) + (d.z || 0) * s };
}

export function synthesizeHand(bits, rng, shiftX = 0) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  const wrist = {
    x: 0.48 + shiftX + (rng() - 0.5) * 0.02,
    y: 0.62 + (rng() - 0.5) * 0.02,
    z: (rng() - 0.5) * 0.01
  };
  lm[0] = wrist;
  FINGERS.forEach((finger, i) => {
    const extended = bits[i] === "1";
    const jitter = (rng() - 0.5) * (extended ? 0.08 : 0.12);
    const base = norm({ x: finger.dir[0] + jitter, y: finger.dir[1], z: (rng() - 0.5) * 0.05 });
    const back = norm({ x: -base.x, y: -base.y, z: 0.18 + rng() * 0.08 });
    const onward = extended ? base : back;
    const start = {
      x: wrist.x + finger.origin[0] + (rng() - 0.5) * 0.006,
      y: wrist.y + finger.origin[1] + (rng() - 0.5) * 0.006,
      z: (rng() - 0.5) * 0.004
    };
    const joints = finger.joints;
    lm[joints[0]] = start;
    let prev = start;
    let vec = base;
    const seg = 0.04;
    for (let k = 1; k < joints.length; k++) {
      if (k >= 2) vec = onward;
      prev = add(prev, vec, seg * (k === joints.length - 1 ? 0.82 : 1));
      prev = {
        x: prev.x + (rng() - 0.5) * 0.003,
        y: prev.y + (rng() - 0.5) * 0.003,
        z: prev.z + (rng() - 0.5) * 0.003
      };
      lm[joints[k]] = prev;
    }
  });
  lm[1] = {
    x: (lm[0].x + lm[2].x) / 2,
    y: (lm[0].y + lm[2].y) / 2,
    z: (lm[0].z + lm[2].z) / 2
  };
  return lm;
}

export function buildSamples(perClass = 40, seed = 20261007) {
  const rng = mulberry32(seed);
  const samples = [];
  for (const cls of CLASSES) {
    for (let n = 0; n < perClass; n++) {
      const hands = [synthesizeHand(cls.bits, rng, 0)];
      if (cls.hands === 2) {
        hands.push(synthesizeHand(cls.bits, rng, cls.gap || 0.14));
      }
      samples.push({ label: cls.id, variant: cls.variant || "static", hands });
    }
  }
  return {
    version: 1,
    perClass,
    classes: [...new Set(CLASSES.map((c) => c.id))],
    samples
  };
}
