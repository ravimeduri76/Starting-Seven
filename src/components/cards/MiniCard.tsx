import type { Card } from '../../engine/types';
import { SUIT_COLORS, SUIT_SYMBOLS, rankLabel } from '../../theme';

interface MiniCardProps {
  card: Card;
}

export function MiniCard({ card }: MiniCardProps) {
  const color = SUIT_COLORS[card.suit];
  const sym = SUIT_SYMBOLS[card.suit];

  const style: React.CSSProperties = {
    width: 30,
    height: 44,
    borderRadius: 4,
    background: '#fafaf7',
    border: '1px solid rgba(15,23,34,0.1)',
    boxShadow: '0 1px 2px rgba(15,23,34,0.06)',
    color,
    padding: 3,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexShrink: 0,
    userSelect: 'none',
  };

  return (
    <div style={style} title={`${rankLabel(card.rank)}${sym}`}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '-0.04em',
          fontFamily: 'var(--font-display)',
          fontVariantNumeric: 'lining-nums',
          lineHeight: 1,
        }}
      >
        {rankLabel(card.rank)}
      </div>
      <div style={{ fontSize: 8, textAlign: 'right', opacity: 0.55 }}>{sym}</div>
    </div>
  );
}
