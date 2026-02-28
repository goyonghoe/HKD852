interface BadgeProps {
  yield_: number;
}

export default function Badge({ yield_ }: BadgeProps) {
  if (yield_ >= 5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-profit-dim text-profit">
        HIGH
      </span>
    );
  }
  if (yield_ >= 3) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gold-dim text-gold">
        MID
      </span>
    );
  }
  return null;
}
