"use client";

interface DokkaebiIconProps {
  size?: number;
  className?: string;
}

export default function DokkaebiIcon({ size = 48, className = "" }: DokkaebiIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
    >
      <defs>
        <radialGradient id="dokk-aura" cx="50%" cy="50%" r="48%">
          <stop offset="0%" stopColor="#F0C674" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#4ECDC4" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0A0910" stopOpacity="0" />
        </radialGradient>
        <filter id="dokk-fire">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Mystical aura */}
      <circle cx="48" cy="48" r="44" fill="url(#dokk-aura)" />

      {/* Fox fires floating around */}
      <circle cx="16" cy="32" r="4" fill="#4ECDC4" opacity="0.15" filter="url(#dokk-fire)" />
      <circle cx="80" cy="36" r="3.5" fill="#4ECDC4" opacity="0.12" filter="url(#dokk-fire)" />
      <circle cx="24" cy="68" r="3" fill="#F0C674" opacity="0.1" filter="url(#dokk-fire)" />
      <circle cx="72" cy="72" r="3.5" fill="#F0C674" opacity="0.08" filter="url(#dokk-fire)" />
      <circle cx="14" cy="52" r="2.5" fill="#4ECDC4" opacity="0.08" filter="url(#dokk-fire)" />
      <circle cx="82" cy="56" r="2" fill="#F0C674" opacity="0.1" filter="url(#dokk-fire)" />

      {/* Dark face emerging */}
      <ellipse cx="48" cy="50" rx="20" ry="25" fill="#13111C" opacity="0.8" />
      <ellipse cx="48" cy="50" rx="20" ry="25" fill="none" stroke="#4ECDC4" strokeWidth="0.8" opacity="0.15" />

      {/* Horns with glowing tips */}
      <path d="M32 30 Q27 18 22 12" stroke="#4ECDC4" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M64 30 Q69 18 74 12" stroke="#4ECDC4" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="22" cy="12" r="2" fill="#4ECDC4" opacity="0.3" filter="url(#dokk-fire)" />
      <circle cx="74" cy="12" r="2" fill="#4ECDC4" opacity="0.3" filter="url(#dokk-fire)" />

      {/* Eyes — warm gold almonds, knowing gaze */}
      <path d="M34 46 Q39 42 44 46 Q39 48 34 46Z" fill="#F0C674" opacity="0.85" />
      <path d="M52 46 Q57 42 62 46 Q57 48 52 46Z" fill="#F0C674" opacity="0.85" />
      <circle cx="39" cy="45.5" r="1.5" fill="#13111C" />
      <circle cx="57" cy="45.5" r="1.5" fill="#13111C" />

      {/* Playful knowing smirk */}
      <path d="M40 60 Q48 66 56 60" stroke="#F0C674" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* Fang hint */}
      <line x1="52" y1="60" x2="53" y2="63" stroke="#E8E6F0" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}
