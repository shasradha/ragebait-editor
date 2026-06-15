export interface ErrorItem {
  line: number;
  type: "syntax" | "indent" | "format" | "logic";
  slang_message: string;
  fix: string;
}

export interface AnalyseResponse {
  errors: ErrorItem[];
  overall_roast: string;
  score: number;
  fixed_code: string;
}

export async function analyseCode(
  code: string,
  sessionId: string,
  roastLang: string = "english",
  selectedLanguage: string = "python",
  is3AM: boolean = false
): Promise<AnalyseResponse> {
  const response = await fetch("/api/analyse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      session_id: sessionId,
      roast_lang: roastLang,
      selected_language: selectedLanguage,
      is_3am: is3AM
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.statusText}`);
  }

  return response.json();
}
