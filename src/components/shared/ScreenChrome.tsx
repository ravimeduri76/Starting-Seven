import type { ReactNode } from 'react';

interface ScreenChromeProps {
  context?: string;
  children?: ReactNode;
}

export function ScreenChrome({ context, children }: ScreenChromeProps) {
  const barStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottom: '1px solid rgba(15,23,34,0.12)',
    flexShrink: 0,
  };

  const contextStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'rgba(15,23,34,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    fontWeight: 600,
  };

  const rightStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  };

  return (
    <div style={barStyle}>
      {context ? <div style={contextStyle}>{context}</div> : <div />}
      <div style={rightStyle}>{children}</div>
    </div>
  );
}
