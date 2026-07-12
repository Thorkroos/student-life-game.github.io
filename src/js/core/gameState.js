export function createEmptyState() {
  return {
    version: '0.1.0',
    playerName: '',
    gender: 'unspecified',
    duration: '',
    major: '',
    background: '',
    goal: '',
    turn: 0,
    maxTurns: 40,
    progress: 0,
    phase: 'arrival',
    stats: {
      money: 40,
      sanity: 40,
      gpa: 40,
      english: 40,
      lifeSkill: 40,
      social: 40,
      visa: 40,
      career: 40,
      love: 0,
      identity: 40
    },
    room: {
      furniture: ['rug', 'pillow', 'floor_lamp'],
      comfort: 3
    },
    flags: ['rug_beginning'],
    triggeredEvents: [],
    recentEventIds: [],
    recentTypes: [],
    currentEventId: null,
    lastResultText: '',
    completed: false,
    endingHistory: []
  };
}
