import type { Action } from '../../engine/types';
import { SUIT_SYMBOLS, suitColor, rankLabel } from '../../theme';

interface EdOpponentProps {
  name: string;
  handCount: number;
  botDifficulty?: string | null;
  lastAction?: Action;
  isCurrent: boolean;
}

function actionText(action?: Action): string {
  if (!action) return '';
  switch (action.type) {
    case 'PlayCard': {
      const sym = SUIT_SYMBOLS[action.card.suit];
      return `Played ${rankLabel(action.card.rank)}${sym}`;
    }
    case 'OptionalPass': return 'Optional pass';
    case 'ForcedPass': return 'Forced pass';
    default: return '';
  }
}

function actionColor(action?: Action): string {
  if (!action) return 'var(--ink-50)';
  if (action.type === 'PlayCard') return suitColor(action.card.suit);
  if (action.type === 'ForcedPass') return 'var(--ink-50)';
  return 'var(--accent-gold)';
}

export function EdOpponent({ name, handCount, botDifficulty, lastAction, isCurrent }: EdOpponentProps) {
  return (
    <div style={{
      ...styles.tile,
      ...(isCurrent ? styles.currentTile : {}),
    }}>
      <div style={styles.top}>
        <span style={styles.name}>{name}</span>
        <span style={styles.handPill}>{handCount}</span>
      </div>
      {botDifficulty && (
        <div style={styles.botLabel}>{botDifficulty.toUpperCase()}</div>
      )}
      {lastAction && (
        <div style={{ ...styles.lastAction, color: actionColor(lastAction) }}>
          {actionText(lastAction)}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tile: {
    background: 'var(--paper-card)',
    border: '1px solid var(--ink-08)',
    borderRadius: '8px',
    padding: '12px 14px',
    boxShadow: 'var(--shadow-card)',
  },
  currentTile: {
    borderColor: 'var(--ink)',
    animation: 'edTurnGlow 8s ease-in-out infinite',
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--ink)',
  },
  handPill: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    background: 'var(--ink-08)',
    borderRadius: '999px',
    padding: '2px 8px',
    color: 'var(--ink)',
  },
  botLabel: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'var(--ink-50)',
    marginBottom: '2px',
  },
  lastAction: {
    fontSize: '12px',
    fontWeight: 500,
    marginTop: '2px',
  },
};
