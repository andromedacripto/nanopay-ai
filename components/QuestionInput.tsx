"use client";

import { useRef, useEffect } from "react";

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function QuestionInput({
  value,
  onChange,
  disabled,
}: QuestionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Ask anything..."
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/20 disabled:opacity-50"
      />
      <div className="mt-1 flex justify-end">
        <span className={`text-xs ${value.length > 1800 ? "text-yellow-400" : "text-text-muted"}`}>
          {value.length}/2000
        </span>
      </div>
    </div>
  );
}
