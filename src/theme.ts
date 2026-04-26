import type { Suit } from './engine/types';

export const SUIT_SYMBOLS: Record<Suit, string> = {
  S: '\u2660', // ♠
  H: '\u2665', // ♥
  D: '\u2666', // ♦
  C: '\u2663', // ♣
};

export const SUIT_NAMES: Record<Suit, string> = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
};

export const SUIT_COLORS: Record<Suit, string> = {
  S: '#0f1722',
  H: '#a8201a',
  D: '#e8722c',
  C: '#15803d',
};

export const RANK_LABELS: Record<number, string> = {
  1: 'A', 11: 'J', 12: 'Q', 13: 'K',
};

export function rankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank);
}

export function suitColor(suit: Suit): string {
  return SUIT_COLORS[suit];
}

export function cardLabel(rank: number, suit: Suit): string {
  return `${rankLabel(rank)}${SUIT_SYMBOLS[suit]}`;
}
