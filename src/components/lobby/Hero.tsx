interface HeroProps {
  kicker?: string;
  headline: string;
  subhead?: string;
}

export function Hero({ kicker, headline, subhead }: HeroProps) {
  return (
    <div style={styles.container}>
      {kicker && <div style={styles.kicker}>{kicker}</div>}
      <h1 style={styles.headline}>{headline}</h1>
      {subhead && <p style={styles.subhead}>{subhead}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: 'center' as const,
    padding: '40px 0 32px',
    maxWidth: '540px',
    margin: '0 auto',
  },
  kicker: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.32em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-50)',
    marginBottom: '12px',
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontSize: '52px',
    fontWeight: 400,
    letterSpacing: '-0.025em',
    color: 'var(--ink)',
    margin: 0,
    lineHeight: 1.05,
  },
  subhead: {
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontWeight: 400,
    fontStyle: 'italic',
    color: 'var(--ink-60)',
    margin: '12px 0 0',
    lineHeight: 1.5,
  },
};
