function hasAnyTag(tags = [], target) {
  return tags.includes('any') || tags.includes(target);
}

function checkStats(stats, minStats = {}, maxStats = {}) {
  for (const [key, value] of Object.entries(minStats)) {
    if ((stats[key] ?? 0) < value) return false;
  }
  for (const [key, value] of Object.entries(maxStats)) {
    if ((stats[key] ?? 0) > value) return false;
  }
  return true;
}

function checkFlags(state, required = [], blocked = []) {
  const flags = new Set(state.flags || []);
  for (const flag of required) {
    if (!flags.has(flag)) return false;
  }
  for (const flag of blocked) {
    if (flags.has(flag)) return false;
  }
  return true;
}

export function eventMatches(state, event) {
  const c = event.conditions || {};
  if (event.phase && !event.phase.includes(state.phase)) return false;
  if (typeof c.minProgress === 'number' && state.progress < c.minProgress) return false;
  if (typeof c.maxProgress === 'number' && state.progress > c.maxProgress) return false;
  if (event.majorTags && !hasAnyTag(event.majorTags, state.major)) return false;
  if (event.goalTags && !hasAnyTag(event.goalTags, state.goal)) return false;
  if (event.backgroundTags && !hasAnyTag(event.backgroundTags, state.background)) return false;
  if (!checkStats(state.stats, c.minStats, c.maxStats)) return false;
  if (!checkFlags(state, c.requiredFlags, c.blockedFlags)) return false;
  if (event.once && state.triggeredEvents?.includes(event.id)) return false;
  return true;
}

export function ruleMatches(state, rule, endingType = null) {
  if (endingType && rule.type && rule.type !== endingType) return false;
  const c = rule.conditions || {};
  if (c.goals && !c.goals.includes(state.goal)) return false;
  if (!checkStats(state.stats, c.minStats, c.maxStats)) return false;
  if (!checkFlags(state, c.requiredFlags, c.blockedFlags)) return false;
  if (typeof c.minGoalScore === 'number' && (state.goalScore ?? 0) < c.minGoalScore) return false;
  if (typeof c.maxGoalScore === 'number' && (state.goalScore ?? 0) > c.maxGoalScore) return false;
  return true;
}
