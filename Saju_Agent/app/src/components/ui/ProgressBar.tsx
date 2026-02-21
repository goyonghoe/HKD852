"use client";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      )}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
            background: "linear-gradient(90deg, #7C5CFC, #FF8FAB)",
          }}
        />
      </div>
    </div>
  );
}
