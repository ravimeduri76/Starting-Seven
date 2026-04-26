import type { MatchStandings, MatchConfig } from '../../engine/types';
import { S7Mark } from '../brand/S7Mark';

interface MastheadProps {
  standings: MatchStandings[];
  matchConfig: MatchConfig;
  roundNumber: number;
  turnNumber: number;
}

export function Masthead({ standings, matchConfig, roundNumber, turnNumber }: MastheadProps) {
  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <S7Mark size={28} />
        <span style={styles.title}>Starting Seven</span>
        <span style={styles.kicker}>
          Round {roundNumber} of {matchConfig.totalRounds} &middot; Turn {turnNumber}
        </span>
      </div>
      <div style={styles.right}>
        <div style={styles.scoreLabel}>SCOREBOARD</div>
        <table style={styles.table}>
          <tbody>
            {standings.map(s => (
              <tr key={s.playerId}>
                <td style={styles.nameCell}>
                  {s.isLeader && <span style={styles.leaderDot} />}
                  {s.name}
                </td>
                <td style={styles.deltaCell}>
                  {s.roundDeltas.length > 0 ? `+${s.roundDeltas[s.roundDeltas.length - 1]}` : ''}
                </td>
                <td style={styles.totalCell}>{s.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '2px solid var(--ink)',
    marginBottom: '12px',
    position: 'sticky' as const,
    top: 0,
    background: 'var(--paper)',
    zIndex: 10,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: 500,
    color: 'var(--ink)',
  },
  kicker: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: 'var(--ink-50)',
    textTransform: 'uppercase' as const,
    marginLeft: '4px',
  },
  right: {},
  scoreLabel: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'var(--ink-50)',
    marginBottom: '4px',
    textAlign: 'right' as const,
  },
  table: {
    borderCollapse: 'collapse' as const,
    fontSize: '12px',
  },
  nameCell: {
    padding: '2px 12px 2px 0',
    fontWeight: 500,
    color: 'var(--ink)',
    whiteSpace: 'nowrap' as const,
  },
  deltaCell: {
    padding: '2px 8px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--ink-50)',
    textAlign: 'right' as const,
  },
  totalCell: {
    padding: '2px 0 2px 8px',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--ink)',
    textAlign: 'right' as const,
  },
  leaderDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    marginRight: '4px',
  },
};
