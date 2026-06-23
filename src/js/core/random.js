export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickWeighted(items, getWeight) {
  const weighted = items
    .map(item => ({ item, weight: Math.max(0, Number(getWeight(item)) || 0) }))
    .filter(entry => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return items[0] || null;
  let roll = Math.random() * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return weighted[weighted.length - 1]?.item || null;
}

export function randomJitter(amount = 5) {
  return randInt(-amount, amount);
}
