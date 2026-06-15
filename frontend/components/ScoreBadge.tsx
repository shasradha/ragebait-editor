import React from "react";

interface ScoreBadgeProps {
  score: number | null;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  if (score === null) return null;

  let colorClass = "text-roast-red border-roast-red/30 bg-roast-red/10";
  let emoji = "💀";
  let label = "Cooked";

  if (score >= 71) {
    colorClass = "text-toxic-green border-toxic-green/30 bg-toxic-green/10";
    emoji = "🔥";
    label = "Slay";
  } else if (score >= 41) {
    colorClass = "text-warn-yellow border-warn-yellow/30 bg-warn-yellow/10";
    emoji = "🤨";
    label = "Mid";
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 border rounded-full font-mono text-sm font-bold animate-score-pop shadow-lg ${colorClass}`}
    >
      <span>{emoji}</span>
      <span>{score}/100</span>
      <span className="text-xs uppercase opacity-70 border-l border-current pl-2">
        {label}
      </span>
    </div>
  );
}
