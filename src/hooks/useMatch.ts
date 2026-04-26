import { useState, useCallback, useRef } from 'react';
import type {
  GameState, GameSettings, PlayerSetup, Action, GameEvent,
  ScoreEntry, MatchConfig, RoundResult, MatchStandings, Card,
} from '../engine/types';
import { DEFAULT_SETTINGS } from '../engine/types';
import { createGame, legalActions, applyAction, isRoundOver, score } from '../engine/engine';
import { chooseAction } from '../bots/bot';

// ── Screen types ────────────────────────────────────────────

export type Screen =
  | 'lobby'
  | 'table'
  | 'round-over'
  | 'round-results'
  | 'match-results'
  | 'pass-device';

// ── Pure functions (exported for testing) ───────────────────

export function computeStandings(
  roundResults: RoundResult[],
  players: PlayerSetup[],
): MatchStandings[] {
  const totals: Record<string, { name: string; total: number; deltas: number[] }> = {};
  for (let i = 0; i < players.length; i++) {
    totals[`p${i}`] = { name: players[i].name, total: 0, deltas: [] };
  }
  for (const rr of roundResults) {
    for (const s of rr.scores) {
      if (totals[s.playerId]) {
        totals[s.playerId].total += s.score;
        totals[s.playerId].deltas.push(s.score);
      }
    }
  }

  const entries = Object.entries(totals)
    .map(([id, t]) => ({ playerId: id, ...t }))
    .sort((a, b) => a.total - b.total);

  const leader = entries[0]?.total ?? 0;

  return entries.map((e, i) => ({
    playerId: e.playerId,
    name: e.name,
    totalScore: e.total,
    roundDeltas: e.deltas,
    place: i + 1,
    isLeader: e.total === leader && roundResults.length > 0,
  }));
}

export function isMatchOver(
  roundResults: RoundResult[],
  config: MatchConfig,
): boolean {
  if (roundResults.length >= config.totalRounds) return true;
  // Check if any player exceeded target score
  const totals: Record<string, number> = {};
  for (const rr of roundResults) {
    for (const s of rr.scores) {
      totals[s.playerId] = (totals[s.playerId] ?? 0) + s.score;
    }
  }
  return Object.values(totals).some(t => t >= config.targetScore);
}

export function deriveLastActions(
  turnLog: { playerId: string; action: Action }[],
): Record<string, Action> {
  const result: Record<string, Action> = {};
  for (const entry of turnLog) {
    result[entry.playerId] = entry.action;
  }
  return result;
}

export function captureRoundResult(
  state: GameState,
  roundNumber: number,
): RoundResult {
  const scores_ = score(state);
  const revealedHands: Record<string, Card[]> = {};
  for (const p of state.players) {
    revealedHands[p.id] = [...p.hand];
  }

  // Find the last card played (winner's last play)
  let lastCardPlayed: Card = { rank: 7, suit: 'S' };
  for (let i = state.turnLog.length - 1; i >= 0; i--) {
    const entry = state.turnLog[i];
    if (entry.action.type === 'PlayCard') {
      lastCardPlayed = entry.action.card;
      break;
    }
  }

  return {
    roundNumber,
    winnerId: state.winnerId!,
    scores: scores_,
    revealedHands,
    lastCardPlayed,
  };
}

// ── Hook ────────────────────────────────────────────────────

export interface MatchController {
  screen: Screen;
  state: GameState | null;
  settings: GameSettings;
  matchConfig: MatchConfig | null;
  roundResults: RoundResult[];
  standings: MatchStandings[];
  roundNumber: number;
  lastActions: Record<string, Action>;
  currentRoundResult: RoundResult | null;
  setSettings: (s: GameSettings) => void;
  startMatch: (setups: PlayerSetup[], config: MatchConfig) => void;
  performAction: (action: Action) => void;
  revealHand: () => void;
  advanceToRoundResults: () => void;
  dealNextRound: () => void;
  rematch: () => void;
  backToLobby: () => void;
}

export function useMatch(): MatchController {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [state, setState] = useState<GameState | null>(null);
  const [settings, setSettingsState] = useState<GameSettings>(loadSettings());
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);
  const [lastSetups, setLastSetups] = useState<PlayerSetup[]>([]);
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResult | null>(null);
  const dealerRef = useRef(0);
  const botTimeoutRef = useRef<number | null>(null);

  const standings = matchConfig && lastSetups.length > 0
    ? computeStandings(roundResults, lastSetups)
    : [];

  const lastActions = state ? deriveLastActions(state.turnLog) : {};

  const setSettings = useCallback((s: GameSettings) => {
    setSettingsState(s);
    try { localStorage.setItem('ss_settings', JSON.stringify(s)); } catch {}
  }, []);

  const clearBotTimeout = useCallback(() => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
  }, []);

  // ── Bot turn processing ─────────────────────────────────

  const processBotTurns = useCallback((currentState: GameState, config: MatchConfig) => {
    let s = currentState;

    const processNext = () => {
      if (isRoundOver(s)) {
        const rn = roundResults.length + 1; // will be set by caller
        const rr = captureRoundResult(s, rn);
        setCurrentRoundResult(rr);
        setState(s);
        setScreen('round-over');
        return;
      }

      const currentPlayer = s.players[s.currentSeat];
      if (!currentPlayer.isBot) {
        // Human's turn
        if (config.mode === 'local') {
          const humanCount = s.players.filter(p => !p.isBot).length;
          if (humanCount > 1) {
            setState(s);
            setScreen('pass-device');
            return;
          }
        }
        setState(s);
        setScreen('table');
        return;
      }

      // Bot turn
      const action = chooseAction(
        s, currentPlayer.id, currentPlayer.botDifficulty || 'easy',
      );
      const result = applyAction(s, action);
      s = result.state;
      setState(s);

      botTimeoutRef.current = window.setTimeout(processNext, 600);
    };

    botTimeoutRef.current = window.setTimeout(processNext, 400);
  }, [roundResults.length]);

  // ── Start a new round ───────────────────────────────────

  const startRound = useCallback((
    setups: PlayerSetup[],
    config: MatchConfig,
    currentSettings: GameSettings,
    dealer: number,
    existingResults: RoundResult[],
  ) => {
    clearBotTimeout();
    const newState = createGame(currentSettings, setups, dealer);
    setState(newState);
    setCurrentRoundResult(null);

    const starter = newState.players[newState.currentSeat];
    if (starter.isBot) {
      setScreen('table');
      // Need to process bot turns with the right round count context
      let s = newState;
      const processNext = () => {
        if (isRoundOver(s)) {
          const rn = existingResults.length + 1;
          const rr = captureRoundResult(s, rn);
          setCurrentRoundResult(rr);
          setState(s);
          setScreen('round-over');
          return;
        }
        const cp = s.players[s.currentSeat];
        if (!cp.isBot) {
          if (config.mode === 'local' && s.players.filter(p => !p.isBot).length > 1) {
            setState(s);
            setScreen('pass-device');
            return;
          }
          setState(s);
          setScreen('table');
          return;
        }
        const action = chooseAction(s, cp.id, cp.botDifficulty || 'easy');
        const result = applyAction(s, action);
        s = result.state;
        setState(s);
        botTimeoutRef.current = window.setTimeout(processNext, 600);
      };
      botTimeoutRef.current = window.setTimeout(processNext, 400);
    } else {
      if (config.mode === 'local' && setups.filter(s => !s.isBot).length > 1) {
        setScreen('pass-device');
      } else {
        setScreen('table');
      }
    }
  }, [clearBotTimeout]);

  // ── Public API ──────────────────────────────────────────

  const startMatch = useCallback((setups: PlayerSetup[], config: MatchConfig) => {
    clearBotTimeout();
    setLastSetups(setups);
    setMatchConfig(config);
    setRoundResults([]);
    setRoundNumber(1);
    dealerRef.current = 0;
    startRound(setups, config, settings, 0, []);
  }, [settings, clearBotTimeout, startRound]);

  const performAction = useCallback((action: Action) => {
    if (!state || !matchConfig) return;
    const result = applyAction(state, action);
    setState(result.state);

    if (isRoundOver(result.state)) {
      const rr = captureRoundResult(result.state, roundNumber);
      setCurrentRoundResult(rr);
      setScreen('round-over');
      return;
    }

    // Process bot turns after human plays
    let s = result.state;
    const processNext = () => {
      if (isRoundOver(s)) {
        const rr = captureRoundResult(s, roundNumber);
        setCurrentRoundResult(rr);
        setState(s);
        setScreen('round-over');
        return;
      }
      const cp = s.players[s.currentSeat];
      if (!cp.isBot) {
        if (matchConfig.mode === 'local' && s.players.filter(p => !p.isBot).length > 1) {
          setState(s);
          setScreen('pass-device');
          return;
        }
        setState(s);
        setScreen('table');
        return;
      }
      const act = chooseAction(s, cp.id, cp.botDifficulty || 'easy');
      const res = applyAction(s, act);
      s = res.state;
      setState(s);
      botTimeoutRef.current = window.setTimeout(processNext, 600);
    };
    botTimeoutRef.current = window.setTimeout(processNext, 400);
  }, [state, matchConfig, roundNumber]);

  const revealHand = useCallback(() => {
    setScreen('table');
  }, []);

  const advanceToRoundResults = useCallback(() => {
    if (!currentRoundResult) return;
    const updated = [...roundResults, currentRoundResult];
    setRoundResults(updated);
    setScreen('round-results');
  }, [currentRoundResult, roundResults]);

  const dealNextRound = useCallback(() => {
    if (!matchConfig || lastSetups.length === 0) return;
    const updatedResults = [...roundResults];
    if (currentRoundResult && !updatedResults.includes(currentRoundResult)) {
      updatedResults.push(currentRoundResult);
      setRoundResults(updatedResults);
    }

    if (isMatchOver(updatedResults, matchConfig)) {
      setScreen('match-results');
      return;
    }

    const numPlayers = lastSetups.length;
    const newDealer = ((dealerRef.current - 1) % numPlayers + numPlayers) % numPlayers;
    dealerRef.current = newDealer;
    const nextRound = updatedResults.length + 1;
    setRoundNumber(nextRound);
    startRound(lastSetups, matchConfig, settings, newDealer, updatedResults);
  }, [matchConfig, lastSetups, roundResults, currentRoundResult, settings, startRound]);

  const rematch = useCallback(() => {
    if (!matchConfig || lastSetups.length === 0) return;
    startMatch(lastSetups, matchConfig);
  }, [matchConfig, lastSetups, startMatch]);

  const backToLobby = useCallback(() => {
    clearBotTimeout();
    setScreen('lobby');
    setState(null);
    setMatchConfig(null);
    setRoundResults([]);
    setRoundNumber(0);
    setCurrentRoundResult(null);
  }, [clearBotTimeout]);

  return {
    screen, state, settings, matchConfig, roundResults, standings,
    roundNumber, lastActions, currentRoundResult,
    setSettings, startMatch, performAction, revealHand,
    advanceToRoundResults, dealNextRound, rematch, backToLobby,
  };
}

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem('ss_settings');
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}
