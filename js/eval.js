import { classifyHands } from "./classifier.js";

export function evaluateSamples(pack) {
  const samples = pack.samples || [];
  const perClass = {};
  let correct = 0;
  const t0 = performance.now();
  for (const sample of samples) {
    const pred = classifyHands(sample.hands);
    const hit = pred.label === sample.label;
    if (hit) correct += 1;
    const row = perClass[sample.label] || { correct: 0, total: 0 };
    row.total += 1;
    if (hit) row.correct += 1;
    perClass[sample.label] = row;
  }
  const ms = performance.now() - t0;
  const total = samples.length;
  return {
    correct,
    total,
    accuracy: total ? correct / total : 0,
    msPerSample: total ? ms / total : 0,
    perClass,
    classes: pack.classes || Object.keys(perClass)
  };
}

export async function evaluateFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Dataset missing: " + url);
  const pack = await res.json();
  return evaluateSamples(pack);
}
