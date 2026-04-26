export function RulesStrip() {
  return (
    <div style={styles.container}>
      <div style={styles.kicker}>The rules in three moves</div>
      <div style={styles.grid}>
        <RuleCard
          number="1"
          title="Open with a seven"
          body="Any 7 starts its suit's chain. The holder of the 7 of Spades goes first."
        />
        <RuleCard
          number="2"
          title="Extend by one"
          body="Play a card adjacent to either end of an open chain. One card per turn."
        />
        <RuleCard
          number="3"
          title="Lightest hand wins"
          body="First to empty wins the round. Others score the pip value of cards still held."
        />
      </div>
    </div>
  );
}

function RuleCard({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardNumber}>{number}</div>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardBody}>{body}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '2px solid var(--ink)',
    borderBottom: '1px solid var(--ink-12)',
    padding: '24px 0',
    marginBottom: '32px',
  },
  kicker: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-50)',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '24px',
  },
  card: {
    padding: '4px 0',
  },
  cardNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 400,
    color: 'var(--ink)',
    marginBottom: '4px',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--ink)',
    marginBottom: '4px',
  },
  cardBody: {
    fontSize: '13px',
    color: 'var(--ink-60)',
    lineHeight: 1.5,
  },
};
