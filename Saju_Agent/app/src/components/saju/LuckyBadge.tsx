"use client";

interface LuckyBadgeProps {
  type: "color" | "number" | "direction" | "season";
  value: string;
}

const BADGE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  color: { label: "행운의 색", color: "#FF6B6B", emoji: "🎨" },
  number: { label: "행운의 숫자", color: "#4ECDC4", emoji: "🔢" },
  direction: { label: "행운의 방향", color: "#7DD3A0", emoji: "🧭" },
  season: { label: "행운의 계절", color: "#F0C674", emoji: "🌸" },
};

export default function LuckyBadge({ type, value }: LuckyBadgeProps) {
  const config = BADGE_CONFIG[type];
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm" style={{ backgroundColor: `${config.color}18` }}>
        {config.emoji}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-text-dim font-medium">{config.label}</p>
        <p className="text-[14px] font-semibold text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}
