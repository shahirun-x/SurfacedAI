"use client";

import { useState } from "react";

interface AuditInputProps {
  onAuditComplete: () => void;
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
      onAuditComplete();
    }, 1500);
  }

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-6">
      {/* Textarea wrapper */}
      <div className="w-full p-1 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-900 shadow-2xl border border-neutral-800">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-56 md:h-72 p-6 bg-neutral-950 rounded-xl resize-none outline-none focus:ring-1 focus:ring-neutral-700 text-neutral-200 placeholder:text-neutral-600 transition-shadow font-[family-name:var(--font-geist-sans)]"
          placeholder="Paste your content here — blog post, documentation, markdown, plain text…"
          disabled={isAnalyzing}
        />
      </div>

      {/* Stats row */}
      <div className="w-full flex items-center justify-between text-sm text-neutral-500 px-1">
        <span>
          {charCount.toLocaleString()} character{charCount !== 1 && "s"} ·{" "}
          {wordCount.toLocaleString()} word{wordCount !== 1 && "s"}
        </span>

        <button
          onClick={handleRunAudit}
          disabled={content.trim() === "" || isAnalyzing}
          className="relative px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
            bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20
            hover:shadow-violet-500/40 hover:brightness-110
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100"
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              {/* Spinner */}
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
