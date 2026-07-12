export function advanceProgress(state, data) {
  state.turn += 1;
  state.progress = Math.min(100, Math.round((state.turn / state.maxTurns) * 100));
  updatePhase(state, data);
}

export function updatePhase(state, data) {
  const phase = data.phases.find(item => state.progress >= item.minProgress && state.progress < item.maxProgress)
    || data.phases[data.phases.length - 1];
  state.phase = phase.id;
}

export function getPhaseLabel(state, data) {
  return data.phases.find(item => item.id === state.phase)?.label || state.phase;
}

export function getPhaseProgress(state, data) {
  const phaseIndex = data.phases.findIndex(item => item.id === state.phase);
  const phase = data.phases[phaseIndex] || data.phases[data.phases.length - 1];
  const span = Math.max(1, phase.maxProgress - phase.minProgress);
  const phaseProgress = Math.round(((state.progress - phase.minProgress) / span) * 100);
  return {
    phase,
    phaseIndex,
    phaseProgress: Math.max(0, Math.min(100, phaseProgress)),
    nextPhase: data.phases[phaseIndex + 1] || null,
    totalPhases: data.phases.length
  };
}
