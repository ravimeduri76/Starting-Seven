interface NumberFieldProps {
  label: string;
  options: number[];
  value: number;
  suffix?: string;
  onChange: (v: number) => void;
}

export function NumberField({ label, options, value, suffix, onChange }: NumberFieldProps) {
  return (
    <div style={styles.container}>
      <div style={styles.label}>{label}</div>
      <div style={styles.options}>
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            style={{
              ...styles.btn,
              ...(opt === value ? styles.btnActive : {}),
            }}
            onClick={() => onChange(opt)}
          >
            {opt}{suffix ? ` ${suffix}` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    background: 'var(--paper-card)',
    border: '1px solid var(--ink-08)',
    borderRadius: '8px',
    padding: '14px 16px',
  },
  label: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-50)',
    marginBottom: '10px',
  },
  options: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  btn: {
    padding: '6px 12px',
    border: '1px solid var(--ink-12)',
    borderRadius: '6px',
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--ink-60)',
    cursor: 'pointer',
  },
  btnActive: {
    background: 'var(--ink)',
    color: 'var(--paper)',
    borderColor: 'var(--ink)',
    fontWeight: 700,
  },
};
