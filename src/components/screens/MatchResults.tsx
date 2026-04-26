import type { MatchStandings, RoundResult, MatchConfig } from '../../engine/types';
import { Sparkline } from '../charts/Sparkline';

interface MatchResultsProps {
  standings: MatchStandings[];
  roundResults: RoundResult[];
  matchConfig: MatchConfig;
  onRematch: () => void;
  onBackToLobby: () => void;
}

export function MatchResults({ standings, roundResults, onRematch, onBackToLobby }: MatchResultsProps) {
  const winner = standings[0];

  return (
    <div style={styles.shell}>
      <div style={styles.inner}>
        {/* Masthead */}
        <div style={styles.masthead}>
          <span style={styles.mastheadLeft}>THE MATCH</span>
          <span style={styles.mastheadRight}>{roundResults.length} rounds played</span>
        </div>

        {/* Winner block */}
        <div style={styles.winnerBlock}>
          <div style={styles.winnerKicker}>Winner</div>
          <h1 style={styles.winnerName}>{winner?.name}.</h1>
        </div>

        {/* Final standings */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>FINAL STANDINGS</div>
          {standings.map((s, i) => {
            const isWinner = i === 0;
            return (
              <div key={s.playerId} style={{
                ...styles.standingRow,
                ...(isWinner ? styles.winnerStandingRow : {}),
              }}>
                <div style={{
                  ...styles.place,
                  ...(isWinner ? { color: 'var(--paper)', fontSize: '32px' } : {}),
                }}>
                  {s.place}
                </div>
                <div style={{
                  ...styles.name,
                  ...(isWinner ? { color: 'var(--paper)', fontSize: '24px' } : {}),
                }}>
                  {s.name}
                </div>
                <div style={styles.sparkCell}>
                  <Sparkline
                    values={cumulativeScores(s.roundDeltas)}
                    dark={isWinner}
                    width={180}
                    height={36}
                  />
                </div>
                <div style={{
                  ...styles.total,
                  ...(isWinner ? { color: 'var(--paper)', fontSize: '36px' } : {}),
                }}>
                  {s.totalScore}
                </div>
              </div>
            );
          })}
        </div>

        {/* Round by round */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>ROUND BY ROUND</div>
          <div style={styles.rbrHeader}>
            <div style={styles.rbrPlayerCol}>Player</div>
            {roundResults.map((_, i) => (
              <div key={i} style={styles.rbrRoundCol}>R{i + 1}</div>
            ))}
            <div style={styles.rbrTotalCol}>Total</div>
          </div>
          {standings.map(s => {
            const worstRound = Math.max(...s.roundDeltas);
            return (
              <div key={s.playerId} style={styles.rbrRow}>
                <div style={styles.rbrPlayerCol}>{s.name}</div>
                {s.roundDeltas.map((d, i) => (
                  <div key={i} style={{
                    ...styles.rbrCell,
                    color: d === 0 ? 'var(--success)' : d === worstRound && d > 0 ? 'var(--danger)' : 'var(--ink)',
                  }}>
                    {d === 0 ? '\u2014' : d}
                  </div>
                ))}
                <div style={{ ...styles.rbrCell, fontWeight: 700 }}>{s.totalScore}</div>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div style={styles.ctaRow}>
          <button style={styles.darkBtn} onClick={onRematch}>
            Rematch &mdash; same table
          </button>
          <button style={styles.outlineBtn} onClick={onBackToLobby}>
            Back to lobby
          </button>
        </div>
      </div>
    </div>
  );
}

function cumulativeScores(deltas: number[]): number[] {
  const result: number[] = [];
  let sum = 0;
  for (const d of deltas) {
    sum += d;
    result.push(sum);
  }
  return result;
}

const styles: Record<string, React.CSSProperties> = {
  shell: { minHeight: '100vh', background: 'var(--paper)', padding: '0 56px' },
  inner: { maxWidth: '720px', margin: '0 auto', paddingBottom: '48px' },
  masthead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 0', borderBottom: '2px solid var(--ink)', marginBottom: '24px',
  },
  mastheadLeft: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.32em', color: 'var(--ink)' },
  mastheadRight: { fontFamily: 'var(--font-display)', fontSize: '14px', fontStyle: 'italic', color: 'var(--ink-60)' },
  winnerBlock: { marginBottom: '32px' },
  winnerKicker: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.32em',
    textTransform: 'uppercase' as const, color: 'var(--ink-50)', marginBottom: '8px',
  },
  winnerName: {
    fontFamily: 'var(--font-display)', fontSize: '72px', fontWeight: 400,
    letterSpacing: '-0.04em', color: 'var(--ink)', margin: 0, lineHeight: 1,
  },
  section: { marginBottom: '28px' },
  sectionLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em',
    color: 'var(--ink-50)', marginBottom: '12px',
  },
  standingRow: {
    display: 'grid', gridTemplateColumns: '48px 1fr 200px 80px',
    alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--ink-08)',
  },
  winnerStandingRow: {
    background: 'var(--ink)', borderRadius: '8px', borderBottom: 'none', marginBottom: '4px',
  },
  place: { fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500 },
  name: { fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500 },
  sparkCell: { display: 'flex', justifyContent: 'center' },
  total: { fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, textAlign: 'right' as const },
  rbrHeader: {
    display: 'grid', gridTemplateColumns: `120px repeat(${5}, 1fr) 80px`,
    padding: '6px 0', borderBottom: '1px solid var(--ink-12)',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--ink-50)',
  },
  rbrRow: {
    display: 'grid', gridTemplateColumns: `120px repeat(${5}, 1fr) 80px`,
    padding: '8px 0', borderBottom: '1px solid var(--ink-08)',
  },
  rbrPlayerCol: { fontSize: '13px', fontWeight: 500 },
  rbrRoundCol: { textAlign: 'center' as const, fontSize: '10px' },
  rbrTotalCol: { textAlign: 'right' as const, fontSize: '10px' },
  rbrCell: { fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'center' as const },
  ctaRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '32px' },
  darkBtn: {
    padding: '14px', background: 'var(--ink)', color: 'var(--paper)', border: 'none',
    borderRadius: '8px', fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, cursor: 'pointer',
  },
  outlineBtn: {
    padding: '14px', background: 'var(--paper-card)', color: 'var(--ink)',
    border: '1.5px solid var(--ink-12)', borderRadius: '8px',
    fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 500, cursor: 'pointer',
  },
};
