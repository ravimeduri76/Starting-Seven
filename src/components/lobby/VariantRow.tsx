interface VariantRowProps {
  label: string;
  description: string;
  checked: boolean;
  recommended?: boolean;
  onChange: (v: boolean) => void;
}

export function VariantRow({ label, description, checked, recommended, onChange }: VariantRowProps) {
  return (
    <label style={styles.row}>
      <div style={styles.text}>
        <div style={styles.label}>
          {label}
          {recommended && <span style={styles.badge}>RECOMMENDED</span>}
        </div>
        <div style={styles.desc}>{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          ...styles.toggle,
          ...(checked ? styles.toggleOn : {}),
        }}
        role="switch"
        aria-checked={checked}
      >
        <span style={{
          ...styles.knob,
          ...(checked ? styles.knobOn : {}),
        }} />
      </button>
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid var(--ink-08)',
    cursor: 'pointer',
    gap: '16px',
  },
  text: { flex: 1 },
  label: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    color: 'var(--success)',
    textTransform: 'uppercase' as const,
  },
  desc: {
    fontSize: '13px',
    color: 'var(--ink-50)',
    marginTop: '2px',
  },
  toggle: {
    width: '44px',
    height: '24px',
    borderRadius: '999px',
    border: '1.5px solid var(--ink-12)',
    background: 'var(--paper)',
    position: 'relative' as const,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'background 0.2s, border-color 0.2s',
  },
  toggleOn: {
    background: 'var(--ink)',
    borderColor: 'var(--ink)',
  },
  knob: {
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    width: '18px',
    height: '18px',
    borderRadius: '999px',
    background: 'var(--ink-50)',
    transition: 'transform 0.2s, background 0.2s',
  },
  knobOn: {
    transform: 'translateX(20px)',
    background: 'var(--paper)',
  },
};
