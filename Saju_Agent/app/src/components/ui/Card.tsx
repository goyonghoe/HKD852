"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "teal" | "gold" | "ember" | false;
}

export default function Card({ children, className = "", glow = false }: CardProps) {
  const glowClass = glow === "teal" ? "glow-teal" : glow === "gold" ? "glow-gold" : glow === "ember" ? "glow-ember" : "";

  return (
    <div
      className={`bg-surface rounded-2xl border border-surface-border p-5 ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
}
