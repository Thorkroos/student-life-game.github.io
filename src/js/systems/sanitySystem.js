export function getSanityTone(state) {
  const sanity = state.stats.sanity;
  if (sanity <= 15) return 'chaotic';
  if (sanity <= 30) return 'fragile';
  return 'normal';
}
