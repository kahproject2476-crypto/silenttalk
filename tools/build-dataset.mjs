import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSamples } from "../js/dataset.js";
import { classifyHands } from "../js/classifier.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pack = buildSamples(40, 20261007);
let correct = 0;
const misses = [];
for (const sample of pack.samples) {
  const pred = classifyHands(sample.hands);
  if (pred.label === sample.label) correct += 1;
  else if (misses.length < 8) misses.push({ want: sample.label, got: pred.label, bits: pred.bits, note: pred.note });
}
const accuracy = correct / pack.samples.length;
const out = join(root, "dataset", "samples.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(pack));
console.log(`samples ${pack.samples.length}`);
console.log(`accuracy ${(accuracy * 100).toFixed(2)}%`);
if (misses.length) console.log(JSON.stringify(misses, null, 2));
if (accuracy < 0.99) process.exit(1);
