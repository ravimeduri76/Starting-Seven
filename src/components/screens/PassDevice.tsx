interface PassDeviceProps {
  nextPlayerName: string;
  roundNumber: number;
  turnNumber: number;
  playerScore: number;
  playerHandSize: number;
  onReveal: () => void;
}

export function PassDevice({ nextPlayerName, roundNumber, turnNumber, playerScore, playerHandSize, onReveal }: PassDeviceProps) {
  return (
    <div style={styles.shell}>
      <div style={styles.content}>
        {/* Hand-off glyph */}
        <svg width="120" height="56" viewBox="0 0 120 56" fill="none" style={{ marginBottom: '24px' }}>
          <rect x="4" y="8" width="32" height="40" rx="4" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
          <path d="M48 28 L72 28" stroke="rgba(255,255,255,0.3)" strokeWidth="2" markerEnd="url(#arrow)" />
          <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          </marker></defs>
          <rect x="84" y="8" width="32" height="40" rx="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        </svg>

        <div style={styles.kicker}>Pass the device</div>
        <h1 style={styles.headline}>
          Hand it to <span style={styles.gold}>{nextPlayerName}</span>.
        </h1>
        <p style={styles.subhead}>Cards are hidden until {nextPlayerName} taps to begin...</p>

        <button style={styles.confirmBtn} onClick={onReveal} autoFocus>
          I'm {nextPlayerName} &mdash; show me my hand
        </button>

        {/* Context strip */}
        <div style={styles.contextStrip}>
          <ContextCell label="Round" value={String(roundNumber)} />
          <ContextCell label="Turn" value={String(turnNumber)} />
          <ContextCell label="Score" value={String(playerScore)} />
          <ContextCell label="Hand" value={`${playerHandSize} cards`} />
        </div>
      </div>
    </div>
  );
}

function ContextCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.contextCell}>
      <div style={styles.contextLabel}>{label}</div>
      <div style={styles.contextValue}>{value}</div>
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
    color: 'rgba(255,255,255,0.4)',
    margin: '0 0 32px',
  },
  confirmBtn: {
    padding: '16px 32px',
    minWidth: '320px',
    background: 'var(--paper)',
    color: 'var(--ink)',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '32px',
  },
  contextStrip: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '1px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '16px',
  },
  contextCell: {
    textAlign: 'center' as const,
  },
  contextLabel: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: '4px',
  },
  contextValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.85)',
  },
};
