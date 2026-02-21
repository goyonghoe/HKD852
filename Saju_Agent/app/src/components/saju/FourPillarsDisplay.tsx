"use client";

import { FourPillars } from "@/lib/saju/types";
import PillarCard from "./PillarCard";
import Card from "../ui/Card";

interface FourPillarsDisplayProps {
  pillars: FourPillars;
  animated?: boolean;
}

export default function FourPillarsDisplay({
  pillars,
  animated = false,
}: FourPillarsDisplayProps) {
  const pillarData = [
    { label: "시주", pillar: pillars.hour, delay: 0.45 },
    { label: "일주", pillar: pillars.day, delay: 0.3 },
    { label: "월주", pillar: pillars.month, delay: 0.15 },
    { label: "년주", pillar: pillars.year, delay: 0 },
  ];

  return (
    <Card>
      <h3 className="text-sm font-medium text-gray-400 text-center mb-4">
        나의 사주 팔자
      </h3>
      <div className="flex justify-center gap-3">
        {pillarData.map(({ label, pillar, delay }) => (
          <div
            key={label}
            className={animated ? "pillar-animate" : ""}
            style={animated ? { animationDelay: `${delay}s` } : undefined}
          >
            <PillarCard label={label} pillar={pillar} />
          </div>
        ))}
      </div>
    </Card>
  );
}
