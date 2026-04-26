import type { Card } from '../../engine/types';
import { SUIT_COLORS, SUIT_SYMBOLS, rankLabel } from '../../theme';

interface EdCardProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  playable?: boolean;
  ghost?: boolean;
  dim?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
}

const DIMS = {
  sm: { w: 36, h: 52, rank: 17, suit: 10, pad: 5 },
  md: { w: 60, h: 88, rank: 30, suit: 13, pad: 7 },
  lg: { w: 76, h: 110, rank: 40, suit: 16, pad: 9 },
} as const;

export function EdCard({
  card,
  size = 'md',
  playable = false,
  ghost = false,
  dim = false,
  faceDown = false,
  onClick,
}: EdCardProps) {
  const d = DIMS[size];
  const color = SUIT_COLORS[card?.suit ?? 'S'];

  if (faceDown) {
    return (
      <div
        style={{
          width: d.w,
          height: d.h,
          borderRadius: 6,
          background: '#111',
          border: '1px solid #2a2a2a',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 4,
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 4,
          }}
        />
      </div>
    );
  }

  const sym = SUIT_SYMBOLS[card.suit];
  const clickable = playable && onClick;

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playable) e.currentTarget.style.transform = 'translateY(-12px)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playable) e.currentTarget.style.transform = 'translateY(-6px)';
  };

  const style: React.CSSProperties = {
    width: d.w,
    height: d.h,
    borderRadius: 6,
    background: ghost ? 'transparent' : '#fafaf7',
    border: ghost
      ? '1.5px dashed rgba(15,23,34,0.18)'
      : '1px solid rgba(15,23,34,0.1)',
    boxShadow: ghost
      ? 'none'
      : playable
        ? '0 18px 28px -10px rgba(15,23,34,0.22), 0 0 0 1.5px #0f1722'
        : '0 1px 2px rgba(15,23,34,0.06)',
    color: ghost ? 'rgba(15,23,34,0.3)' : color,
    padding: d.pad,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: clickable ? 'pointer' : 'default',
    transform: playable ? 'translateY(-6px)' : 'translateY(0)',
    transition: 'transform 200ms ease, box-shadow 200ms',
    opacity: dim ? 0.32 : 1,
    flexShrink: 0,
    userSelect: 'none',
  };

  return (
    <div
      onClick={clickable ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
      title={`${rankLabel(card.rank)}${sym}`}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1 }}>
        <div
          style={{
            fontSize: d.rank,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-display)',
            fontVariantNumeric: 'lining-nums',
          }}
        >
          {rankLabel(card.rank)}
        </div>
        <div style={{ fontSize: d.suit, opacity: ghost ? 0.6 : 1 }}>{sym}</div>
      </div>
      <div
        style={{
          fontSize: d.suit + 1,
          textAlign: 'right',
          opacity: ghost ? 0.5 : 0.55,
        }}
      >
        {sym}
      </div>
    </div>
  );
}
