import type { BotDifficulty } from '../../engine/types';

type SeatKind = 'human' | BotDifficulty;

interface SeatRowProps {
  index: number;
  name: string;
  kind: SeatKind;
  locked?: boolean;       // seat 1 in solo mode
  canRemove: boolean;
  onNameChange: (name: string) => void;
  onKindChange: (kind: SeatKind) => void;
  onRemove: () => void;
}

const KINDS: { value: SeatKind; label: string }[] = [
  { value: 'human', label: 'Human' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export function SeatRow({
  index, name, kind, locked, canRemove,
  onNameChange, onKindChange, onRemove,
}: SeatRowProps) {
  return (
    <div style={styles.row}>
      <div style={styles.chip}>{index + 1}</div>
      <input
        style={styles.nameInput}
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder={`Player ${index + 1}`}
      />
      <div style={styles.kindGroup}>
        {KINDS.map(k => {
          if (locked && k.value === 'human') {
            return (
              <span key={k.value} style={{ ...styles.kindBtn, ...styles.kindActive, cursor: 'default' }}>
                {k.label}
              </span>
            );
          }
          if (locked && k.value !== 'human') return null;
          return (
            <button
              key={k.value}
              type="button"
              style={{
                ...styles.kindBtn,
                ...(kind === k.value ? styles.kindActive : {}),
              }}
              onClick={() => onKindChange(k.value)}
            >
              {k.label}
            </button>
          );
        })}
      </div>
      {canRemove ? (
        <button type="button" style={styles.removeBtn} onClick={onRemove} aria-label="Remove seat">
          &times;
        </button>
      ) : (
        <div style={{ width: '28px' }} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid var(--ink-08)',
  },
  chip: {
    width: '28px',
    height: '28px',
    borderRadius: '999px',
    background: 'var(--ink)',
    color: 'var(--paper)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameInput: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid var(--ink-12)',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    background: 'var(--paper-card)',
    color: 'var(--ink)',
    outline: 'none',
    minWidth: 0,
  },
  kindGroup: {
    display: 'flex',
    gap: '2px',
    background: 'var(--ink-08)',
    borderRadius: '6px',
    padding: '2px',
    flexShrink: 0,
  },
  kindBtn: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    background: 'transparent',
    color: 'var(--ink-60)',
    cursor: 'pointer',
  },
  kindActive: {
    background: 'var(--paper-card)',
    color: 'var(--ink)',
    fontWeight: 600,
    boxShadow: 'var(--shadow-card)',
  },
  removeBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid var(--ink-12)',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--ink-50)',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
