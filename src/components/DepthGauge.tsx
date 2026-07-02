"use client";

import { useEffect, useRef, useState } from "react";

interface DepthGaugeProps {
  score: number; // 0–100
}

function getLabel(score: number): string {
  if (score >= 80) return "Surfaced";
  if (score >= 50) return "Rising";
  return "Buried";
}

function getLabelColor(score: number): string {
  if (score >= 80) return "text-(--color-teal)";
  if (score >= 50) return "text-(--color-text-muted)";
  return "text-(--color-amber)";
}

export default function DepthGauge({ score }: DepthGaugeProps) {
  const [animated, setAnimated] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    // Detect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;

    // Skip straight to final state if reduced motion
    if (mq.matches) {
      setAnimated(true);
      return;
    }

    // Small delay so the browser paints the initial (0) state first
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setAnimated(true), 50);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  const clampedScore = Math.max(0, Math.min(100, score));
  // markerPct: 0 = bottom, 100 = top
  const markerPct = animated ? clampedScore : 0;
  // We map score 0→bottom (translateY 100%) to score 100→top (translateY 0%)
  const translateY = 100 - markerPct; // percentage from top

  const label = getLabel(clampedScore);
  const labelColorClass = getLabelColor(clampedScore);

  return (
    <div
      className="flex flex-col items-center gap-4"
      role="img"
      aria-label={`Overall score: ${clampedScore} — ${label}`}
    >
      {/* Gauge track */}
      <div
        className="relative w-12 rounded-full overflow-hidden"
        style={{ height: 240 }}
      >
        {/* Gradient fill background (always visible, static) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(to top, var(--color-ink) 0%, #0d2d2a 40%, var(--color-teal) 100%)",
          }}
        />

        {/* Dark overlay that slides down to reveal fill */}
        <div
          className="absolute inset-x-0 top-0 bg-(--color-ink) rounded-full"
          style={{
            height: `${translateY}%`,
            transition: animated || reducedMotion.current
              ? undefined
              : "height 800ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {/* Marker line + score bubble */}
        <div
          className="absolute inset-x-0 flex items-center justify-center"
          style={{
            top: `${translateY}%`,
            transform: "translateY(-50%)",
            transition: reducedMotion.current
              ? undefined
              : "top 800ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Horizontal rule */}
          <div
            className="absolute inset-x-0 h-px"
            style={{ backgroundColor: "var(--color-teal)", opacity: 0.9 }}
          />
          {/* Score bubble */}
          <div
            className="relative z-10 px-2 py-0.5 rounded-sm font-instrument text-sm font-bold"
            style={{
              background: "var(--color-ink)",
              color: "var(--color-teal)",
              border: "1px solid var(--color-teal)",
              lineHeight: 1.2,
              fontSize: "0.75rem",
            }}
          >
            {clampedScore}
          </div>
        </div>

        {/* Track border */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: "1px solid var(--color-border)" }}
        />
      </div>

      {/* Large score display */}
      <div
        className="font-instrument text-7xl font-bold leading-none tabular-nums text-(--color-teal)"
        aria-hidden="true"
      >
        {clampedScore}
      </div>

      {/* Label */}
      <p className={`text-caption font-medium uppercase tracking-widest ${labelColorClass}`}>
        {label}
      </p>
    </div>
  );
}
