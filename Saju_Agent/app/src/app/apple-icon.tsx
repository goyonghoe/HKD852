import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#0A0910",
        borderRadius: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          background:
            "radial-gradient(circle at 50% 45%, rgba(78,205,196,0.12) 0%, transparent 70%)",
        }}
      />

      <svg width="160" height="160" viewBox="0 0 96 96" fill="none">
        {/* Face */}
        <ellipse
          cx="48"
          cy="52"
          rx="22"
          ry="26"
          fill="#13111C"
          stroke="#4ECDC4"
          strokeWidth="1.2"
          opacity="0.9"
        />
        {/* Horns */}
        <path
          d="M30 32 Q24 18 18 10"
          stroke="#4ECDC4"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M66 32 Q72 18 78 10"
          stroke="#4ECDC4"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <circle cx="18" cy="10" r="3" fill="#4ECDC4" opacity="0.5" />
        <circle cx="78" cy="10" r="3" fill="#4ECDC4" opacity="0.5" />
        {/* Eyes */}
        <path d="M33 48 Q39 43 45 48 Q39 51 33 48Z" fill="#F0C674" />
        <path d="M51 48 Q57 43 63 48 Q57 51 51 48Z" fill="#F0C674" />
        <circle cx="39" cy="47.5" r="2" fill="#0A0910" />
        <circle cx="57" cy="47.5" r="2" fill="#0A0910" />
        {/* Smirk */}
        <path
          d="M39 63 Q48 70 57 63"
          stroke="#F0C674"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* Fang */}
        <line
          x1="53"
          y1="63"
          x2="54.5"
          y2="67"
          stroke="#E8E6F0"
          strokeWidth="1.2"
          opacity="0.5"
        />
        {/* Fox fires */}
        <circle cx="12" cy="44" r="5" fill="#4ECDC4" opacity="0.2" />
        <circle cx="84" cy="48" r="4" fill="#F0C674" opacity="0.15" />
        <circle cx="20" cy="72" r="3" fill="#F0C674" opacity="0.1" />
        <circle cx="76" cy="74" r="3.5" fill="#4ECDC4" opacity="0.1" />
      </svg>
    </div>,
    { ...size },
  );
}
