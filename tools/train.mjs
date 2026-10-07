import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { trainModel } from "../js/train.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2] || join(root, "dataset", "my-dataset.json");
const pack = JSON.parse(readFileSync(input, "utf8"));
const result = trainModel(pack.samples || []);
if (!result.model) {
  console.error(result.reason);
  process.exit(1);
}
const out = join(root, "model", "sign-model.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result.model, null, 2));
const full = result.fullScore;
const test = result.testScore;
console.log(`classes ${result.learned.join(", ")}`);
console.log(`dataset ${full.correct}/${full.total} = ${(full.accuracy * 100).toFixed(2)}%`);
console.log(`held-out ${test.correct}/${test.total} = ${(test.total ? test.accuracy * 100 : 0).toFixed(2)}%`);
console.log(`wrote ${out}`);
