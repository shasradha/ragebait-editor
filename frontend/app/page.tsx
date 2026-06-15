"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Editor from "../components/Editor";
import ErrorPanel, { ErrorItem } from "../components/ErrorPanel";
import RoastBanner from "../components/RoastBanner";
import ScoreBadge from "../components/ScoreBadge";
import CopyButton from "../components/CopyButton";
import useAnalyse from "../hooks/useAnalyse";
import { speak, speakRoast, speakError, setMuted, stopSpeaking, speakKey, speakIdle } from "../lib/speech";

const DEFAULT_PYTHON_CODE = `def calculate_grade(score)
  if score >= 90
    print("A Grade")
   elif score >= 80:
  print("B Grade")
  else
    print("F Grade")
  
calculate_grade(85)
`;

const LANGUAGE_OPTIONS = [
  { name: "Python", value: "python" },
  { name: "JavaScript", value: "javascript" },
  { name: "TypeScript", value: "typescript" },
  { name: "Java", value: "java" },
  { name: "C++", value: "cpp" },
  { name: "C", value: "c" },
  { name: "Go", value: "go" },
  { name: "Rust", value: "rust" },
  { name: "PHP", value: "php" },
  { name: "Ruby", value: "ruby" },
  { name: "Kotlin", value: "kotlin" },
  { name: "Swift", value: "swift" },
  { name: "Other", value: "plaintext" }
];

export default function Home() {
  const [code, setCode] = useState(DEFAULT_PYTHON_CODE);
  const [sessionId, setSessionId] = useState("");
  const [activeTab, setActiveTab] = useState<"errors" | "fixed">("errors");
  const [roastLang, setRoastLang] = useState<string>("english");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<boolean>(false);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("male");
  const genderSwitchesRef = useRef<number[]>([]);

  // Easter Eggs State
  const [is3AMMode, setIs3AMMode] = useState<boolean>(false);
  const [logoShake, setLogoShake] = useState<boolean>(false);
  const [showKonamiPopup, setShowKonamiPopup] = useState<boolean>(false);
  const [konamiFlash, setKonamiFlash] = useState<boolean>(false);
  const [zeroFlash, setZeroFlash] = useState<boolean>(false);
  const [skullConfetti, setSkullConfetti] = useState<boolean>(false);
  const [goldConfetti, setGoldConfetti] = useState<boolean>(false);

  // Mobile panel toggle
  const [showMobilePanel, setShowMobilePanel] = useState<boolean>(false);

  // References for Caching and Interaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const lastAnalysedCodeRef = useRef<string>("");
  const cachedResponseRef = useRef<any>(null);
  const logoClicksRef = useRef<number[]>([]);
  const konamiIndexRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    errors,
    setErrors,
    overallRoast,
    setOverallRoast,
    score,
    setScore,
    fixedCode,
    setFixedCode,
    loading,
    analysed,
    setAnalysed,
    errorText,
    setErrorText,
    analyse,
    reset,
  } = useAnalyse();

  // Generate session ID
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // 3AM Mode Check
  useEffect(() => {
    const check3AM = () => {
      const hours = new Date().getHours();
      setIs3AMMode(hours >= 0 && hours < 4);
    };
    check3AM();
    const interval = setInterval(check3AM, 60000);
    return () => clearInterval(interval);
  }, []);

  // Idle Timer 5 Minutes — now uses AI-generated messages
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      speakIdle(roastLang, voiceGender);
    }, 5 * 60 * 1000);
  }, [roastLang, voiceGender]);

  useEffect(() => {
    resetIdleTimer();
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleUserActivity = () => resetIdleTimer();
    events.forEach((event) => window.addEventListener(event, handleUserActivity));
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
    };
  }, [resetIdleTimer]);

  // Konami Code Listener
  useEffect(() => {
    const konamiCode = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const expectedKey = konamiCode[konamiIndexRef.current].toLowerCase();

      if (key === expectedKey) {
        konamiIndexRef.current += 1;
        if (konamiIndexRef.current === konamiCode.length) {
          triggerKonamiEgg();
          konamiIndexRef.current = 0;
        }
      } else {
        konamiIndexRef.current = key === konamiCode[0].toLowerCase() ? 1 : 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [roastLang]);

  const triggerKonamiEgg = () => {
    setKonamiFlash(true);
    setTimeout(() => setKonamiFlash(false), 500);
    speakKey("konami", roastLang, voiceGender);
    setShowKonamiPopup(true);
  };

  // Clicks logo 5 times fast
  const handleLogoClick = () => {
    const now = Date.now();
    logoClicksRef.current = [...logoClicksRef.current.filter((t) => now - t < 2000), now];
    if (logoClicksRef.current.length >= 5) {
      speakKey("click_logo", roastLang, voiceGender);
      setLogoShake(true);
      setTimeout(() => setLogoShake(false), 500);
      logoClicksRef.current = [];
    }
  };

  // Speaks overall roast automatically when banners update
  useEffect(() => {
    if (overallRoast && analysed) {
      speakRoast(overallRoast, roastLang, voiceGender);
    }
  }, [overallRoast, roastLang, voiceGender, analysed]);

  // Speech for Mute toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMutedState(nextMuted);
    setMuted(nextMuted);
    if (nextMuted) {
      stopSpeaking();
    }
  };

  const toggleGender = () => {
    const nextGender = voiceGender === "male" ? "female" : "male";
    setVoiceGender(nextGender);
    
    const now = Date.now();
    genderSwitchesRef.current = [...genderSwitchesRef.current.filter((t) => now - t < 180 * 1000), now];
    if (genderSwitchesRef.current.length > 3) {
      speakKey("gender_egg", roastLang, nextGender);
      genderSwitchesRef.current = []; // reset
    }
  };

  const handleAnalyse = async () => {
    if (cooldown || loading) return;

    const trimmedCode = code.trim();

    // Empty Code Analysis Egg
    if (!trimmedCode) {
      speakKey("empty_code", roastLang, voiceGender);
      setErrorText("Bro submitted empty code 💀");
      return;
    }

    // Same Code Twice Analysis Egg
    if (trimmedCode === lastAnalysedCodeRef.current) {
      speakKey("same_code", roastLang, voiceGender);
      setErrorText("Did you... submit the same code again? Hoping it would fix itself? It did not.");
      if (cachedResponseRef.current) {
        const cached = cachedResponseRef.current;
        setErrors(cached.errors || []);
        setOverallRoast(cached.overall_roast || "");
        setScore(cached.score !== undefined ? cached.score : 50);
        setFixedCode(cached.fixed_code || "");
        setAnalysed(true);
      }
      return;
    }

    // Normal analysis flow
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1000); // 1-second debounce cooldown

    const result = await analyse(code, sessionId, roastLang, selectedLanguage, is3AMMode);

    if (result) {
      lastAnalysedCodeRef.current = trimmedCode;
      cachedResponseRef.current = result;
      setActiveTab("errors");

      // On mobile, show the panel after analysis
      setShowMobilePanel(true);

      // Score = 0 Egg
      if (result.score === 0) {
        setZeroFlash(true);
        setTimeout(() => setZeroFlash(false), 800);
        setSkullConfetti(true);
        setTimeout(() => setSkullConfetti(false), 5000);
        speakKey("score_zero", roastLang, voiceGender);
      }

      // Score = 100 Egg
      if (result.score === 100) {
        setGoldConfetti(true);
        setTimeout(() => setGoldConfetti(false), 5000);
        speakKey("score_100", roastLang, voiceGender);
      }
    }
  };

  const handleSelectLine = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  const handleSelectError = (error: ErrorItem) => {
    handleSelectLine(error.line);
    speakError(error.slang_message, roastLang, voiceGender);
    // On mobile, hide panel to show editor with highlighted line
    setShowMobilePanel(false);
  };

  return (
    <main className={`h-[100dvh] max-h-[100dvh] bg-dark-gradient py-3 px-3 sm:py-4 sm:px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-2 sm:gap-4 overflow-hidden w-full transition-colors duration-500 ${
      konamiFlash ? "bg-roast-red/35" : zeroFlash ? "bg-[#000000]" : ""
    }`}>
      {/* Konami achievement popup */}
      {showKonamiPopup && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-[#121212] border border-fire-orange/40 p-6 rounded-2xl max-w-sm text-center relative fire-glow glass">
            <div className="text-5xl mb-4 select-none">🏆</div>
            <h3 className="text-xl font-bold text-gradient-fire mb-2">Achievement Unlocked</h3>
            <p className="text-sm font-mono text-foreground/80 mb-6">Biggest W Loser</p>
            <button
              onClick={() => setShowKonamiPopup(false)}
              className="px-5 py-2.5 bg-fire-gradient hover:opacity-90 text-white rounded-xl text-sm font-bold shadow-lg shadow-fire-orange/20 cursor-pointer select-none transition-all duration-150"
            >
              I accept my fate
            </button>
          </div>
        </div>
      )}

      {/* Confetti Animation Elements */}
      {skullConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(35)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              💀
            </div>
          ))}
        </div>
      )}

      {goldConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(60)].map((_, i) => {
            const colors = ["#ffd700", "#ffdf00", "#d4af37", "#f3e5ab"];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-sm animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: randomColor,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Top Bar / Header — Mobile responsive with wrapping */}
      <header className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-dark-border pb-2 gap-2">
        {/* Logo + title */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl select-none animate-float">🔥</span>
            <div 
              onClick={handleLogoClick}
              className={`cursor-pointer select-none ${logoShake ? "animate-shake" : ""}`}
            >
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gradient-fire leading-none">
                RageBait Editor
              </h1>
              <p className="text-[9px] sm:text-[10px] font-mono text-foreground/45 mt-0.5">
                Gen-Z Code Reviewer. No Cap. 💀
              </p>
            </div>
          </div>

          {/* Mobile-only: Score + Analyse inline */}
          <div className="flex items-center gap-2 sm:hidden">
            {analysed && score !== null && <ScoreBadge score={score} />}
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-fire-gradient text-white shadow-md shadow-fire-orange/15 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1 transition-all duration-150"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>...</span>
                </>
              ) : (
                <>
                  <span>🔘</span>
                  <span>Analyse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Controls row — scrollable on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-3 w-full sm:w-auto overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          {/* 3AM Mode Chip */}
          {is3AMMode && (
            <div className="bg-purple-950/40 border border-purple-500/30 text-purple-300 font-mono text-[10px] px-2 py-1 rounded-full flex items-center gap-1 animate-pulse select-none shrink-0">
              <span>🌙</span>
              <span>3AM</span>
            </div>
          )}

          {/* Roasting Language Dropdown */}
          <div className="flex items-center gap-1 bg-dark-surface/90 border border-dark-border rounded-xl px-1.5 sm:px-2 py-1 sm:py-1.5 shrink-0">
            <span className="text-xs text-foreground/40 font-mono hidden sm:inline">Roast:</span>
            <select
              value={roastLang}
              onChange={(e) => setRoastLang(e.target.value)}
              className="bg-transparent text-base sm:text-xs text-foreground/80 font-semibold focus:outline-none cursor-pointer border-none"
            >
              <option value="english" className="bg-[#141414] text-foreground">🇺🇸 English</option>
              <option value="hinglish" className="bg-[#141414] text-foreground">🇮🇳 Hinglish</option>
              <option value="banglish" className="bg-[#141414] text-foreground">🇧🇩 Banglish</option>
              <option value="bhojpuri" className="bg-[#141414] text-foreground">🌾 Bhojpuri</option>
              <option value="marathi" className="bg-[#141414] text-foreground">🚩 Marathi</option>
              <option value="tamil" className="bg-[#141414] text-foreground">🦚 Tamil</option>
              <option value="british" className="bg-[#141414] text-foreground">🇬🇧 British</option>
            </select>
          </div>

          {/* Code Language Dropdown */}
          <div className="flex items-center gap-1 bg-dark-surface/90 border border-dark-border rounded-xl px-1.5 sm:px-2 py-1 sm:py-1.5 shrink-0">
            <span className="text-xs text-foreground/40 font-mono hidden sm:inline">Lang:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-base sm:text-xs text-foreground/80 font-semibold focus:outline-none cursor-pointer border-none"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#141414] text-foreground">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mute Button Toggle */}
          <button
            onClick={toggleMute}
            className="p-1.5 sm:p-2 rounded-xl bg-dark-surface/90 border border-dark-border hover:bg-white/5 transition-all text-xs cursor-pointer select-none text-foreground/70 shrink-0"
            title="Toggle Voice Roasting"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          {/* Gender Toggle Button */}
          <button
            onClick={toggleGender}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold select-none cursor-pointer transition-all duration-300 shrink-0 ${
              voiceGender === "male"
                ? "bg-blue-900/40 text-blue-400 border-blue-500/30 hover:bg-blue-900/50"
                : "bg-pink-900/40 text-pink-400 border-pink-500/30 hover:bg-pink-900/50"
            }`}
            title="Switch Voice Gender"
          >
            {voiceGender === "male" ? "♂" : "♀"}
            <span className="hidden sm:inline">{voiceGender === "male" ? "Male" : "Female"}</span>
          </button>

          {/* Desktop-only: Score + Analyse */}
          <div className="hidden sm:flex items-center gap-3">
            {analysed && score !== null && <ScoreBadge score={score} />}

            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="px-5 py-2 rounded-xl font-bold text-xs bg-fire-gradient text-white shadow-md shadow-fire-orange/15 hover:shadow-fire-orange/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 transition-all duration-150"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Roasting...</span>
                </>
              ) : (
                <>
                  <span>🔘</span>
                  <span>Analyse Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Error alert toast */}
      {errorText && (
        <div className="p-2 sm:p-3 rounded-xl bg-roast-red/10 border border-roast-red/30 text-roast-red text-xs font-semibold flex items-center justify-between gap-2 animate-slide-down flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0">❌</span>
            <p className="truncate">{errorText}</p>
          </div>
          <button onClick={() => setErrorText(null)} className="text-roast-red/70 hover:text-roast-red font-bold text-xs px-2 cursor-pointer select-none shrink-0">
            dismiss
          </button>
        </div>
      )}

      {/* Roast Banner (If overall roast present) */}
      <RoastBanner roast={overallRoast} score={score} />

      {/* Editor area — takes remaining space on desktop, flexible on mobile */}
      <div className={`flex-1 min-h-0 relative ${showMobilePanel ? "hidden sm:block" : ""}`}>
        <Editor
          value={code}
          onChange={(val) => {
            setCode(val || "");
            if (analysed) reset();
          }}
          readOnly={loading}
          errors={errors}
          editorRef={editorRef}
          language={selectedLanguage}
        />
      </div>

      {/* Mobile toggle to show/hide bottom panel */}
      {analysed && (
        <button
          onClick={() => setShowMobilePanel(!showMobilePanel)}
          className="sm:hidden flex items-center justify-center gap-2 py-1.5 text-xs font-mono text-foreground/60 border border-dark-border rounded-lg bg-dark-card/50 cursor-pointer select-none flex-shrink-0"
        >
          {showMobilePanel ? "📝 Show Editor" : `🔥 Show Results (${errors.length} errors)`}
        </button>
      )}

      {/* Bottom panel — responsive height */}
      <section className={`${showMobilePanel ? "flex-1 min-h-0" : "hidden sm:flex sm:flex-col"} sm:h-[280px] sm:min-h-[280px] sm:max-h-[280px] border border-dark-border bg-dark-card/30 rounded-xl overflow-hidden glass flex flex-col flex-shrink-0`}>
        {/* Tab bar header */}
        <div className="flex items-center justify-between border-b border-dark-border px-3 sm:px-4 py-2 bg-dark-card/50 flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("errors")}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer select-none ${
                activeTab === "errors"
                  ? "bg-fire-gradient text-white"
                  : "text-foreground/60 hover:text-foreground hover:bg-white/5"
              }`}
            >
              Errors ({errors.length})
            </button>
            
            <button
              onClick={() => setActiveTab("fixed")}
              disabled={!analysed}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === "fixed"
                  ? "bg-fire-gradient text-white"
                  : "text-foreground/60 hover:text-foreground hover:bg-white/5"
              }`}
            >
              Fixed Code
            </button>
          </div>

          {activeTab === "fixed" && fixedCode && (
            <CopyButton
              text={fixedCode}
              onCopy={() => speakKey("copy_code", roastLang, voiceGender)}
            />
          )}
        </div>

        {/* Tab contents */}
        <div className="p-3 sm:p-4 bg-dark-card/10 flex-grow min-h-0 overflow-hidden">
          {activeTab === "errors" ? (
            <ErrorPanel
              errors={errors}
              onSelectError={handleSelectError}
              loading={loading}
            />
          ) : (
            <div className="h-full sm:h-[210px] sm:max-h-[210px] relative overflow-hidden">
              <Editor value={fixedCode} readOnly={true} language={selectedLanguage} />
            </div>
          )}
        </div>
      </section>

      {/* Tiny Footer */}
      <footer className="h-5 sm:h-6 flex-shrink-0 text-center text-[9px] sm:text-[10px] font-mono text-foreground/20 flex items-center justify-center border-t border-dark-border/40">
        <p>Built with Next.js + FastAPI + Groq AI + ChromaDB | Vibes & Roast only 💅</p>
      </footer>
    </main>
  );
}
