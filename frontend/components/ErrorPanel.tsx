import React from "react";

export interface ErrorItem {
  line: number;
  type: "syntax" | "indent" | "format" | "logic";
  slang_message: string;
  fix: string;
}

interface ErrorPanelProps {
  errors: ErrorItem[];
  onSelectError: (error: ErrorItem) => void;
  loading?: boolean;
}

export default function ErrorPanel({ errors, onSelectError, loading = false }: ErrorPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 h-full sm:h-[210px] sm:max-h-[210px] overflow-y-auto pr-1 pb-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-dark-border bg-dark-card/25 glass"
          >
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="w-[54px] h-[48px] bg-white/5 rounded-lg shrink-0" />
              <div className="flex-grow flex flex-col gap-2">
                <div className="w-16 h-3 bg-white/5 rounded" />
                <div className="w-2/3 h-5 bg-white/10 rounded" />
              </div>
            </div>
            <div className="w-28 h-8 bg-white/5 rounded-lg shrink-0 w-full md:w-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!errors || errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full sm:h-[210px] text-foreground/40 font-mono text-center">
        <span className="text-4xl mb-2 animate-float">🔥</span>
        <h3 className="font-bold text-base text-foreground/60 mb-1">Code is Clean! No Cap!</h3>
        <p className="text-xs max-w-md">
          No syntax cooked, indentation checks out. You&apos;re a certified W dev.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full sm:h-[210px] sm:max-h-[210px] overflow-y-auto pr-1 pb-2 scroll-smooth">
      {errors.map((error, idx) => {
        const isRed = error.type === "syntax" || error.type === "indent";
        
        const badgeColor = isRed
          ? "bg-roast-red/20 border-roast-red text-roast-red"
          : "bg-warn-yellow/20 border-warn-yellow text-warn-yellow";

        const typeLabel = error.type.toUpperCase();

        return (
          <div
            key={idx}
            onClick={() => onSelectError(error)}
            className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-dark-border bg-dark-card/50 hover:bg-dark-surface/80 hover:border-foreground/20 cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-lg glass"
          >
            {/* Left border highlight indicator */}
            <div
              className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-xl ${
                isRed ? "bg-roast-red" : "bg-warn-yellow"
              }`}
            />

            <div className="flex items-start gap-4">
              {/* Line number badge */}
              <div
                className={`flex flex-col items-center justify-center min-w-[54px] px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold leading-tight ${badgeColor}`}
              >
                <span className="text-[10px] opacity-75 uppercase">Line</span>
                <span className="text-sm">{error.line}</span>
              </div>

              {/* Error messages */}
              <div className="flex flex-col gap-1 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                      isRed ? "bg-roast-red/10 text-roast-red" : "bg-warn-yellow/10 text-warn-yellow"
                    }`}
                  >
                    {typeLabel}
                  </span>
                </div>
                
                <p className="text-sm font-bold text-foreground leading-snug group-hover:text-white transition-colors">
                  {error.slang_message}
                </p>
              </div>
            </div>

            {/* Fix code snippet */}
            <div className="w-full md:w-auto md:max-w-[30%] shrink-0">
              <div className="bg-[#090909] border border-dark-border px-3 py-1.5 rounded-lg font-mono text-xs text-foreground/80 overflow-x-auto relative">
                <span className="text-[9px] uppercase tracking-wider text-foreground/40 absolute top-1 right-2">FIX</span>
                <code className="text-toxic-green block pt-1 select-all">{error.fix}</code>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
