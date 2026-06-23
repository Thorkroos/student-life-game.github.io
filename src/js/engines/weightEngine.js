export function calculateEventWeight(state, event) {
  let weight = event.baseWeight ?? 10;

  if (event.category === 'advanced' && state.progress >= 70) weight *= 1.35;
  if (event.category === 'hidden') weight *= 1.1;
  if (event.majorTags?.includes(state.major)) weight *= 1.2;
  if (event.goalTags?.includes(state.goal)) weight *= 1.25;

  const stats = state.stats;
  const modifiers = event.weightModifiers || [];
  for (const mod of modifiers) {
    if (evaluateSimpleExpression(mod.condition, stats, state)) {
      weight *= Number(mod.multiplier) || 1;
    }
  }

  if (stats.sanity <= 30 && ['mental', 'visa', 'money'].includes(event.type)) weight *= 1.35;
  if (stats.money <= 25 && ['work', 'money', 'furniture'].includes(event.type)) weight *= 1.25;
  if (stats.english >= 70 && ['dating', 'career', 'school'].includes(event.type)) weight *= 1.18;

  if (state.recentTypes?.includes(event.type)) weight *= 0.45;
  return Math.max(0, weight);
}

function evaluateSimpleExpression(expression, stats, state) {
  if (!expression) return false;
  const match = String(expression).match(/^([a-zA-Z]+)\s*(>=|<=|>|<|==)\s*([\w.-]+)$/);
  if (!match) return false;
  const [, left, op, rightRaw] = match;
  const leftValue = left === 'progress' ? state.progress : stats[left];
  const rightValue = Number.isNaN(Number(rightRaw)) ? rightRaw : Number(rightRaw);
  switch (op) {
    case '>=': return leftValue >= rightValue;
    case '<=': return leftValue <= rightValue;
    case '>': return leftValue > rightValue;
    case '<': return leftValue < rightValue;
    case '==': return leftValue == rightValue;
    default: return false;
  }
}
