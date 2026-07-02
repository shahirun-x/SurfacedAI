"use client";

import { useState } from "react";

interface AuditInputProps {
  onAuditComplete: (content: string) => void;
}

export default function AuditInput({ onAuditComplete }: AuditInputProps) {
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const charCount = content.length;
  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;

  function handleRunAudit() {
    if (content.trim() === "" || isAnalyzing) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      onAuditComplete(content);
    }, 1500);
  }

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-6 px-4">
      {/* Textarea wrapper */}
      <div
        className="w-full p-px rounded-2xl shadow-2xl"
        style={{
          background: `linear-gradient(to bottom, var(--color-border), var(--color-surface-alt))`,
        }}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-56 md:h-72 p-6 rounded-2xl resize-none outline-none text-caption transition-shadow duration-150"
          placeholder="Paste your content here — blog post, documentation, markdown, plain text…"
          disabled={isAnalyzing}
          style={{
            background: "var(--color-surface-alt)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            caretColor: "var(--color-teal)",
          }}
          onFocus={(e) => {
            const wrapper = e.currentTarget.parentElement;
            if (wrapper)
              wrapper.style.background = `linear-gradient(to bottom, var(--color-teal), var(--color-surface-alt))`;
          }}
          onBlur={(e) => {
            const wrapper = e.currentTarget.parentElement;
            if (wrapper)
              wrapper.style.background = `linear-gradient(to bottom, var(--color-border), var(--color-surface-alt))`;
          }}
        />
      </div>

      {/* Stats row */}
      <div className="w-full flex items-center justify-between text-sm px-1">
        <span style={{ color: "var(--color-text-muted)" }}>
          {charCount.toLocaleString()} character{charCount !== 1 && "s"} ·{" "}
          {wordCount.toLocaleString()} word{wordCount !== 1 && "s"}
        </span>

        <button
          onClick={handleRunAudit}
          disabled={content.trim() === "" || isAnalyzing}
          className="relative px-6 py-2.5 rounded-xl font-semibold text-sm transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-teal)",
            color: "var(--color-ink)",
          }}
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing…
            </span>
          ) : (
            "Run Audit"
          )}
        </button>
      </div>
    </div>
  );
}
