import React, { useState, useEffect } from "react";

interface RoastBannerProps {
  roast: string | null;
  score?: number | null;
}

export default function RoastBanner({ roast, score = null }: RoastBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (roast) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [roast]);

  let title = "OVERALL ROAST";
  let emoji = "🔥";
  let bannerStyle = "border-fire-orange/30 bg-gradient-to-r from-fire-orange/15 via-fire-pink/15 to-roast-red/15 fire-glow";
  
  if (score === 0) {
    title = "🪦 RIP Your Career";
    emoji = "💀";
    bannerStyle = "border-roast-red/50 bg-gradient-to-r from-black via-roast-red/25 to-black shadow-lg shadow-roast-red/10";
  } else if (score === 100) {
    title = "🏆 Once in a lifetime event";
    emoji = "👑";
    bannerStyle = "border-warn-yellow/50 bg-gradient-to-r from-warn-yellow/15 via-[#d4af37]/15 to-[#ffd700]/15 shadow-lg shadow-warn-yellow/10";
  }

  return (
    <div 
      className={`w-full transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 ${
        show && roast ? "max-h-40 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0 pointer-events-none"
      }`}
    >
      <div className={`relative overflow-hidden rounded-xl border p-4 md:p-5 glass ${bannerStyle}`}>
        {/* Decorative background glow elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-fire-orange/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fire-pink/5 rounded-full blur-3xl -ml-10 -mb-10" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="text-3xl md:text-4xl select-none animate-bounce">{emoji}</div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest text-fire-orange uppercase mb-1">
                {title}
              </h3>
              <p className="text-sm md:text-base font-bold text-foreground leading-relaxed pr-6">
                &ldquo;{roast}&rdquo;
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShow(false)}
            className="text-foreground/40 hover:text-foreground/85 hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss roast"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
