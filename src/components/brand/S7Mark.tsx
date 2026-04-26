
interface S7MarkProps {
  size?: number;
  mono?: boolean;
}

export function S7Mark({ size = 36, mono = false }: S7MarkProps) {
  const stroke = mono ? 'currentColor' : '#0f1722';
  const heart = mono ? 'currentColor' : '#a8201a';
  const club = mono ? 'currentColor' : '#15803d';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Starting Seven"
    >
      {/* Card-edge bracket */}
      <rect
        x="3" y="3" width="58" height="58" rx="6"
        fill="none"
        stroke={stroke}
        strokeOpacity={mono ? 1 : 0.18}
        strokeWidth="1"
      />

      {/* The seven numeral */}
      <path
        d="M 18 16 L 46 16 L 46 19 L 30 50"
        fill="none"
        stroke={stroke}
        strokeWidth="4.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Crossbar */}
      <path
        d="M 24 32 L 36 32"
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="square"
      />

      {/* Suit-tinted chain segments */}
      <rect x="6" y="52" width="9" height="4" rx="1" fill={heart} />
      <rect x="49" y="52" width="9" height="4" rx="1" fill={club} />

      {/* Connection dots */}
      <circle cx="20" cy="54" r="1.2" fill={stroke} opacity={mono ? 1 : 0.4} />
      <circle cx="44" cy="54" r="1.2" fill={stroke} opacity={mono ? 1 : 0.4} />
    </svg>
  );
}
