function distance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function centroidsFrom(prototypes) {
  const groups = new Map();
  for (const item of prototypes) {
    const rows = groups.get(item.label) || [];
    rows.push(item.v);
    groups.set(item.label, rows);
  }
  return [...groups.entries()].map(([label, rows]) => {
    const vector = new Array(rows[0].length).fill(0);
    for (const row of rows) {
      for (let i = 0; i < vector.length; i++) vector[i] += row[i];
    }
    for (let i = 0; i < vector.length; i++) vector[i] /= rows.length;
    return { label, v: vector };
  });
}

function rankCentroids(vector, centroids) {
  const ranked = centroids
    .map((item) => ({ label: item.label, distance: distance(vector, item.v) }))
    .sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  const second = ranked[1];
  return {
    label: best.label,
    second: second.label,
    margin: second.distance - best.distance,
    similarity: Math.max(0, 1 - best.distance / 2.2)
  };
}

/** Pick the hand order that lands closest to a sign in the dataset. */
export function matchDataset(pairMeans, centroids) {
  const normal = pairMeans.first.concat(pairMeans.second);
  const swapped = pairMeans.second.concat(pairMeans.first);
  const a = rankCentroids(normal, centroids);
  const b = rankCentroids(swapped, centroids);
  return a.similarity >= b.similarity ? a : b;
}
