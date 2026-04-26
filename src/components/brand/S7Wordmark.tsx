import { S7Mark } from './S7Mark';

interface S7WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  mono?: boolean;
}

const CONFIG = {
  sm: { mark: 24, type: 16, gap: 10, kicker: 9 },
  md: { mark: 36, type: 22, gap: 14, kicker: 10 },
  lg: { mark: 56, type: 36, gap: 20, kicker: 11 },
} as const;

export function S7Wordmark({ size = 'md', mono = false }: S7WordmarkProps) {
  const cfg = CONFIG[size];

  const wrapStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: cfg.gap,
  };

  const kickerStyle: React.CSSProperties = {
    fontSize: cfg.kicker,
    color: mono ? 'currentColor' : 'rgba(15,23,34,0.55)',
    textTransform: 'uppercase',
    letterSpacing: '0.22em',
    fontWeight: 600,
    marginBottom: 2,
    opacity: mono ? 0.7 : 1,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: cfg.type,
    fontWeight: 500,
    letterSpacing: '-0.025em',
    color: mono ? 'currentColor' : '#0f1722',
    lineHeight: 1,
  };

  return (
    <div style={wrapStyle}>
      <S7Mark size={cfg.mark} mono={mono} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={kickerStyle}>The game of</div>
        <div style={titleStyle}>Starting Seven</div>
      </div>
    </div>
  );
}
