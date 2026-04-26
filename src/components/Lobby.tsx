import { useState } from 'react';
import type { GameSettings, PlayerSetup, BotDifficulty, MatchConfig, GameMode } from '../engine/types';
import { Hero } from './lobby/Hero';
import { RulesStrip } from './lobby/RulesStrip';
import { SeatRow } from './lobby/SeatRow';
import { NumberField } from './lobby/NumberField';
import { VariantRow } from './lobby/VariantRow';

type SeatKind = 'human' | BotDifficulty;

interface SeatConfig {
  name: string;
  kind: SeatKind;
}

interface LobbyProps {
  settings: GameSettings;
  onSettingsChange: (s: GameSettings) => void;
  onStartMatch: (setups: PlayerSetup[], config: MatchConfig) => void;
}

const BOT_NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];

function loadPlayerName(): string {
  try { return localStorage.getItem('ss_player_name') || ''; } catch { return ''; }
}

function savePlayerName(name: string) {
  try { localStorage.setItem('ss_player_name', name); } catch {}
}

export function Lobby({ settings, onSettingsChange, onStartMatch }: LobbyProps) {
  const [view, setView] = useState<'default' | 'create'>('default');
  const [mode, setMode] = useState<GameMode>('solo');
  const [playerCount, setPlayerCount] = useState(4);
  const [totalRounds, setTotalRounds] = useState(3);
  const [targetScore, setTargetScore] = useState(75);
  const [seats, setSeats] = useState<SeatConfig[]>(() => initSeats('solo', 4));

  function initSeats(m: GameMode, count: number): SeatConfig[] {
    const result: SeatConfig[] = [];
    for (let i = 0; i < count; i++) {
      if (m === 'solo') {
        result.push(i === 0
          ? { name: loadPlayerName() || 'You', kind: 'human' }
          : { name: BOT_NAMES[i - 1] || `Bot ${i}`, kind: 'medium' }
        );
      } else {
        result.push({ name: i === 0 ? (loadPlayerName() || 'Player 1') : `Player ${i + 1}`, kind: 'human' });
      }
    }
    return result;
  }

  const selectMode = (m: GameMode) => {
    setMode(m);
    setSeats(initSeats(m, playerCount));
    setView('create');
  };

  const updatePlayerCount = (n: number) => {
    setPlayerCount(n);
    setSeats(prev => {
      const next = [...prev];
      while (next.length < n) {
        const idx = next.length;
        next.push(mode === 'solo'
          ? { name: BOT_NAMES[idx - 1] || `Bot ${idx}`, kind: 'medium' }
          : { name: `Player ${idx + 1}`, kind: 'human' }
        );
      }
      return next.slice(0, n);
    });
  };

  const handleStart = () => {
    // Save the human player name
    const humanSeat = seats.find(s => s.kind === 'human');
    if (humanSeat) savePlayerName(humanSeat.name);

    const setups: PlayerSetup[] = seats.map(s => ({
      name: s.name,
      isBot: s.kind !== 'human',
      botDifficulty: s.kind === 'human' ? null : s.kind,
    }));
    onStartMatch(setups, { mode, totalRounds, targetScore });
  };

  // ── Default view ────────────────────────────────────────

  if (view === 'default') {
    return (
      <div style={styles.page}>
        <div style={styles.inner}>
          <Hero
            headline="Build the chains."
            subhead="A parlour card game for clever hands. Open with sevens, extend by one, and be the first to go out."
          />
          <RulesStrip />
          <div style={styles.ctaRow}>
            <button style={styles.darkBtn} onClick={() => selectMode('solo')}>
              Play solo
            </button>
            <button style={styles.outlineBtn} onClick={() => selectMode('local')}>
              Play with friends
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Create view ─────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <Hero
          kicker={mode === 'solo' ? 'Solo match' : 'Local match'}
          headline="Set the table."
          subhead={mode === 'solo'
            ? 'Choose your opponents and match length.'
            : 'Add players, pass the device between turns.'}
        />

        {/* Player count */}
        <Section label="Players">
          <div style={styles.countRow}>
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                type="button"
                style={{
                  ...styles.countBtn,
                  ...(n === playerCount ? styles.countBtnActive : {}),
                }}
                onClick={() => updatePlayerCount(n)}
              >
                {n}
              </button>
            ))}
            {playerCount === 4 && <span style={styles.hint}>recommended</span>}
          </div>
        </Section>

        {/* Seats */}
        <Section label="Seats">
          {seats.map((seat, i) => (
            <SeatRow
              key={i}
              index={i}
              name={seat.name}
              kind={seat.kind}
              locked={mode === 'solo' && i === 0}
              canRemove={i > 0 && playerCount > 2}
              onNameChange={name => {
                const next = [...seats];
                next[i] = { ...next[i], name };
                setSeats(next);
              }}
              onKindChange={kind => {
                const next = [...seats];
                next[i] = { ...next[i], kind };
                setSeats(next);
              }}
              onRemove={() => {
                const next = seats.filter((_, j) => j !== i);
                setSeats(next);
                setPlayerCount(next.length);
              }}
            />
          ))}
        </Section>

        {/* Match length */}
        <Section label="Match length">
          <div style={styles.matchLengthRow}>
            <NumberField
              label="Rounds"
              options={[1, 3, 5, 7, 10]}
              value={totalRounds}
              onChange={setTotalRounds}
            />
            <NumberField
              label="Target"
              options={[25, 50, 75, 100, 150]}
              value={targetScore}
              suffix="pts"
              onChange={setTargetScore}
            />
          </div>
        </Section>

        {/* Variants */}
        <Section label="Rule variants">
          <VariantRow
            label="Ghost chain"
            description="Show leftover cards at their eventual chain positions"
            checked={settings.ghostChain}
            recommended
            onChange={v => onSettingsChange({ ...settings, ghostChain: v })}
          />
          <VariantRow
            label="Pre-game swap"
            description="Each player swaps one card with their neighbor"
            checked={settings.preGameSwap}
            onChange={v => onSettingsChange({ ...settings, preGameSwap: v })}
          />
          <VariantRow
            label="Soft seven hold"
            description={`Hold a 7 for up to ${settings.softSevenHoldTurns} turns instead of mandatory play`}
            checked={settings.softSevenHold}
            onChange={v => onSettingsChange({ ...settings, softSevenHold: v })}
          />
        </Section>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.backLink} onClick={() => setView('default')}>
            &larr; Back to lobby
          </button>
          <button style={styles.darkBtn} onClick={handleStart}>
            Start match &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: '0 56px',
  },
  inner: {
    maxWidth: '640px',
    margin: '0 auto',
    paddingBottom: '48px',
  },
  ctaRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  darkBtn: {
    padding: '14px 32px',
    background: 'var(--ink)',
    color: 'var(--paper)',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  outlineBtn: {
    padding: '14px 32px',
    background: 'var(--paper-card)',
    color: 'var(--ink)',
    border: '1.5px solid var(--ink-12)',
    borderRadius: '8px',
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  section: {
    marginBottom: '28px',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-50)',
    marginBottom: '12px',
  },
  countRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  countBtn: {
    width: '44px',
    height: '40px',
    border: '1.5px solid var(--ink-12)',
    borderRadius: '6px',
    background: 'var(--paper-card)',
    fontFamily: 'var(--font-mono)',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--ink-60)',
    cursor: 'pointer',
  },
  countBtnActive: {
    borderColor: 'var(--ink)',
    background: 'var(--ink)',
    color: 'var(--paper)',
  },
  hint: {
    fontSize: '11px',
    color: 'var(--ink-50)',
    fontStyle: 'italic',
    marginLeft: '8px',
  },
  matchLengthRow: {
    display: 'flex',
    gap: '12px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '32px',
    borderTop: '1px solid var(--ink-12)',
    marginTop: '12px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    fontFamily: 'var(--font-display)',
    fontSize: '15px',
    fontStyle: 'italic',
    color: 'var(--ink-60)',
    cursor: 'pointer',
    padding: '8px 0',
  },
};
