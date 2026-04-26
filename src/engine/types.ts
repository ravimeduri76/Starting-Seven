// ── Card types ──────────────────────────────────────────────

export type Suit = 'S' | 'H' | 'D' | 'C';
export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'] as const;
export const MIN_RANK = 1;  // Ace
export const MAX_RANK = 13; // King
export const SEVEN = 7;

export interface Card {
  rank: number; // 1=A, 2-10, 11=J, 12=Q, 13=K
  suit: Suit;
}

export function cardValue(card: Card): number {
  return card.rank; // Ace=1, ..., King=13
}

export function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

// ── Chain ───────────────────────────────────────────────────

export interface Chain {
  suit: Suit;
  low: number;  // lowest rank present (inclusive)
  high: number; // highest rank present (inclusive)
}

// ── Player ──────────────────────────────────────────────────

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  botDifficulty: BotDifficulty | null;
  seatIndex: number;
  hand: Card[];
}

// ── Settings ────────────────────────────────────────────────

export interface GameSettings {
  preGameSwap: boolean;
  softSevenHold: boolean;
  softSevenHoldTurns: number;
  ghostChain: boolean; // UI-only, no engine effect
}

export const DEFAULT_SETTINGS: GameSettings = {
  preGameSwap: false,
  softSevenHold: false,
  softSevenHoldTurns: 2,
  ghostChain: true,
};

// ── Actions ─────────────────────────────────────────────────

export type Action =
  | { type: 'PlayCard'; card: Card }
  | { type: 'OptionalPass' }
  | { type: 'ForcedPass' }
  | { type: 'SwapSelect'; card: Card };

// ── Events ──────────────────────────────────────────────────

export type GameEvent =
  | { type: 'CardPlayed'; playerId: string; card: Card }
  | { type: 'LeftoverIncorporated'; card: Card; suit: Suit }
  | { type: 'OptionalPassUsed'; playerId: string }
  | { type: 'ForcedPass'; playerId: string }
  | { type: 'ChainOpened'; suit: Suit; by: 'player' | 'leftover' }
  | { type: 'RoundEnded'; winnerId: string }
  | { type: 'SwapCompleted'; swaps: { from: string; to: string; card: Card }[] };

// ── Turn log entry ──────────────────────────────────────────

export interface TurnLogEntry {
  turn: number;
  playerId: string;
  playerName: string;
  action: Action;
  cardsLeftAfter: number;
  cascaded: Card[];       // leftover cards that auto-incorporated this turn
  chainsSnapshot: string; // compact summary, e.g. "S:3-9 H:7 D:- C:5-10"
}

// ── Leftover card ───────────────────────────────────────────

export interface LeftoverCard {
  card: Card;
  incorporated: boolean;
}

// ── Seven hold tenure (for softSevenHold) ───────────────────

// Maps playerId -> cardKey -> turns held while playable
export type SevenHoldTenure = Record<string, Record<string, number>>;

// ── Game phase ──────────────────────────────────────────────

export type GamePhase = 'swap' | 'play' | 'ended';

// ── Game state ──────────────────────────────────────────────

export interface GameState {
  settings: GameSettings;
  players: Player[];
  dealerSeat: number;
  currentSeat: number;
  chains: Record<Suit, Chain | null>;
  leftovers: LeftoverCard[];
  mustPlayNext: Record<string, boolean>;
  sevenHoldTenure: SevenHoldTenure;
  history: Action[];
  turnLog: TurnLogEntry[];
  phase: GamePhase;
  winnerId: string | null;
  // For swap phase
  swapSelections: Record<string, Card> | null;
  // For determinism
  shuffleSeed: number;
}

// ── Player setup input ──────────────────────────────────────

export interface PlayerSetup {
  name: string;
  isBot: boolean;
  botDifficulty: BotDifficulty | null;
}

// ── Score result ────────────────────────────────────────────

export interface ScoreEntry {
  playerId: string;
  name: string;
  score: number;
  cardsLeft: number;
}

// ── Match-level types (not in engine state — managed by UI hook) ──

export type GameMode = 'solo' | 'local';

export interface MatchConfig {
  mode: GameMode;
  totalRounds: number;   // 1 | 3 | 5 | 7 | 10
  targetScore: number;   // 25 | 50 | 75 | 100 | 150
}

export interface RoundResult {
  roundNumber: number;
  winnerId: string;
  scores: ScoreEntry[];
  revealedHands: Record<string, Card[]>;
  lastCardPlayed: Card;
}

export interface MatchStandings {
  playerId: string;
  name: string;
  totalScore: number;
  roundDeltas: number[];
  place: number;
  isLeader: boolean;
}
