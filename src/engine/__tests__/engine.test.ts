import { describe, it, expect } from 'vitest';
import {
  createGame, legalActions, applyAction, isRoundOver, score,
  getPlayableCards,
} from '../engine';
import type { Card, Suit, GameState, GameSettings, PlayerSetup } from '../types';
import { DEFAULT_SETTINGS, SEVEN } from '../types';

// ── Helpers ─────────────────────────────────────────────────

function makeSetups(n: number): PlayerSetup[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `Player ${i + 1}`,
    isBot: false,
    botDifficulty: null,
  }));
}

function findPlayerWith7(state: GameState, suit: Suit): string | null {
  for (const p of state.players) {
    if (p.hand.some(c => c.rank === SEVEN && c.suit === suit)) return p.id;
  }
  return null;
}

function getCurrentPlayer(state: GameState) {
  return state.players[state.currentSeat];
}

function playUntilEnd(state: GameState, maxTurns = 5000): GameState {
  let s = state;
  let turns = 0;
  while (!isRoundOver(s) && turns < maxTurns) {
    const player = getCurrentPlayer(s);
    const actions = legalActions(s, player.id);
    if (actions.length === 0) throw new Error(`No legal actions for ${player.id}`);
    // Play first legal action (prefer PlayCard over pass)
    const playAction = actions.find(a => a.type === 'PlayCard') ?? actions[0];
    const result = applyAction(s, playAction);
    s = result.state;
    turns++;
  }
  if (!isRoundOver(s)) throw new Error(`Game did not end within ${maxTurns} turns`);
  return s;
}

// ── §14.1 Setup correctness ────────────────────────────────

describe('§14.1 Setup correctness', () => {
  it('4 players: each gets 13 cards, no leftovers', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    for (const p of state.players) {
      expect(p.hand.length).toBe(13);
    }
    expect(state.leftovers.length).toBe(0);
  });

  it('3 players: each gets 17 cards, 1 leftover', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(3), 0, 42);
    for (const p of state.players) {
      expect(p.hand.length).toBe(17);
    }
    expect(state.leftovers.filter(l => !l.incorporated).length +
           state.leftovers.filter(l => l.incorporated).length).toBe(1);
  });

  it('5 players: each gets 10 cards, 2 leftovers', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(5), 0, 42);
    for (const p of state.players) {
      expect(p.hand.length).toBe(10);
    }
    expect(state.leftovers.length).toBe(2);
  });

  it('all 52 cards accounted for', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    const allCards: Card[] = [];
    for (const p of state.players) allCards.push(...p.hand);
    for (const lo of state.leftovers) allCards.push(lo.card);
    expect(allCards.length).toBe(52);
    // Check uniqueness
    const keys = new Set(allCards.map(c => `${c.rank}${c.suit}`));
    expect(keys.size).toBe(52);
  });
});

// ── §14.2 Starting player ──────────────────────────────────

describe('§14.2 Starting player', () => {
  it('player with 7♠ starts', () => {
    // Try seeds until we find one where 7S is not in leftovers
    for (let seed = 0; seed < 100; seed++) {
      const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, seed);
      // 4 players = no leftovers, so someone must have 7S
      const holderId = findPlayerWith7(state, 'S');
      expect(holderId).not.toBeNull();
      const holder = state.players.find(p => p.id === holderId)!;
      expect(state.currentSeat).toBe(holder.seatIndex);
      break;
    }
  });

  it('when 7♠ is in leftovers, 7♥ holder starts', () => {
    // With 3 players, 1 leftover. Try seeds until 7S is the leftover.
    for (let seed = 0; seed < 10000; seed++) {
      const state = createGame(DEFAULT_SETTINGS, makeSetups(3), 0, seed);
      const leftover7S = state.leftovers.some(l => l.card.rank === SEVEN && l.card.suit === 'S');
      if (!leftover7S) continue;

      const holderId7H = findPlayerWith7(state, 'H');
      if (holderId7H) {
        const holder = state.players.find(p => p.id === holderId7H)!;
        expect(state.currentSeat).toBe(holder.seatIndex);
      }
      return;
    }
    // If we can't find the scenario, that's OK — probabilistic
  });

  it('first action must be a 7 play', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    const player = getCurrentPlayer(state);
    const actions = legalActions(state, player.id);
    // Should contain at least one PlayCard with a 7
    const sevenPlays = actions.filter(
      a => a.type === 'PlayCard' && a.card.rank === SEVEN
    );
    expect(sevenPlays.length).toBeGreaterThan(0);
  });
});

// ── §14.3 Playability ──────────────────────────────────────

describe('§14.3 Playability', () => {
  it('empty chain: only 7s are playable from that suit', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    // Before any chain is opened, only 7s should be playable
    // Plus extending any chain already anchored by leftover 7s
    // With 4 players, no leftovers, so no pre-anchored chains
    const player = getCurrentPlayer(state);
    const actions = legalActions(state, player.id);
    const playCards = actions.filter(a => a.type === 'PlayCard');
    for (const a of playCards) {
      if (a.type === 'PlayCard') {
        expect(a.card.rank).toBe(SEVEN);
      }
    }
  });

  it('chain reaching Ace: cannot go below', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    // Manually set up a chain from A to 7
    state.chains['S'] = { suit: 'S', low: 1, high: 7 };
    // Only 8S should be playable in spades (can't go below 1)
    const hand: Card[] = [
      { rank: 1, suit: 'H' }, // not a spade
      { rank: 8, suit: 'S' }, // playable - extends high
    ];
    const playable = getPlayableCards(hand, state.chains);
    const spadePlayable = playable.filter(c => c.suit === 'S');
    expect(spadePlayable).toEqual([{ rank: 8, suit: 'S' }]);
  });

  it('chain reaching King: cannot go above', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.chains['S'] = { suit: 'S', low: 7, high: 13 };
    const hand: Card[] = [
      { rank: 6, suit: 'S' }, // playable - extends low
      { rank: 13, suit: 'H' }, // not a spade
    ];
    const playable = getPlayableCards(hand, state.chains);
    const spadePlayable = playable.filter(c => c.suit === 'S');
    expect(spadePlayable).toEqual([{ rank: 6, suit: 'S' }]);
  });

  it('multiple chains open: cards playable in each', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.chains['S'] = { suit: 'S', low: 5, high: 9 };
    state.chains['H'] = { suit: 'H', low: 7, high: 7 };
    const hand: Card[] = [
      { rank: 4, suit: 'S' },  // playable
      { rank: 10, suit: 'S' }, // playable
      { rank: 6, suit: 'H' },  // playable
      { rank: 3, suit: 'S' },  // NOT playable (not adjacent)
      { rank: 9, suit: 'H' },  // NOT playable (not adjacent to 7)
    ];
    const playable = getPlayableCards(hand, state.chains);
    expect(playable.length).toBe(3);
  });
});

// ── §14.4 Leftover cascade ─────────────────────────────────

describe('§14.4 Leftover cascade', () => {
  it('single leftover incorporation', () => {
    // Setup: 9♠ leftover, chain 6-8, player plays 10♠ (adjacent to high=8? no, 10 is +2)
    // Better: chain is 6-8, leftover is 9♠, player plays... wait, 9♠ is in leftover.
    // Correct scenario: chain 6-8, leftover 5♠. Player plays... 5♠ adjacent to low=6.
    // But 5♠ is a leftover, not in hand. We need player to extend chain to reach leftover.
    // Scenario: chain 7-7, leftover 5♠. Player plays 6♠ (adjacent to 7).
    // After 6♠ played, chain is 6-7. Now 5♠ is adjacent to low=6, cascade triggers.
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.phase = 'play';
    state.chains['S'] = { suit: 'S', low: 7, high: 7 };
    state.leftovers = [{ card: { rank: 5, suit: 'S' }, incorporated: false }];

    const player = getCurrentPlayer(state);
    player.hand = [{ rank: 6, suit: 'S' }, { rank: 2, suit: 'H' }];

    const result = applyAction(state, { type: 'PlayCard', card: { rank: 6, suit: 'S' } });
    // Chain should now be 5-7 (6 played, 5 cascaded in)
    expect(result.state.chains['S']!.low).toBe(5);
    expect(result.state.chains['S']!.high).toBe(7);
    expect(result.state.leftovers[0].incorporated).toBe(true);
    expect(result.events.some(e => e.type === 'LeftoverIncorporated')).toBe(true);
  });

  it('cascade: multiple leftovers chain together', () => {
    // Chain 7-7, leftovers 5♠ and 6♠. Player plays 4♠? No, 4 not adjacent to 7.
    // Better: chain 7-7, leftovers 5♠ and 6♠. Player plays 8♠ (up side).
    // No cascade there. We need the low side.
    // Chain 7-9, leftovers 5♠ and 6♠. Player plays... can't reach them.
    // Correct: chain 7-7, leftovers 4♠ and 5♠. Player plays 6♠ (adjacent to 7).
    // After play: chain 6-7. 5♠ cascades (adjacent to 6). chain 5-7. 4♠ cascades. chain 4-7.
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.phase = 'play';
    state.chains['S'] = { suit: 'S', low: 7, high: 7 };
    state.leftovers = [
      { card: { rank: 4, suit: 'S' }, incorporated: false },
      { card: { rank: 5, suit: 'S' }, incorporated: false },
    ];

    const player = getCurrentPlayer(state);
    player.hand = [{ rank: 6, suit: 'S' }, { rank: 2, suit: 'H' }];

    const result = applyAction(state, { type: 'PlayCard', card: { rank: 6, suit: 'S' } });
    // Chain should be 4-7 (6 played, then 5 cascades, then 4 cascades)
    expect(result.state.chains['S']!.low).toBe(4);
    expect(result.state.chains['S']!.high).toBe(7);
    expect(result.state.leftovers.every(l => l.incorporated)).toBe(true);
    const cascadeEvents = result.events.filter(e => e.type === 'LeftoverIncorporated');
    expect(cascadeEvents.length).toBe(2);
  });
});

// ── §14.5 Optional pass enforcement ────────────────────────

describe('§14.5 Optional pass enforcement', () => {
  it('player with a 7 cannot use optional pass (default mode)', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.phase = 'play';
    state.chains['S'] = { suit: 'S', low: 7, high: 7 };

    const player = getCurrentPlayer(state);
    // Give them a 7 and a playable non-7
    player.hand = [
      { rank: 7, suit: 'H' },
      { rank: 8, suit: 'S' },
    ];

    const actions = legalActions(state, player.id);
    expect(actions.some(a => a.type === 'OptionalPass')).toBe(false);
  });

  it('player without 7 can optional pass, then must play, then can pass again', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.phase = 'play';
    state.chains['S'] = { suit: 'S', low: 7, high: 7 };

    const player = getCurrentPlayer(state);
    player.hand = [{ rank: 8, suit: 'S' }, { rank: 6, suit: 'S' }, { rank: 9, suit: 'S' }];

    // Can optional pass initially
    const actions = legalActions(state, player.id);
    expect(actions.some(a => a.type === 'OptionalPass')).toBe(true);

    // Use the optional pass
    const result1 = applyAction(state, { type: 'OptionalPass' });
    expect(result1.state.mustPlayNext[player.id]).toBe(true);

    // Come back to this player — cannot optional pass (must play)
    result1.state.currentSeat = player.seatIndex;
    const actions2 = legalActions(result1.state, player.id);
    expect(actions2.some(a => a.type === 'OptionalPass')).toBe(false);
    expect(actions2.some(a => a.type === 'PlayCard')).toBe(true);

    // Play a card
    const result2 = applyAction(result1.state, { type: 'PlayCard', card: { rank: 8, suit: 'S' } });
    expect(result2.state.mustPlayNext[player.id]).toBe(false);

    // Come back again — can optional pass again
    result2.state.currentSeat = player.seatIndex;
    const actions3 = legalActions(result2.state, player.id);
    expect(actions3.some(a => a.type === 'OptionalPass')).toBe(true);
  });

  it('invalid optional pass is rejected', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.phase = 'play';
    state.chains['S'] = { suit: 'S', low: 7, high: 7 };

    const player = getCurrentPlayer(state);
    player.hand = [{ rank: 7, suit: 'H' }, { rank: 8, suit: 'S' }];

    expect(() => applyAction(state, { type: 'OptionalPass' })).toThrow();
  });
});

// ── §14.6 Forced pass enforcement ──────────────────────────

describe('§14.6 Forced pass enforcement', () => {
  it('player with no playable card has only ForcedPass', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.phase = 'play';
    state.chains['S'] = { suit: 'S', low: 5, high: 9 };
    // No other chains open

    const player = getCurrentPlayer(state);
    // Give cards that are not adjacent to any chain end and not 7s
    player.hand = [
      { rank: 2, suit: 'S' },  // not adjacent to 5
      { rank: 12, suit: 'S' }, // not adjacent to 9
    ];

    const actions = legalActions(state, player.id);
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe('ForcedPass');
  });
});

// ── §14.7 Scoring ──────────────────────────────────────────

describe('§14.7 Scoring', () => {
  it('winner scores 0, losers score sum of remaining card values', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.phase = 'ended';
    state.winnerId = 'p0';
    state.players[0].hand = []; // winner
    state.players[1].hand = [{ rank: 13, suit: 'S' }, { rank: 12, suit: 'H' }]; // K + Q = 25
    state.players[2].hand = [{ rank: 1, suit: 'S' }]; // A = 1
    state.players[3].hand = [{ rank: 11, suit: 'S' }, { rank: 10, suit: 'H' }, { rank: 5, suit: 'D' }]; // 26

    const scores = score(state);
    expect(scores.find(s => s.playerId === 'p0')!.score).toBe(0);
    expect(scores.find(s => s.playerId === 'p1')!.score).toBe(25);
    expect(scores.find(s => s.playerId === 'p2')!.score).toBe(1);
    expect(scores.find(s => s.playerId === 'p3')!.score).toBe(26);
  });
});

// ── §14.8 Bot rule compliance (mini version; full 1000-round test is separate) ──

describe('§14.8 Bot rule compliance (quick)', () => {
  it('10 random games complete without rule violations', () => {
    for (let seed = 0; seed < 10; seed++) {
      const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, seed);
      const final = playUntilEnd(state);
      expect(final.phase).toBe('ended');
      expect(final.winnerId).not.toBeNull();

      const scores_ = score(final);
      const winner = scores_.find(s => s.playerId === final.winnerId);
      expect(winner!.score).toBe(0);
      for (const s of scores_) {
        expect(s.score).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ── §14.9 Determinism ──────────────────────────────────────

describe('§14.9 Determinism', () => {
  it('same seed produces identical game states', () => {
    const state1 = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 12345);
    const state2 = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 12345);

    // Hands should be identical
    for (let i = 0; i < 4; i++) {
      expect(state1.players[i].hand).toEqual(state2.players[i].hand);
    }
    expect(state1.currentSeat).toBe(state2.currentSeat);
  });

  it('same seed + same actions produce identical final states', () => {
    const run = (seed: number): GameState => {
      let state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, seed);
      return playUntilEnd(state);
    };

    const final1 = run(99);
    const final2 = run(99);
    expect(final1.winnerId).toBe(final2.winnerId);
    expect(final1.history.length).toBe(final2.history.length);
    for (let i = 0; i < final1.history.length; i++) {
      expect(final1.history[i]).toEqual(final2.history[i]);
    }
  });
});

// ── §14.10 Toggle behavior ─────────────────────────────────

describe('§14.10 Toggle behavior', () => {
  it('softSevenHold: player with 7 CAN optional pass', () => {
    const settings: GameSettings = { ...DEFAULT_SETTINGS, softSevenHold: true };
    const state = createGame(settings, makeSetups(4), 0, 42);
    state.phase = 'play';
    state.chains['S'] = { suit: 'S', low: 7, high: 7 };

    const player = getCurrentPlayer(state);
    player.hand = [{ rank: 7, suit: 'H' }, { rank: 8, suit: 'S' }];

    const actions = legalActions(state, player.id);
    expect(actions.some(a => a.type === 'OptionalPass')).toBe(true);
  });

  it('preGameSwap: phase starts as swap', () => {
    const settings: GameSettings = { ...DEFAULT_SETTINGS, preGameSwap: true };
    const state = createGame(settings, makeSetups(4), 0, 42);
    expect(state.phase).toBe('swap');
    expect(state.swapSelections).toEqual({});
  });
});

// ── Edge cases ─────────────────────────────────────────────

describe('Edge cases', () => {
  it('2-player game works', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(2), 0, 42);
    expect(state.players[0].hand.length).toBe(26);
    expect(state.players[1].hand.length).toBe(26);
    const final = playUntilEnd(state);
    expect(final.phase).toBe('ended');
  });

  it('6-player game works', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(6), 0, 42);
    // 52/6 = 8 cards each, 4 leftovers
    for (const p of state.players) {
      expect(p.hand.length).toBe(8);
    }
    expect(state.leftovers.length).toBe(4);
    const final = playUntilEnd(state);
    expect(final.phase).toBe('ended');
  });

  it('complete chain (A to K) makes suit fully played', () => {
    const state = createGame(DEFAULT_SETTINGS, makeSetups(4), 0, 42);
    state.chains['S'] = { suit: 'S', low: 1, high: 13 };
    const hand: Card[] = [{ rank: 5, suit: 'S' }]; // In completed chain — not playable
    const playable = getPlayableCards(hand, state.chains);
    expect(playable.length).toBe(0);
  });
});
