const SAVE_KEY = 'rug_student_life_save_v1';
const HISTORY_KEY = 'rug_student_life_ending_history_v1';

export function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function loadEndingHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEndingToHistory(ending, state) {
  const history = loadEndingHistory();
  const record = {
    endingId: ending.id,
    title: ending.title,
    type: ending.type,
    goal: state.goal,
    goalScore: state.goalScore,
    finishedAt: new Date().toISOString()
  };
  history.unshift(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
  state.endingHistory = history;
}
