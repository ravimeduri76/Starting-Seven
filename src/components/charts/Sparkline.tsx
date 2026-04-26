
interface SparklineProps {
  values: number[];
  dark?: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({
  values,
  dark = false,
  width = 80,
  height = 24,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 1;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const stroke = dark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,34,0.5)';
  const dot = dark ? 'rgba(255,255,255,0.9)' : '#0f1722';

  const lastX = padding + ((values.length - 1) / (values.length - 1)) * (width - padding * 2);
  const lastY =
    padding + (1 - (values[values.length - 1] - min) / range) * (height - padding * 2);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Sparkline"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={dot} />
    </svg>
  );
}
