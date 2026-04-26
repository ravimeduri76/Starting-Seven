import type {
  Action, Card, GameState, Suit, BotDifficulty,
} from '../engine/types';
import { SUITS, SEVEN, MIN_RANK, MAX_RANK, cardKey } from '../engine/types';
import { legalActions } from '../engine/engine';
import { createRng } from '../engine/rng';

// ── Bot interface ───────────────────────────────────────────

export function chooseAction(
  state: GameState,
  playerId: string,
  difficulty: BotDifficulty,
  rngSeed?: number,
): Action {
  const actions = legalActions(state, playerId);
  if (actions.length === 0) throw new Error(`No legal actions for ${playerId}`);
  if (actions.length === 1) return actions[0];

  const rng = createRng(rngSeed ?? Date.now());

  switch (difficulty) {
    case 'easy':
      return easyBot(actions, rng);
    case 'medium':
      return mediumBot(state, playerId, actions, rng);
    case 'hard':
      return hardBot(state, playerId, actions, rng);
  }
}

// ── Easy bot: random playable card, never optional pass ─────

function easyBot(actions: Action[], rng: () => number): Action {
  // Filter out optional pass — easy bot always plays when it can
  const playActions = actions.filter(a => a.type !== 'OptionalPass');
  if (playActions.length === 0) return actions[0];
  return playActions[Math.floor(rng() * playActions.length)];
}

// ── Medium bot: heuristic-based ─────────────────────────────

function mediumBot(
  state: GameState,
  playerId: string,
  actions: Action[],
  rng: () => number,
): Action {
  const playCards = actions.filter(a => a.type === 'PlayCard') as
    Extract<Action, { type: 'PlayCard' }>[];

  if (playCards.length === 0) return actions[0]; // forced pass

  // Score each play card
  const scored = playCards.map(a => ({
    action: a as Action,
    score: mediumScore(state, playerId, a.card),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Check optional pass: only pass when holding both ends of a chain
  const optionalPass = actions.find(a => a.type === 'OptionalPass');
  if (optionalPass && shouldMediumPass(state, playerId)) {
    return optionalPass;
  }

  // Pick the best card (with small randomness to avoid predictability)
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    // Tie-break randomly among top-scorers
    const topScore = scored[0].score;
    const ties = scored.filter(s => s.score === topScore);
    return ties[Math.floor(rng() * ties.length)].action;
  }

  return scored[0].action;
}

function mediumScore(state: GameState, playerId: string, card: Card): number {
  let score = 0;

  // Prefer high-value cards (dump them early to minimize loss risk)
  score += card.rank * 2;

  // Prefer playing 7s (opens suits, which is generally good)
  if (card.rank === SEVEN) score += 15;

  // Penalize plays that immediately enable opponents to dump high cards
  // Check if playing this card would make the next rank playable
  const chain = state.chains[card.suit];
  if (chain) {
    // If extending low end, check if rank-2 is held by someone else
    if (card.rank === chain.low - 1) {
      const adjacentRank = card.rank - 1;
      if (adjacentRank >= MIN_RANK && isHeldByOpponent(state, playerId, adjacentRank, card.suit)) {
        score -= 5; // Slight penalty
      }
    }
    // If extending high end
    if (card.rank === chain.high + 1) {
      const adjacentRank = card.rank + 1;
      if (adjacentRank <= MAX_RANK && isHeldByOpponent(state, playerId, adjacentRank, card.suit)) {
        score -= 5;
      }
    }
  }

  return score;
}

function shouldMediumPass(state: GameState, playerId: string): boolean {
  const player = state.players.find(p => p.id === playerId)!;
  // Pass when holding both ends of a chain (to delay opening opportunities)
  for (const suit of SUITS) {
    const chain = state.chains[suit];
    if (!chain) continue;
    const hasLow = player.hand.some(c => c.suit === suit && c.rank === chain.low - 1);
    const hasHigh = player.hand.some(c => c.suit === suit && c.rank === chain.high + 1);
    if (hasLow && hasHigh) return true;
  }
  return false;
}

function isHeldByOpponent(
  state: GameState,
  botId: string,
  rank: number,
  suit: Suit,
): boolean {
  // In hot-seat, the bot knows all hands (engine has full state)
  for (const p of state.players) {
    if (p.id === botId) continue;
    if (p.hand.some(c => c.rank === rank && c.suit === suit)) return true;
  }
  return false;
}

// ── Hard bot: card counting + chain velocity + lookahead ────

function hardBot(
  state: GameState,
  playerId: string,
  actions: Action[],
  rng: () => number,
): Action {
  const playCards = actions.filter(a => a.type === 'PlayCard') as
    Extract<Action, { type: 'PlayCard' }>[];

  if (playCards.length === 0) return actions[0]; // forced pass

  // Card counting: build a picture of what's been played and what remains
  const played = buildPlayedSet(state);
  const velocities = computeChainVelocities(state, playerId, played);

  // Score each play
  const scored = playCards.map(a => ({
    action: a as Action,
    score: hardScore(state, playerId, a.card, velocities, played),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Consider optional pass strategically
  const optionalPass = actions.find(a => a.type === 'OptionalPass');
  if (optionalPass && shouldHardPass(state, playerId, scored, velocities)) {
    return optionalPass;
  }

  // Pick the best card
  if (scored.length > 1 && Math.abs(scored[0].score - scored[1].score) < 0.5) {
    const topScore = scored[0].score;
    const ties = scored.filter(s => Math.abs(s.score - topScore) < 0.5);
    return ties[Math.floor(rng() * ties.length)].action;
  }

  return scored[0].action;
}

/** Build set of all played/incorporated cards (in chains or incorporated leftovers). */
function buildPlayedSet(state: GameState): Set<string> {
  const played = new Set<string>();

  for (const suit of SUITS) {
    const chain = state.chains[suit];
    if (chain) {
      for (let r = chain.low; r <= chain.high; r++) {
        played.add(cardKey({ rank: r, suit }));
      }
    }
  }

  // Incorporated leftovers are already counted in chains
  // Non-incorporated leftovers are visible but not played
  for (const lo of state.leftovers) {
    if (lo.incorporated) {
      played.add(cardKey(lo.card));
    }
  }

  return played;
}

/** Estimate chain velocity: probability that each chain extends in the next round. */
function computeChainVelocities(
  state: GameState,
  _botId: string,
  played: Set<string>,
): Record<Suit, number> {
  const velocities: Record<Suit, number> = { S: 0, H: 0, D: 0, C: 0 };
  const numOpponents = state.players.length - 1;

  for (const suit of SUITS) {
    const chain = state.chains[suit];
    if (!chain) {
      // Chain not open — velocity depends on whether a 7 is in someone's hand
      // (visible leftovers already anchor)
      velocities[suit] = 0.3; // Low default
      continue;
    }

    let extendableCards = 0;
    // Check low extension
    if (chain.low > MIN_RANK) {
      const nextLow = chain.low - 1;
      const key = cardKey({ rank: nextLow, suit });
      if (!played.has(key)) {
        // Card exists somewhere — in a hand or non-incorporated leftover
        const inLeftover = state.leftovers.some(
          l => !l.incorporated && l.card.rank === nextLow && l.card.suit === suit
        );
        if (inLeftover) {
          // Will auto-incorporate when reached — adds momentum
          extendableCards += 1.5;
        } else {
          extendableCards += 1;
        }
      }
    }
    // Check high extension
    if (chain.high < MAX_RANK) {
      const nextHigh = chain.high + 1;
      const key = cardKey({ rank: nextHigh, suit });
      if (!played.has(key)) {
        const inLeftover = state.leftovers.some(
          l => !l.incorporated && l.card.rank === nextHigh && l.card.suit === suit
        );
        if (inLeftover) {
          extendableCards += 1.5;
        } else {
          extendableCards += 1;
        }
      }
    }

    // Probability estimate: how likely is it that at least one opponent holds
    // a card adjacent to this chain? Simple heuristic based on remaining cards.
    const totalUnplayed = 52 - played.size;
    if (totalUnplayed === 0) {
      velocities[suit] = 0;
    } else {
      // Probability at least one opponent has an adjacent card
      // Rough: P = 1 - (1 - extendable/totalUnplayed)^numOpponents
      const pNone = Math.pow(1 - extendableCards / totalUnplayed, numOpponents);
      velocities[suit] = 1 - pNone;
    }
  }

  return velocities;
}

function hardScore(
  state: GameState,
  playerId: string,
  card: Card,
  velocities: Record<Suit, number>,
  _played: Set<string>,
): number {
  let score = 0;
  const player = state.players.find(p => p.id === playerId)!;

  // Base: prefer high-value cards
  score += card.rank * 1.5;

  // Playing 7s is important
  if (card.rank === SEVEN) score += 20;

  // Chain velocity strategy:
  // Dump high-value cards into SLOW chains (less likely to complete,
  // so opponents stuck with cards in that suit score higher)
  const velocity = velocities[card.suit];
  if (card.rank >= 11) {
    // High-value card: prefer slow chains
    score += (1 - velocity) * 10;
  }

  // If we're ahead (fewer cards), prefer blocking plays
  const myCards = player.hand.length;
  const avgOpponentCards = state.players
    .filter(p => p.id !== playerId)
    .reduce((sum, p) => sum + p.hand.length, 0) / (state.players.length - 1);

  if (myCards < avgOpponentCards) {
    // We're ahead — prefer plays that don't open opportunities for opponents
    // Penalize extending fast chains (helps opponents dump)
    if (velocity > 0.7) score -= 8;
  } else {
    // We're behind — dump as fast as possible
    score += velocity * 5;
  }

  // Count how many of our cards become playable after this play
  // (one-ply lookahead)
  const enabledCount = countEnabledCards(state, playerId, card);
  score += enabledCount * 3;

  return score;
}

function countEnabledCards(
  state: GameState,
  playerId: string,
  cardToPlay: Card,
): number {
  const player = state.players.find(p => p.id === playerId)!;
  const remainingHand = player.hand.filter(c => !(c.rank === cardToPlay.rank && c.suit === cardToPlay.suit));

  // Simulate the chain after playing this card
  const chain = state.chains[cardToPlay.suit];
  let newLow: number, newHigh: number;

  if (cardToPlay.rank === SEVEN && !chain) {
    newLow = SEVEN;
    newHigh = SEVEN;
  } else if (chain) {
    newLow = cardToPlay.rank === chain.low - 1 ? cardToPlay.rank : chain.low;
    newHigh = cardToPlay.rank === chain.high + 1 ? cardToPlay.rank : chain.high;
  } else {
    return 0;
  }

  // Check how many remaining hand cards become playable
  let count = 0;
  for (const c of remainingHand) {
    if (c.suit !== cardToPlay.suit) continue;
    if (c.rank === newLow - 1 || c.rank === newHigh + 1) count++;
  }

  return count;
}

function shouldHardPass(
  state: GameState,
  playerId: string,
  scored: { action: Action; score: number }[],
  velocities: Record<Suit, number>,
): boolean {
  const player = state.players.find(p => p.id === playerId)!;

  // Don't pass if we have very few cards (close to winning)
  if (player.hand.length <= 3) return false;

  // Pass if our best play enables a fast chain for opponents
  // and we're currently ahead
  const myCards = player.hand.length;
  const avgOpponentCards = state.players
    .filter(p => p.id !== playerId)
    .reduce((sum, p) => sum + p.hand.length, 0) / (state.players.length - 1);

  if (myCards > avgOpponentCards) return false; // Behind — play, don't pass

  // Check if best play is in a fast chain
  const bestAction = scored[0]?.action;
  if (bestAction?.type === 'PlayCard') {
    const vel = velocities[bestAction.card.suit];
    if (vel > 0.7) return true; // Best play helps opponents — pass instead
  }

  return false;
}
