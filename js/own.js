const KEY = "silenttalk-own-dataset-v1";

export function loadOwn() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { version: 1, source: "silenttalk-webcam", samples: [] };
    const pack = JSON.parse(raw);
    pack.samples = Array.isArray(pack.samples) ? pack.samples : [];
    return pack;
  } catch {
    return { version: 1, source: "silenttalk-webcam", samples: [] };
  }
}

export function saveOwn(pack) {
  localStorage.setItem(KEY, JSON.stringify(pack));
}

export function countsOf(samples) {
  const counts = {};
  for (const sample of samples) counts[sample.label] = (counts[sample.label] || 0) + 1;
  return counts;
}

export function addFrames(pack, label, frames) {
  const at = Date.now();
  for (const hands of frames) {
    pack.samples.push({
      label,
      at,
      hands: hands.map((hand) => hand.map((p) => ({
        x: round(p.x),
        y: round(p.y),
        z: round(p.z || 0)
      })))
    });
  }
  saveOwn(pack);
  return pack;
}

export function removeClass(pack, label) {
  pack.samples = pack.samples.filter((s) => s.label !== label);
  saveOwn(pack);
  return pack;
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}
