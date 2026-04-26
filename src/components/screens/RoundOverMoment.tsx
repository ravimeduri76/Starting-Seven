import type { Card } from '../../engine/types';
import { EdCard } from '../cards/EdCard';

interface RoundOverMomentProps {
  roundNumber: number;
  totalRounds: number;
  winnerName: string;
  lastCard: Card;
  onContinue: () => void;
}

export function RoundOverMoment({ roundNumber, totalRounds, winnerName, lastCard, onContinue }: RoundOverMomentProps) {
  return (
    <div style={styles.shell}>
      <div style={styles.content}>
        <div style={styles.cardWrapper}>
          <div style={styles.halo} />
          <EdCard card={lastCard} size="lg" />
        </div>
        <div style={styles.kicker}>Round {roundNumber} of {totalRounds} &middot; the last card</div>
        <h1 style={styles.headline}>
          <span style={styles.gold}>{winnerName}</span> emptied their hand.
        </h1>
        <p style={styles.subhead}>Time to tally the damage.</p>
        <button style={styles.cta} onClick={onContinue} autoFocus>
          Tally the round &rarr;
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    background: '#0f1722',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '440px',
  },
  cardWrapper: {
    position: 'relative' as const,
    display: 'inline-block',
    marginBottom: '24px',
  },
  halo: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,196,81,0.18) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  kicker: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.32em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: '12px',
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontSize: '48px',
    fontWeight: 400,
    letterSpacing: '-0.025em',
    color: 'rgba(255,255,255,0.9)',
    margin: '0 0 8px',
    lineHeight: 1.1,
  },
  gold: {
    color: 'var(--accent-gold)',
  },
  subhead: {
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.45)',
    margin: '0 0 32px',
  },
  cta: {
    padding: '14px 28px',
    background: 'var(--paper)',
    color: 'var(--ink)',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
