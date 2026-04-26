import type { TurnLogEntry, Card, Suit } from '../engine/types';

const SUIT_SYMBOLS: Record<Suit, string> = {
  S: '\u2660', H: '\u2665', D: '\u2666', C: '\u2663',
};

const RANK_LABELS: Record<number, string> = {
  1: 'A', 11: 'J', 12: 'Q', 13: 'K',
};

function cardLabel(card: Card): string {
  const rank = RANK_LABELS[card.rank] ?? String(card.rank);
  return `${rank}${SUIT_SYMBOLS[card.suit]}`;
}

function actionText(entry: TurnLogEntry): string {
  const { action } = entry;
  switch (action.type) {
    case 'PlayCard':
      return `played ${cardLabel(action.card)}`;
    case 'OptionalPass':
      return 'optional pass';
    case 'ForcedPass':
      return 'forced pass (no playable cards)';
    case 'SwapSelect':
      return `swapped ${cardLabel(action.card)}`;
  }
}

interface GameLogProps {
  turnLog: TurnLogEntry[];
}

export function GameLog({ turnLog }: GameLogProps) {
  if (turnLog.length === 0) return null;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Game Log</h3>
      <div style={styles.logScroll}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thNarrow}>#</th>
              <th style={styles.th}>Player</th>
              <th style={styles.th}>Action</th>
              <th style={styles.thNarrow}>Left</th>
              <th style={styles.th}>Chains</th>
            </tr>
          </thead>
          <tbody>
            {turnLog.map((entry) => (
              <tr
                key={entry.turn}
                style={entry.cardsLeftAfter === 0 ? styles.winRow : undefined}
              >
                <td style={styles.tdNarrow}>{entry.turn}</td>
                <td style={styles.td}>{entry.playerName}</td>
                <td style={styles.td}>
                  <span style={actionStyle(entry)}>{actionText(entry)}</span>
                  {entry.cascaded.length > 0 && (
                    <span style={styles.cascade}>
                      {' '}+ cascade: {entry.cascaded.map(cardLabel).join(', ')}
                    </span>
                  )}
                </td>
                <td style={styles.tdNarrow}>{entry.cardsLeftAfter}</td>
                <td style={{ ...styles.td, ...styles.chains }}>{entry.chainsSnapshot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function actionStyle(entry: TurnLogEntry): React.CSSProperties {
  switch (entry.action.type) {
    case 'PlayCard':
      return { color: '#27ae60', fontWeight: 600 };
    case 'OptionalPass':
      return { color: '#e67e22', fontWeight: 600 };
    case 'ForcedPass':
      return { color: '#95a5a6' };
    default:
      return {};
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 24px',
    borderTop: '1px solid #eee',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  logScroll: {
    maxHeight: '300px',
    overflow: 'auto',
    border: '1px solid #eee',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  th: {
    padding: '6px 8px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#999',
    borderBottom: '1px solid #eee',
    position: 'sticky' as const,
    top: 0,
    background: 'white',
  },
  thNarrow: {
    padding: '6px 6px',
    textAlign: 'center',
    fontWeight: 600,
    color: '#999',
    borderBottom: '1px solid #eee',
    width: '36px',
    position: 'sticky' as const,
    top: 0,
    background: 'white',
  },
  td: {
    padding: '4px 8px',
    borderBottom: '1px solid #f8f8f8',
  },
  tdNarrow: {
    padding: '4px 6px',
    textAlign: 'center',
    borderBottom: '1px solid #f8f8f8',
    color: '#bbb',
  },
  winRow: {
    background: '#fffbf0',
  },
  cascade: {
    color: '#8e44ad',
    fontSize: '11px',
  },
  chains: {
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '11px',
    color: '#888',
  },
};
