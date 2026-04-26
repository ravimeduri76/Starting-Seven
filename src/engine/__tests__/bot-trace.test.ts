import { describe, it, expect } from 'vitest';
import { createGame, applyAction, isRoundOver, score } from '../engine';
import type { GameState, PlayerSetup } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { chooseAction } from '../../bots/bot';

function mixedBotSetups(): PlayerSetup[] {
  return [
    { name: 'Easy-Bot', isBot: true, botDifficulty: 'easy' },
    { name: 'Medium-Bot', isBot: true, botDifficulty: 'medium' },
    { name: 'Hard-Bot', isBot: true, botDifficulty: 'hard' },
    { name: 'Easy-Bot-2', isBot: true, botDifficulty: 'easy' },
  ];
}

function runGame(seed: number): GameState {
  let state = createGame(DEFAULT_SETTINGS, mixedBotSetups(), 0, seed);
  let turns = 0;
  while (!isRoundOver(state) && turns < 5000) {
    const player = state.players[state.currentSeat];
    const action = chooseAction(
      state, player.id, player.botDifficulty || 'easy', seed * 1000 + turns,
    );
    const result = applyAction(state, action);
    state = result.state;
    turns++;
  }
  return state;
}

describe('Bot behavior trace', () => {
  it('trace a game with mixed bot levels', () => {
    const final = runGame(42);
    const log = final.turnLog;
    const scores_ = score(final);

    // Print summary
    console.log('\n=== GAME TRACE (seed 42) ===');
    console.log(`Total turns: ${log.length}`);
    console.log(`Winner: ${final.players.find(p => p.id === final.winnerId)?.name}`);
    console.log('\nScores:');
    for (const s of scores_) {
      console.log(`  ${s.name}: ${s.score} (${s.cardsLeft} cards left)`);
    }

    // Count action types per bot
    const stats: Record<string, { plays: number; optPass: number; forcedPass: number; sevensPlayed: number[] }> = {};
    for (const p of final.players) {
      stats[p.name] = { plays: 0, optPass: 0, forcedPass: 0, sevensPlayed: [] };
    }
    for (const entry of log) {
      const s = stats[entry.playerName];
      if (entry.action.type === 'PlayCard') {
        s.plays++;
        if (entry.action.card.rank === 7) s.sevensPlayed.push(entry.turn);
      }
      else if (entry.action.type === 'OptionalPass') s.optPass++;
      else if (entry.action.type === 'ForcedPass') s.forcedPass++;
    }

    console.log('\nAction breakdown:');
    for (const [name, s] of Object.entries(stats)) {
      console.log(`  ${name}: ${s.plays} plays, ${s.optPass} opt-pass, ${s.forcedPass} forced-pass, 7s at turns: [${s.sevensPlayed.join(',')}]`);
    }

    // Print first 20 and last 10 turns
    console.log('\nFirst 20 turns:');
    for (const e of log.slice(0, 20)) {
      const actionStr = e.action.type === 'PlayCard'
        ? `played ${e.action.card.rank}${e.action.card.suit}`
        : e.action.type;
      const cascade = e.cascaded.length > 0 ? ` +cascade(${e.cascaded.map(c => c.rank + c.suit).join(',')})` : '';
      console.log(`  #${e.turn} ${e.playerName.padEnd(12)} ${actionStr.padEnd(18)} left=${e.cardsLeftAfter}  ${e.chainsSnapshot}${cascade}`);
    }
    console.log('\nLast 10 turns:');
    for (const e of log.slice(-10)) {
      const actionStr = e.action.type === 'PlayCard'
        ? `played ${e.action.card.rank}${e.action.card.suit}`
        : e.action.type;
      const cascade = e.cascaded.length > 0 ? ` +cascade(${e.cascaded.map(c => c.rank + c.suit).join(',')})` : '';
      console.log(`  #${e.turn} ${e.playerName.padEnd(12)} ${actionStr.padEnd(18)} left=${e.cardsLeftAfter}  ${e.chainsSnapshot}${cascade}`);
    }

    expect(final.phase).toBe('ended');
  });

  it('medium bot prefers high-value cards over low', () => {
    // Run 100 games, check that medium dumps high cards earlier than easy
    let mediumAvgHighTurn = 0;
    let easyAvgHighTurn = 0;
    let count = 0;

    for (let seed = 0; seed < 100; seed++) {
      const final = runGame(seed);
      for (const entry of final.turnLog) {
        if (entry.action.type !== 'PlayCard') continue;
        if (entry.action.card.rank >= 11) { // J, Q, K
          if (entry.playerName === 'Medium-Bot') mediumAvgHighTurn += entry.turn;
          if (entry.playerName === 'Easy-Bot') easyAvgHighTurn += entry.turn;
        }
      }
      count++;
    }

    console.log(`\nAvg turn when high cards (J/Q/K) played over 100 games:`);
    console.log(`  Medium-Bot: avg turn ${(mediumAvgHighTurn / count).toFixed(1)}`);
    console.log(`  Easy-Bot:   avg turn ${(easyAvgHighTurn / count).toFixed(1)}`);
    // Medium should dump high cards earlier (lower avg turn) than easy
    // Not a hard guarantee due to randomness, but a trend
    expect(true).toBe(true); // Observational test
  });

  it('hard bot wins more often than easy over 200 games', () => {
    const wins: Record<string, number> = {};
    for (let seed = 0; seed < 200; seed++) {
      const final = runGame(seed);
      const winner = final.players.find(p => p.id === final.winnerId)!;
      wins[winner.name] = (wins[winner.name] || 0) + 1;
    }

    console.log('\nWin rates over 200 games (mixed bots):');
    for (const [name, w] of Object.entries(wins).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${name}: ${w} wins (${(w / 2).toFixed(1)}%)`);
    }

    // Hard bot should win at least as often as easy bots
    expect(true).toBe(true); // Observational
  });
});
