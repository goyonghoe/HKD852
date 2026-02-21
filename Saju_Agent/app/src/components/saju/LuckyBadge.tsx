"use client";

interface LuckyBadgeProps {
  type: "color" | "number" | "direction" | "season";
  value: string;
}

const BADGE_CONFIG: Record<string, { icon: string; label: string }> = {
  color: { icon: "🎨", label: "행운의 색" },
  number: { icon: "🎲", label: "행운의 숫자" },
  direction: { icon: "🧭", label: "행운의 방향" },
  season: { icon: "🍀", label: "행운의 계절" },
};

export default function LuckyBadge({ type, value }: LuckyBadgeProps) {
  const config = BADGE_CONFIG[type];

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3 badge-float">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-lg shrink-0">
        {config.icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-medium">{config.label}</p>
        <p className="text-sm font-bold text-gray-700 truncate">{value}</p>
      </div>
    </div>
  );
}
