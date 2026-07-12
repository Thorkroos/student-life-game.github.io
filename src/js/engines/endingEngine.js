import { ruleMatches } from './conditionEngine.js';

export function calculateGoalScore(state, data) {
  const goal = data.goals.find(item => item.id === state.goal);
  const weights = goal?.scoreWeights || {};
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (state.stats[key] ?? 0) * weight;
  }
  return Math.round(score + (Number(goal?.scoreBonus) || 0));
}

export function determineEndingType(state, data) {
  const s = state.stats;
  if (s.sanity <= 0) return 'BE';
  if (s.gpa <= 8 && state.progress >= 70) return 'BE';
  if (s.gpa <= 18 && ['phd', 'return_home'].includes(state.goal)) return 'BE';
  if (s.money <= 0 && s.visa <= 15 && s.sanity <= 30) return 'BE';
  if (s.visa <= 8 && state.goal === 'stay') return 'BE';

  const score = calculateGoalScore(state, data);
  state.goalScore = score;
  let type = score >= 68 ? 'HE' : score >= 48 ? 'NE' : 'BE';

  if (s.sanity < 20) type = downgrade(type);
  if (s.identity < 30 && type === 'HE') type = 'NE';
  if (s.money <= 0 && s.lifeSkill < 50 && type === 'HE') type = 'NE';
  if (state.goal === 'stay' && s.visa < 25 && type === 'HE') type = 'NE';
  return type;
}

function downgrade(type) {
  if (type === 'HE') return 'NE';
  if (type === 'NE') return 'BE';
  return type;
}

function hasMetaEnding(state) {
  const absurdFlags = [
    'delivery_missing', 'ikea_missing_screw', 'kyle_missing', 'landlord_denial',
    'studio_invitation', 'muse_event', 'wechat_group_chaos', 'linkedin_warrior',
    'visa_forum_spiral', 'due_date_distortion'
  ];
  const count = absurdFlags.filter(flag => state.flags.includes(flag)).length;
  return state.stats.identity >= 85
    && state.stats.sanity >= 40
    && count >= 5
    && state.flags.includes('rug_beginning')
    && state.flags.includes('self_narrative')
    && (state.endingHistory?.length || 0) >= 1;
}

export function determineEnding(state, data) {
  state.goalScore = calculateGoalScore(state, data);

  if (hasMetaEnding(state)) {
    return data.endings.find(item => item.id === 'ending_meta_game');
  }

  const type = determineEndingType(state, data);
  const sortedRules = [...data.endingRules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const matchedRule = sortedRules.find(rule => ruleMatches(state, rule, type))
    || sortedRules.find(rule => rule.type === type)
    || sortedRules[0];

  const ending = data.endings.find(item => item.id === matchedRule.endingId) || data.endings[0];
  return { ...ending, type, goalScore: state.goalScore };
}
