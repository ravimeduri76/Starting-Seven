import type { Card } from '../../engine/types';
import { cardKey } from '../../engine/types';
import { MiniCard } from './MiniCard';

interface RevealedHandProps {
  cards: Card[];
}

export function RevealedHand({ cards }: RevealedHandProps) {
  const style: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  };

  return (
    <div style={style}>
      {cards.map((c) => (
        <MiniCard key={cardKey(c)} card={c} />
      ))}
    </div>
  );
}
