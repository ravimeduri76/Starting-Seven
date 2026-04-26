import type { RoundResult, MatchStandings, MatchConfig } from '../../engine/types';
import { rankLabel, SUIT_SYMBOLS, suitColor } from '../../theme';
import { RevealedHand } from '../cards/RevealedHand';

interface RoundResultsProps {
  roundResult: RoundResult;
  standings: MatchStandings[];
  matchConfig: MatchConfig;
  isMatchOver: boolean;
  onDealNext: () => void;
}

export function RoundResults({ roundResult, standings, matchConfig, isMatchOver, onDealNext }: RoundResultsProps) {
  const winner = standings.find(s => s.playerId === roundResult.winnerId);
  const lc = roundResult.lastCardPlayed;
  const suitSym = SUIT_SYMBOLS[lc.suit];
  const sColor = suitColor(lc.suit);

  return (
    <div style={styles.shell}>
      <div style={styles.inner}>
        {/* Masthead rule */}
        <div style={styles.masthead}>
          <span style={styles.mastheadLeft}>ROUND RECAP</span>
          <span style={styles.mastheadRight}>Round {roundResult.roundNumber} of {matchConfig.totalRounds}</span>
        </div>

        {/* Headline */}
        <h1 style={styles.headline}>
          {winner?.name} closes Round {roundResult.roundNumber} with the {rankLabel(lc.rank)}<span style={{ color: sColor }}>{suitSym}</span>.
        </h1>

        {/* Round damage */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>ROUND DAMAGE</div>
          {roundResult.scores
            .sort((a, b) => a.score - b.score)
            .map(s => {
              const isWinner = s.playerId === roundResult.winnerId;
              const hand = roundResult.revealedHands[s.playerId] ?? [];
              return (
                <div key={s.playerId} style={{
                  ...styles.damageRow,
                  ...(isWinner ? styles.winnerRow : {}),
                }}>
                  <div style={styles.damageName}>
                    <span style={styles.playerName}>{s.name}</span>
                    {isWinner && <span style={styles.statusBadge}>WENT OUT</span>}
                  </div>
                  <div style={styles.damageCards}>
                    {isWinner ? (
                      <span style={{ fontSize: '13px', color: 'var(--success)' }}>—</span>
                    ) : (
                      <RevealedHand cards={hand} />
                    )}
                  </div>
                  <div style={{
                    ...styles.damageDelta,
                    color: isWinner ? 'var(--success)' : 'var(--ink)',
                  }}>
                    {isWinner ? '0' : `+${s.score}`}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Standings */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>STANDINGS AFTER ROUND {roundResult.roundNumber}</div>
          {standings.map(s => (
            <div key={s.playerId} style={styles.standingRow}>
              <div style={styles.place}>{s.place}</div>
              <div style={styles.standingName}>
                {s.name}
                {s.isLeader && <span style={styles.leaderBadge}>LEADING</span>}
              </div>
              <div style={styles.ptsAway}>
                {s.totalScore === 0 ? '—' : `${matchConfig.targetScore - s.totalScore} pts away`}
              </div>
              <div style={styles.totalScore}>{s.totalScore}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cta} onClick={onDealNext} autoFocus>
            {isMatchOver ? 'See final results \u2192' : `Deal Round ${roundResult.roundNumber + 1} \u2192`}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    background: 'var(--paper)',
    padding: '0 56px',
  },
  inner: {
    maxWidth: '720px',
    margin: '0 auto',
    paddingBottom: '48px',
  },
  masthead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '2px solid var(--ink)',
    marginBottom: '24px',
  },
  mastheadLeft: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.32em',
    color: 'var(--ink)',
  },
  mastheadRight: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'var(--ink-60)',
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontSize: '42px',
    fontWeight: 400,
    letterSpacing: '-0.02em',
    color: 'var(--ink)',
    margin: '0 0 32px',
    lineHeight: 1.15,
  },
  section: { marginBottom: '28px' },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'var(--ink-50)',
    marginBottom: '12px',
  },
  damageRow: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr 80px',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid var(--ink-08)',
    gap: '12px',
  },
  winnerRow: {
    background: 'var(--gold-04)',
  },
  damageName: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  playerName: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: 500,
  },
  statusBadge: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'var(--success)',
  },
  damageCards: {
    display: 'flex',
    alignItems: 'center',
  },
  damageDelta: {
    fontFamily: 'var(--font-mono)',
    fontSize: '18px',
    fontWeight: 700,
    textAlign: 'right' as const,
  },
  standingRow: {
    display: 'grid',
    gridTemplateColumns: '32px 1fr 120px 80px',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--ink-08)',
  },
  place: {
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: 500,
    color: 'var(--ink)',
  },
  standingName: {
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  leaderBadge: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'var(--accent-gold)',
    background: 'var(--gold-04)',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  ptsAway: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--ink-50)',
    textAlign: 'right' as const,
  },
  totalScore: {
    fontFamily: 'var(--font-mono)',
    fontSize: '22px',
    fontWeight: 700,
    textAlign: 'right' as const,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '24px',
    borderTop: '1px solid var(--ink-12)',
  },
  cta: {
    padding: '14px 28px',
    background: 'var(--ink)',
    color: 'var(--paper)',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
