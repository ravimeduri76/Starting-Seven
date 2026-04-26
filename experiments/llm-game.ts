/**
 * LLM Bot Experiment — Starting Seven
 *
 * Runs 2 games: Claude vs ChatGPT vs Gemini vs Hard-bot baseline.
 * Captures full game logs, reasoning, and a comparison report.
 *
 * Usage:
 *   npx tsx experiments/llm-game.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load env from multiple sources
dotenv.config({ path: 'C:/Users/Ravi/Data_Analysis/.env' });
dotenv.config({ path: 'C:/Users/Ravi/concept_bridge/.env' });

// ── Engine imports ──────────────────────────────────────────

import {
  createGame, legalActions, applyAction, isRoundOver, score,
} from '../src/engine/engine';
import {
  DEFAULT_SETTINGS, SUITS,
  type GameState, type Action, type Card, type Suit, type PlayerSetup,
  type ScoreEntry,
} from '../src/engine/types';
import { chooseAction } from '../src/bots/bot';

// ── LLM clients ─────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.LLM_API_KEY });
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Card formatting ─────────────────────────────────────────

const RANK_LABELS: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const SUIT_NAMES: Record<Suit, string> = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
const rl = (r: number) => RANK_LABELS[r] ?? String(r);
const cardStr = (c: Card) => `${rl(c.rank)} of ${SUIT_NAMES[c.suit]}`;
const shortCard = (c: Card) => `${rl(c.rank)}${c.suit}`;

// ── Build prompt ────────────────────────────────────────────

function buildPrompt(state: GameState, playerId: string, actions: Action[]): string {
  const player = state.players.find(p => p.id === playerId)!;
  const hand = player.hand.map(cardStr).join(', ');

  const chainDesc = SUITS.map(suit => {
    const c = state.chains[suit];
    if (!c) return `${SUIT_NAMES[suit]}: not opened`;
    return `${SUIT_NAMES[suit]}: ${rl(c.low)} to ${rl(c.high)}`;
  }).join('\n');

  const opponents = state.players
    .filter(p => p.id !== playerId)
    .map(p => `${p.name}: ${p.hand.length} cards`)
    .join(', ');

  const legalMoves = actions.map((a, i) => {
    if (a.type === 'PlayCard') return `${i}: Play ${cardStr(a.card)}`;
    if (a.type === 'OptionalPass') return `${i}: Optional Pass (you must play next turn)`;
    if (a.type === 'ForcedPass') return `${i}: Forced Pass`;
    return `${i}: ${a.type}`;
  }).join('\n');

  return `You are playing a card game called "Starting Seven" (a Sevens variant).

RULES SUMMARY:
- Cards are played onto 4 suit chains that build outward from 7 (down to Ace, up to King).
- You play exactly one card per turn that is adjacent (+/- 1 rank) to either end of its suit chain.
- Playing a 7 opens that suit's chain.
- You can pass optionally (but must play the next turn), or are forced to pass if no card is playable.
- Goal: empty your hand first. Losers score the sum of remaining card values (A=1, K=13).
- Strategy: dump high-value cards early, block opponents by holding cards they need, open suits strategically.

CURRENT STATE:
Your hand (${player.hand.length} cards): ${hand}
Chains:
${chainDesc}
Opponents: ${opponents}

LEGAL MOVES:
${legalMoves}

Pick the move number that gives you the best chance of emptying your hand first while leaving opponents with high-value cards. Think briefly about which move is strategically best, then respond with EXACTLY this format on the last line:
MOVE: <number>`;
}

// ── LLM move selection ──────────────────────────────────────

function parseMove(text: string, maxIdx: number): number | null {
  const match = text.match(/MOVE:\s*(\d+)/i);
  if (match) {
    const idx = parseInt(match[1], 10);
    if (idx >= 0 && idx <= maxIdx) return idx;
  }
  const nums = text.match(/\b(\d+)\b/g);
  if (nums) {
    for (const n of nums.reverse()) {
      const idx = parseInt(n, 10);
      if (idx >= 0 && idx <= maxIdx) return idx;
    }
  }
  return null;
}

async function claudeChoose(state: GameState, playerId: string, actions: Action[]): Promise<{ action: Action; reasoning: string }> {
  const prompt = buildPrompt(state, playerId, actions);
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const idx = parseMove(text, actions.length - 1);
    if (idx !== null) return { action: actions[idx], reasoning: text };
    return { action: actions[0], reasoning: `[PARSE FAIL] ${text}` };
  } catch (e: any) {
    return { action: actions[0], reasoning: `[API ERROR] ${e.message}` };
  }
}

async function chatgptChoose(state: GameState, playerId: string, actions: Action[]): Promise<{ action: Action; reasoning: string }> {
  const prompt = buildPrompt(state, playerId, actions);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.choices[0]?.message?.content ?? '';
    const idx = parseMove(text, actions.length - 1);
    if (idx !== null) return { action: actions[idx], reasoning: text };
    return { action: actions[0], reasoning: `[PARSE FAIL] ${text}` };
  } catch (e: any) {
    return { action: actions[0], reasoning: `[API ERROR] ${e.message}` };
  }
}

async function geminiChoose(state: GameState, playerId: string, actions: Action[]): Promise<{ action: Action; reasoning: string }> {
  const prompt = buildPrompt(state, playerId, actions);
  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const idx = parseMove(text, actions.length - 1);
    if (idx !== null) return { action: actions[idx], reasoning: text };
    return { action: actions[0], reasoning: `[PARSE FAIL] ${text}` };
  } catch (e: any) {
    return { action: actions[0], reasoning: `[API ERROR] ${e.message}` };
  }
}

// ── Types ───────────────────────────────────────────────────

type LLMProvider = 'claude' | 'chatgpt' | 'gemini' | 'hard-bot';

interface PlayerConfig {
  name: string;
  provider: LLMProvider;
}

interface TurnDetail {
  turn: number;
  playerName: string;
  provider: LLMProvider;
  action: string;
  reasoning: string;
  cardsLeft: number;
  chains: string;
  cascaded: string;
}

interface GameResult {
  gameNumber: number;
  seed: number;
  totalTurns: number;
  winner: string;
  winnerProvider: LLMProvider;
  scores: ScoreEntry[];
  turns: TurnDetail[];
  playerStats: Record<string, {
    plays: number;
    optionalPasses: number;
    forcedPasses: number;
    parseFails: number;
    apiErrors: number;
  }>;
}

// ── Game runner ─────────────────────────────────────────────

async function runLLMGame(gameNum: number, seed: number, configs: PlayerConfig[]): Promise<GameResult> {
  const setups: PlayerSetup[] = configs.map(c => ({
    name: c.name,
    isBot: true,
    botDifficulty: 'hard',
  }));

  let state = createGame(DEFAULT_SETTINGS, setups, 0, seed);
  const turns: TurnDetail[] = [];
  const stats: GameResult['playerStats'] = {};
  for (const c of configs) {
    stats[c.name] = { plays: 0, optionalPasses: 0, forcedPasses: 0, parseFails: 0, apiErrors: 0 };
  }

  const configMap = new Map(configs.map((c, i) => [`p${i}`, c]));
  let turnNum = 0;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  GAME ${gameNum} (seed ${seed})`);
  console.log(`${'='.repeat(50)}`);

  while (!isRoundOver(state) && turnNum < 300) {
    const player = state.players[state.currentSeat];
    const config = configMap.get(player.id)!;
    const actions = legalActions(state, player.id);

    if (actions.length === 0) break;

    let chosenAction: Action;
    let reasoning = '';

    if (actions.length === 1) {
      chosenAction = actions[0];
      reasoning = '(only legal move)';
    } else if (config.provider === 'hard-bot') {
      chosenAction = chooseAction(state, player.id, 'hard', seed * 1000 + turnNum);
      reasoning = '(hard bot heuristic)';
    } else if (config.provider === 'claude') {
      const result = await claudeChoose(state, player.id, actions);
      chosenAction = result.action;
      reasoning = result.reasoning;
      if (reasoning.startsWith('[PARSE FAIL]')) stats[config.name].parseFails++;
      if (reasoning.startsWith('[API ERROR]')) stats[config.name].apiErrors++;
    } else if (config.provider === 'chatgpt') {
      const result = await chatgptChoose(state, player.id, actions);
      chosenAction = result.action;
      reasoning = result.reasoning;
      if (reasoning.startsWith('[PARSE FAIL]')) stats[config.name].parseFails++;
      if (reasoning.startsWith('[API ERROR]')) stats[config.name].apiErrors++;
    } else {
      // gemini
      const result = await geminiChoose(state, player.id, actions);
      chosenAction = result.action;
      reasoning = result.reasoning;
      if (reasoning.startsWith('[PARSE FAIL]')) stats[config.name].parseFails++;
      if (reasoning.startsWith('[API ERROR]')) stats[config.name].apiErrors++;
    }

    const result = applyAction(state, chosenAction);
    state = result.state;
    turnNum++;

    if (chosenAction.type === 'PlayCard') stats[config.name].plays++;
    else if (chosenAction.type === 'OptionalPass') stats[config.name].optionalPasses++;
    else if (chosenAction.type === 'ForcedPass') stats[config.name].forcedPasses++;

    const actionStr = chosenAction.type === 'PlayCard'
      ? `played ${shortCard(chosenAction.card)}`
      : chosenAction.type;

    const cascaded = result.events
      .filter(e => e.type === 'LeftoverIncorporated')
      .map(e => shortCard((e as any).card))
      .join(', ');

    const logEntry = state.turnLog[state.turnLog.length - 1];

    turns.push({
      turn: turnNum,
      playerName: config.name,
      provider: config.provider,
      action: actionStr,
      reasoning: reasoning.length > 300 ? reasoning.slice(0, 300) + '...' : reasoning,
      cardsLeft: logEntry?.cardsLeftAfter ?? player.hand.length,
      chains: logEntry?.chainsSnapshot ?? '',
      cascaded,
    });

    const cardsLeft = state.players.map(p => `${p.name}:${p.hand.length}`).join(' ');
    console.log(`  T${String(turnNum).padStart(2)} ${config.name.padEnd(8)} ${actionStr.padEnd(16)} [${cardsLeft}]`);
  }

  const scores_ = score(state);
  const winner = state.players.find(p => p.id === state.winnerId)!;
  const winnerConfig = configMap.get(winner.id)!;

  console.log(`\n  WINNER: ${winner.name} (${winnerConfig.provider})`);
  for (const s of scores_.sort((a, b) => a.score - b.score)) {
    console.log(`    ${s.name.padEnd(8)}: score=${String(s.score).padStart(3)} (${s.cardsLeft} cards left)`);
  }

  return {
    gameNumber: gameNum,
    seed,
    totalTurns: turnNum,
    winner: winner.name,
    winnerProvider: winnerConfig.provider,
    scores: scores_,
    turns,
    playerStats: stats,
  };
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  const configs: PlayerConfig[] = [
    { name: 'Claude',  provider: 'claude' },
    { name: 'ChatGPT', provider: 'chatgpt' },
    { name: 'Gemini',  provider: 'gemini' },
    { name: 'HardBot', provider: 'hard-bot' },
  ];

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Starting Seven — LLM Bot Experiment     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\nPlayers: ${configs.map(c => `${c.name} (${c.provider})`).join(', ')}`);
  console.log('Games: 2\n');

  // Verify keys
  if (!process.env.ANTHROPIC_API_KEY) console.warn('WARNING: ANTHROPIC_API_KEY not set');
  if (!process.env.LLM_API_KEY) console.warn('WARNING: LLM_API_KEY (OpenAI) not set');
  if (!process.env.GEMINI_API_KEY) console.warn('WARNING: GEMINI_API_KEY not set');

  const results: GameResult[] = [];

  for (let i = 1; i <= 2; i++) {
    const seed = 100 + i;
    const result = await runLLMGame(i, seed, configs);
    results.push(result);
  }

  // ── Summary ───────────────────────────────────────────

  console.log('\n\n╔══════════════════════════════════════════╗');
  console.log('║         EXPERIMENT SUMMARY                ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const wins: Record<string, number> = {};
  const totalScores: Record<string, number> = {};
  for (const c of configs) { wins[c.name] = 0; totalScores[c.name] = 0; }
  for (const r of results) {
    wins[r.winner]++;
    for (const s of r.scores) totalScores[s.name] = (totalScores[s.name] || 0) + s.score;
  }

  console.log('Player Results (lower score = better):');
  for (const c of configs) {
    const avg = (totalScores[c.name] / results.length).toFixed(1);
    console.log(`  ${c.name.padEnd(8)} (${c.provider.padEnd(8)}): ${wins[c.name]} wins, total=${totalScores[c.name]}, avg=${avg}`);
  }

  console.log('\nLLM Reliability:');
  let anyIssues = false;
  for (const r of results) {
    for (const [name, s] of Object.entries(r.playerStats)) {
      if (s.parseFails > 0 || s.apiErrors > 0) {
        console.log(`  Game ${r.gameNumber} ${name}: ${s.parseFails} parse fails, ${s.apiErrors} API errors`);
        anyIssues = true;
      }
    }
  }
  if (!anyIssues) console.log('  All LLMs produced valid moves on every turn.');

  for (const r of results) {
    console.log(`\nGame ${r.gameNumber} (seed ${r.seed}): ${r.totalTurns} turns`);
    console.log(`  Winner: ${r.winner} (${r.winnerProvider})`);
    for (const s of r.scores.sort((a, b) => a.score - b.score)) {
      const ps = r.playerStats[s.name];
      console.log(`  ${s.name.padEnd(8)}: score=${String(s.score).padStart(3)}  plays=${ps.plays} opt-pass=${ps.optionalPasses} forced-pass=${ps.forcedPasses}`);
    }
  }

  // Save outputs
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');

  const jsonPath = path.join(outDir, `llm-results-${ts}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results: ${jsonPath}`);

  const mdPath = path.join(outDir, `llm-results-${ts}.md`);
  fs.writeFileSync(mdPath, generateMarkdownReport(results, configs));
  console.log(`Markdown report: ${mdPath}`);
}

function generateMarkdownReport(results: GameResult[], configs: PlayerConfig[]): string {
  const lines: string[] = [];
  lines.push('# Starting Seven — LLM Bot Experiment\n');
  lines.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`**Players:** ${configs.map(c => `${c.name} (${c.provider})`).join(', ')}`);
  lines.push(`**Games:** ${results.length}\n`);

  lines.push('## Results Summary\n');
  lines.push('| Player | Provider | Wins | Total Score | Avg Score |');
  lines.push('|--------|----------|------|-------------|-----------|');
  for (const c of configs) {
    let w = 0, total = 0;
    for (const r of results) {
      if (r.winner === c.name) w++;
      const s = r.scores.find(s => s.name === c.name);
      if (s) total += s.score;
    }
    lines.push(`| ${c.name} | ${c.provider} | ${w} | ${total} | ${(total / results.length).toFixed(1)} |`);
  }

  for (const r of results) {
    lines.push(`\n## Game ${r.gameNumber} (seed ${r.seed})\n`);
    lines.push(`**Winner:** ${r.winner} (${r.winnerProvider}) in ${r.totalTurns} turns\n`);

    lines.push('### Scores\n');
    lines.push('| Player | Score | Cards Left | Plays | Opt Pass | Forced Pass |');
    lines.push('|--------|-------|------------|-------|----------|-------------|');
    for (const s of r.scores.sort((a, b) => a.score - b.score)) {
      const ps = r.playerStats[s.name];
      lines.push(`| ${s.name} | ${s.score} | ${s.cardsLeft} | ${ps.plays} | ${ps.optionalPasses} | ${ps.forcedPasses} |`);
    }

    lines.push('\n### Turn-by-Turn Log\n');
    lines.push('<details><summary>Click to expand</summary>\n');
    lines.push('| # | Player | Action | Left | Chains | Reasoning |');
    lines.push('|---|--------|--------|------|--------|-----------|');
    for (const t of r.turns) {
      const reason = t.reasoning.replace(/\n/g, ' ').replace(/\|/g, '/').slice(0, 120);
      lines.push(`| ${t.turn} | ${t.playerName} | ${t.action}${t.cascaded ? ' +' + t.cascaded : ''} | ${t.cardsLeft} | \`${t.chains}\` | ${reason} |`);
    }
    lines.push('\n</details>');
  }

  return lines.join('\n');
}

main().catch(console.error);
