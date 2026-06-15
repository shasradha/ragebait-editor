import React, { useState } from "react";

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
}

export default function CopyButton({ text, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) onCopy();
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border flex items-center gap-2 ${
        copied
          ? "bg-toxic-green/10 border-toxic-green text-toxic-green shadow-lg shadow-toxic-green/10 scale-105"
          : "bg-dark-surface hover:bg-dark-border border-dark-border text-foreground hover:text-white"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {copied ? (
        <>
          <span>Copied! ✅</span>
        </>
      ) : (
        <>
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
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          <span>Copy Fixed Code</span>
        </>
      )}
    </button>
  );
}
