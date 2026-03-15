"use client";

import { useState, useRef, useEffect } from "react";

interface InlineEditorProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

export default function InlineEditor({
  value,
  onSave,
  className = "",
  placeholder = "클릭하여 편집...",
  multiline = false,
}: InlineEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={`text-left w-full hover:bg-surface-light rounded px-1 -mx-1 transition-colors ${className}`}
      >
        {value || <span className="text-text-dim italic">{placeholder}</span>}
      </button>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-full bg-surface-light border border-accent/30 rounded px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 resize-y min-h-[60px] ${className}`}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className={`w-full bg-surface-light border border-accent/30 rounded px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 ${className}`}
    />
  );
}
