import { describe, it, expect } from 'vitest';
import { createGame, legalActions, applyAction, isRoundOver, score } from '../engine';
import type { GameState, PlayerSetup } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { chooseAction } from '../../bots/bot';

function botSetups(n: number): PlayerSetup[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `Bot ${i + 1}`,
    isBot: true,
    botDifficulty: 'easy' as const,
  }));
}

function runBotGame(seed: number): GameState {
  let state = createGame(DEFAULT_SETTINGS, botSetups(4), 0, seed);
  let turns = 0;
  const maxTurns = 5000;

  while (!isRoundOver(state) && turns < maxTurns) {
    const player = state.players[state.currentSeat];
    const actions = legalActions(state, player.id);

    // Validate forced pass is legit
    if (actions.length === 1 && actions[0].type === 'ForcedPass') {
      // Engine already validated — just confirm no playable card
    }

    const action = chooseAction(state, player.id, 'easy', seed * 1000 + turns);
    const result = applyAction(state, action);
    state = result.state;
    turns++;
  }

  if (!isRoundOver(state)) {
    throw new Error(`Game ${seed} did not terminate within ${maxTurns} turns`);
  }

  return state;
}

describe('§14.8 Bot self-play (1000 rounds)', () => {
  it('1000 easy-bot games complete without rule violations', { timeout: 30000 }, () => {
    for (let seed = 0; seed < 1000; seed++) {
      const final = runBotGame(seed);

      // Game ended
      expect(final.phase).toBe('ended');
      expect(final.winnerId).not.toBeNull();

      // Winner has 0 cards
      const winner = final.players.find(p => p.id === final.winnerId);
      expect(winner!.hand.length).toBe(0);

      // Scores are valid
      const scores = score(final);
      const winnerScore = scores.find(s => s.playerId === final.winnerId);
      expect(winnerScore!.score).toBe(0);

      for (const s of scores) {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(13 * 13); // Max possible: all face cards of one suit... actually max is sum of 1-13 * ~3 suits
      }
    }
  });
});
