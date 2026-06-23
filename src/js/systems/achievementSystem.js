export function getUnlockedAchievements(state) {
  const achievements = [];
  if (state.flags.includes('rug_beginning')) achievements.push('地毯开局');
  if (state.stats.lifeSkill >= 80) achievements.push('留学区贝爷');
  if (state.stats.english >= 80) achievements.push('梦里都在英文吵架');
  if (state.stats.identity >= 80) achievements.push('叙事权回收');
  return achievements;
}
