"use client";

interface ReadingSectionProps {
  icon: string;
  title: string;
  content: string;
  highlighted?: boolean;
}

export default function ReadingSection({
  icon,
  title,
  content,
  highlighted = false,
}: ReadingSectionProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all ${
        highlighted ? "ring-2 ring-primary/30" : ""
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-3 flex items-center gap-2 ${
          highlighted
            ? "bg-gradient-to-r from-primary/10 to-secondary/10"
            : "bg-gray-50"
        }`}
      >
        <span className="text-lg">{icon}</span>
        <h3 className={`text-sm font-bold ${highlighted ? "text-gradient" : "text-gray-700"}`}>
          {title}
        </h3>
        {highlighted && <span className="text-xs text-primary ml-auto">NEW</span>}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  );
}
