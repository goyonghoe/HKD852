interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
}

export default function ProgressBar({
  current,
  total,
  color,
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-text-secondary">
          {current} / {total}
        </span>
        <span className="text-sm text-text-dim font-bold">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-surface-alt rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color || undefined,
          }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          {!color && <div className="w-full h-full bg-primary rounded-full" />}
        </div>
      </div>
    </div>
  );
}
