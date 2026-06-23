import { getNextEvent } from '../engines/eventEngine.js';
import { applyChoice } from '../engines/effectEngine.js';
import { advanceProgress, updatePhase } from '../engines/progressEngine.js';
import { determineEnding } from '../engines/endingEngine.js';
import { saveGame, saveEndingToHistory } from '../systems/saveSystem.js';
import { renderGame } from '../ui/renderGame.js';
import { renderEnding } from '../ui/renderEnding.js';

export function startTurn(app, data, state) {
  updatePhase(state, data);

  if (state.turn >= state.maxTurns || state.progress >= 100) {
    const ending = determineEnding(state, data);
    state.completed = true;
    saveEndingToHistory(ending, state);
    saveGame(state);
    renderEnding(app, data, state, ending);
    return;
  }

  const event = getNextEvent(state, data.events, data);
  state.currentEventId = event?.id || null;
  renderGame(app, data, state, event, {
    onChoice: choice => {
      const resultText = applyChoice(state, event, choice, data);
      state.lastResultText = resultText;
      saveGame(state);
      renderGame(app, data, state, event, {
        resultText,
        chosenText: choice.text,
        onNext: () => {
          advanceProgress(state, data);
          saveGame(state);
          startTurn(app, data, state);
        }
      });
    }
  });
}
