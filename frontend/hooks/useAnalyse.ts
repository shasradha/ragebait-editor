import { useState, useCallback } from "react";
import { ErrorItem, analyseCode } from "../lib/api";
import { playErrorSounds } from "../lib/sounds";

export default function useAnalyse() {
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [overallRoast, setOverallRoast] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [fixedCode, setFixedCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [analysed, setAnalysed] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const analyse = useCallback(async (
    code: string,
    sessionId: string,
    roastLang: string,
    selectedLanguage: string,
    is3AM: boolean
  ) => {
    setLoading(true);
    setErrorText(null);
    try {
      const result = await analyseCode(code, sessionId, roastLang, selectedLanguage, is3AM);
      setErrors(result.errors || []);
      setOverallRoast(result.overall_roast || "");
      setScore(result.score !== undefined ? result.score : null);
      setFixedCode(result.fixed_code || "");
      setAnalysed(true);
      
      // Play funny sound effects based on errors
      playErrorSounds(result.errors || []);
      
      return result;
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setErrorText(err.message || "Something went wrong. The backend might be starting up or Groq is rate-limiting us. Try again fr fr.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setErrors([]);
    setOverallRoast(null);
    setScore(null);
    setFixedCode("");
    setAnalysed(false);
    setErrorText(null);
  }, []);

  return {
    errors,
    setErrors,
    overallRoast,
    setOverallRoast,
    score,
    setScore,
    fixedCode,
    setFixedCode,
    loading,
    setLoading,
    analysed,
    setAnalysed,
    errorText,
    setErrorText,
    analyse,
    reset,
  };
}
