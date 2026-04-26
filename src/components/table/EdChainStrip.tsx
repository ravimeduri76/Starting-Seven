import type { Chain, Suit, LeftoverCard } from '../../engine/types';
import { SUIT_SYMBOLS, SUIT_NAMES, suitColor, rankLabel } from '../../theme';

interface EdChainStripProps {
  suit: Suit;
  chain: Chain | null;
  leftovers: LeftoverCard[];
  ghostChain: boolean;
}

export function EdChainStrip({ suit, chain, leftovers, ghostChain }: EdChainStripProps) {
  const color = suitColor(suit);
  const suitLeftovers = new Set(
    leftovers.filter(l => l.card.suit === suit && !l.incorporated).map(l => l.card.rank)
  );

  return (
    <div style={styles.row}>
      <div style={styles.suitLabel}>
        <span style={{ color }}>{SUIT_SYMBOLS[suit]}</span>
        <span style={styles.suitName}>{SUIT_NAMES[suit]}</span>
      </div>
      <div style={styles.grid}>
        {Array.from({ length: 13 }, (_, i) => {
          const rank = i + 1;
          const inChain = chain && rank >= chain.low && rank <= chain.high;
          const isGhost = !inChain && ghostChain && suitLeftovers.has(rank);
          const isSeven = rank === 7;

          return (
            <div
              key={rank}
              style={{
                ...styles.cell,
                ...(isSeven ? styles.sevenCell : {}),
                ...(inChain ? styles.filledCell : {}),
                ...(isGhost ? styles.ghostCell : {}),
              }}
            >
              {(inChain || isGhost) && (
                <span style={{
                  ...styles.rankText,
                  color: inChain ? color : 'var(--ink-12)',
                  fontWeight: inChain ? 600 : 400,
                }}>
                  {rankLabel(rank)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div style={styles.range}>
        {chain ? `${rankLabel(chain.low)}\u2013${rankLabel(chain.high)}` : '\u2014'}
      </div>
    </div>
  );
}

export function ChainRankHeader() {
  return (
    <div style={styles.row}>
      <div style={styles.suitLabel} />
      <div style={styles.grid}>
        {Array.from({ length: 13 }, (_, i) => {
          const rank = i + 1;
          return (
            <div key={rank} style={{
              ...styles.headerCell,
              ...(rank === 7 ? styles.sevenHeader : {}),
            }}>
              {rankLabel(rank)}
            </div>
          );
        })}
      </div>
      <div style={styles.range} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr 48px',
    alignItems: 'center',
    gap: '8px',
    padding: '2px 0',
  },
  suitLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: 500,
  },
  suitName: {
    color: 'var(--ink-60)',
    fontSize: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(13, 1fr)',
    gap: '3px',
  },
  cell: {
    height: '32px',
    borderRadius: '4px',
    border: '1px solid var(--ink-08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
  },
  sevenCell: {
    borderColor: 'var(--ink-12)',
    borderWidth: '1.5px',
  },
  filledCell: {
    background: 'var(--paper-card)',
    borderColor: 'var(--ink-12)',
    boxShadow: 'var(--shadow-card)',
  },
  ghostCell: {
    background: 'transparent',
    borderStyle: 'dashed',
    borderColor: 'var(--ink-08)',
  },
  rankText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
  },
  range: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--ink-50)',
    textAlign: 'right' as const,
  },
  headerCell: {
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--ink-50)',
  },
  sevenHeader: {
    color: 'var(--ink)',
    fontWeight: 700,
    background: 'var(--ink-08)',
    borderRadius: '3px',
  },
};
