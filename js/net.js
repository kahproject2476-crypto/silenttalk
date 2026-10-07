export function predictVector(features, model) {
  const z = features.map((value, i) => (value - model.mean[i]) / (model.scale[i] || 1));
  const hidden = model.b1.map((bias, j) => {
    let sum = bias;
    for (let i = 0; i < z.length; i++) sum += z[i] * model.w1[i][j];
    return sum > 0 ? sum : 0;
  });
  const logits = model.b2.map((bias, k) => {
    let sum = bias;
    for (let j = 0; j < hidden.length; j++) sum += hidden[j] * model.w2[j][k];
    return sum;
  });
  const max = Math.max(...logits);
  const exp = logits.map((v) => Math.exp(v - max));
  const total = exp.reduce((a, b) => a + b, 0);
  let best = 0;
  for (let i = 1; i < exp.length; i++) if (exp[i] > exp[best]) best = i;
  return {
    label: model.classes[best],
    confidence: exp[best] / total
  };
}
