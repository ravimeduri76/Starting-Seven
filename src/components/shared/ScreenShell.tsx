import type { ReactNode } from 'react';

interface ScreenShellProps {
  variant: 'paper' | 'dark';
  children: ReactNode;
}

const VARIANTS: Record<ScreenShellProps['variant'], React.CSSProperties> = {
  paper: {
    background: '#f1ede4',
    color: '#0f1722',
  },
  dark: {
    background: '#0f1722',
    color: '#f1ede4',
  },
};

export function ScreenShell({ variant, children }: ScreenShellProps) {
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    overflow: 'hidden',
    padding: '20px 24px',
    gap: 16,
    ...VARIANTS[variant],
  };

  return <div style={style}>{children}</div>;
}
