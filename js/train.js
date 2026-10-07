import { extensionScores, setPredictor } from "./classifier.js";

const MODEL_KEY = "silenttalk-trained-model-v1";
const MIN_CLASS = 8;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function gapOf(hands) {
  if (!hands || hands.length < 2) return 0;
  const a = hands[0][0];
  const b = hands[1][0];
  return Math.min(1, Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)));
}

/** Same 7 numbers for a saved frame and for a live camera frame. */
export function featuresOf(hands) {
  if (!hands || !hands.length) return null;
  const scores = extensionScores(hands[0]);
  if (!scores) return null;
  return [...scores, hands.length >= 2 ? 1 : 0, gapOf(hands)];
}

function mean(rows) {
  const m = new Array(rows[0].length).fill(0);
  for (const row of rows) {
    for (let i = 0; i < m.length; i++) m[i] += row[i];
  }
  for (let i = 0; i < m.length; i++) m[i] /= rows.length;
  return m;
}

function groupFeatures(samples) {
  const groups = new Map();
  for (const sample of samples) {
    const features = featuresOf(sample.hands);
    if (!features) continue;
    const rows = groups.get(sample.label) || [];
    rows.push({ sample, features });
    groups.set(sample.label, rows);
  }
  return groups;
}

function centroidsFrom(groups) {
  return [...groups.entries()].map(([id, rows]) => ({
    id,
    count: rows.length,
    centroid: mean(rows.map((row) => row.features))
  }));
}

export function predictSign(hands, model) {
  const features = featuresOf(hands);
  if (!features || !model || !model.classes || !model.classes.length) {
    return { label: null, datasetId: null, confidence: 0, bits: null, note: "Train your dataset first" };
  }
  let best = null;
  let bestD = Infinity;
  let second = Infinity;
  for (const cls of model.classes) {
    let sum = 0;
    for (let i = 0; i < features.length; i++) {
      const d = features[i] - cls.centroid[i];
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
  const margin = second - bestD;
  if (!best || margin < 0.12 || bestD > 0.9) {
    return {
      label: null,
      datasetId: null,
      confidence: 0,
      scores: features.slice(0, 5),
      bits: null,
      note: "Not close enough to a sign in your dataset"
    };
  }
  return {
    label: best.id,
    datasetId: best.id,
    confidence: clamp(0.7 + margin * 0.25 - bestD * 0.15, 0.7, 0.99),
    scores: features.slice(0, 5),
    bits: features.slice(0, 5).map((s) => (s >= 0.5 ? "1" : "0")).join(""),
    note: `Your dataset · ${best.id}`
  };
}

export function scoreModel(model, samples) {
  const perClass = {};
  let correct = 0;
  let total = 0;
  for (const sample of samples) {
    if (!model.classes.some((cls) => cls.id === sample.label)) continue;
    const pred = predictSign(sample.hands, model);
    const hit = pred.label === sample.label;
    total += 1;
    if (hit) correct += 1;
    const row = perClass[sample.label] || { correct: 0, total: 0 };
    row.total += 1;
    if (hit) row.correct += 1;
    perClass[sample.label] = row;
  }
  return {
    correct,
    total,
    accuracy: total ? correct / total : 0,
    perClass,
    classes: model.classes.map((cls) => cls.id)
  };
}

function splitReady(groups) {
  const trainGroups = new Map();
  const testSamples = [];
  const allSamples = [];
  for (const [label, rows] of groups) {
    if (rows.length < MIN_CLASS) continue;
    const nTest = rows.length >= 10 ? Math.max(1, Math.floor(rows.length * 0.2)) : 0;
    const trainRows = [];
    rows.forEach((row, i) => {
      allSamples.push(row.sample);
      if (i >= rows.length - nTest) testSamples.push(row.sample);
      else trainRows.push(row);
    });
    trainGroups.set(label, trainRows);
  }
  return { trainGroups, testSamples, allSamples };
}

export function trainModel(samples) {
  const groups = groupFeatures(samples || []);
  const { trainGroups, testSamples, allSamples } = splitReady(groups);
  if (!trainGroups.size) {
    return {
      model: null,
      reason: "Each sign needs at least 8 captured frames before training."
    };
  }
  const counts = {};
  for (const [id, rows] of groups) counts[id] = rows.length;
  const testModel = { classes: centroidsFrom(trainGroups) };
  const fullGroups = new Map();
  for (const [label, rows] of groups) {
    if (rows.length >= MIN_CLASS) fullGroups.set(label, rows);
  }
  const model = {
    version: 1,
    trainedAt: Date.now(),
    counts,
    classes: centroidsFrom(fullGroups)
  };
  return {
    model,
    learned: model.classes.map((cls) => cls.id),
    testScore: scoreModel(testModel, testSamples),
    fullScore: scoreModel(model, allSamples),
    reason: ""
  };
}

export function activateModel(model) {
  if (!model || !model.classes || !model.classes.length) {
    setPredictor(null);
    return;
  }
  setPredictor((hands) => predictSign(hands, model));
}

export function loadModel() {
  try {
    const raw = localStorage.getItem(MODEL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveModel(model) {
  localStorage.setItem(MODEL_KEY, JSON.stringify(model));
}

export function modelMatches(model, samples) {
  if (!model || !model.counts) return false;
  const counts = {};
  for (const sample of samples) counts[sample.label] = (counts[sample.label] || 0) + 1;
  const keys = new Set([...Object.keys(model.counts), ...Object.keys(counts)]);
  for (const key of keys) {
    if ((model.counts[key] || 0) !== (counts[key] || 0)) return false;
  }
  return true;
}
