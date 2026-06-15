import React, { useEffect, useRef, useState } from "react";
import MonacoEditor, { Monaco } from "@monaco-editor/react";

interface ErrorItem {
  line: number;
  type: "syntax" | "indent" | "format" | "logic";
  slang_message: string;
  fix: string;
}

interface EditorWrapperProps {
  value: string;
  onChange?: (val: string | undefined) => void;
  readOnly?: boolean;
  errors?: ErrorItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorRef?: React.MutableRefObject<any>;
  language?: string;
}

const formatJSorTS = async (code: string, isTS: boolean): Promise<string> => {
  const prettier = await import("prettier/standalone");
  const parserBabel = await import("prettier/parser-babel");
  const estree = await import("prettier/plugins/estree" as any);
  
  let plugins: any[] = [parserBabel, estree];
  let parser = "babel";

  if (isTS) {
    try {
      const parserTS = await import("prettier/parser-typescript" as any);
      plugins = [parserTS, estree];
      parser = "typescript";
    } catch (e) {
      console.warn("TypeScript parser load failed, fallback to babel parser");
    }
  }

  return prettier.format(code, {
    parser,
    plugins,
    semi: true,
    singleQuote: true,
  });
};

export default function Editor({
  value,
  onChange,
  readOnly = false,
  errors = [],
  editorRef: externalEditorRef,
  language = "python",
}: EditorWrapperProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localEditorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [formatting, setFormatting] = useState(false);

  // Store editor reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    localEditorRef.current = editor;
    monacoRef.current = monaco;
    
    if (externalEditorRef) {
      externalEditorRef.current = editor;
    }

    // Define ragebait-dark custom theme
    monaco.editor.defineTheme('ragebait-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'ff6b6b', fontStyle: 'bold' },
        { token: 'string', foreground: 'ffd93d' },
        { token: 'comment', foreground: '6bcb77', fontStyle: 'italic' },
        { token: 'number', foreground: 'c77dff' },
        { token: 'function', foreground: '4d96ff' },
      ],
      colors: {
        'editor.background': '#0d0d0d',
        'editor.foreground': '#f0f0f0',
        'editorLineNumber.foreground': '#444444',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editorCursor.foreground': '#ff6b6b',
        'editor.selectionBackground': '#ff6b6b33',
      }
    });

    // Configure python language settings
    monaco.languages.setLanguageConfiguration('python', {
      tabSize: 4,
      insertSpaces: true,
      trimAutoWhitespace: true
    } as any);

    // Expose select text formatting details
    editor.updateOptions({
      fontFamily: "var(--font-jetbrains), JetBrains Mono, Fira Code, monospace",
      fontSize: 14,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      padding: { top: 12, bottom: 12 },
      theme: 'ragebait-dark'
    });

    setEditorLoaded(true);
  };

  // Switch Monaco editor language model when language changes
  useEffect(() => {
    if (localEditorRef.current && monacoRef.current && editorLoaded) {
      const editor = localEditorRef.current;
      const monaco = monacoRef.current;
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language, editorLoaded]);

  // Apply decorations whenever errors or editor loaded state changes
  useEffect(() => {
    if (!localEditorRef.current || !monacoRef.current || !editorLoaded) return;

    const editor = localEditorRef.current;
    const monaco = monacoRef.current;

    // Clear old decorations
    if (decorationIdsRef.current.length > 0) {
      editor.deltaDecorations(decorationIdsRef.current, []);
      decorationIdsRef.current = [];
    }

    if (errors.length === 0) return;

    const newDecorations = errors.map((error) => {
      const isRed = error.type === "syntax" || error.type === "indent";
      
      const lineClass = isRed 
        ? "error-line-syntax" 
        : `error-line-${error.type}`;
        
      const glyphClass = isRed 
        ? "error-glyph-red" 
        : "error-glyph-yellow";

      return {
        range: new monaco.Range(error.line, 1, error.line, 1),
        options: {
          isWholeLine: true,
          className: lineClass,
          glyphMarginClassName: glyphClass,
          glyphMarginHoverMessage: {
            value: `**[${error.type.toUpperCase()}]** ${error.slang_message}\n\n*Fix: \`${error.fix}\`*`,
          },
          hoverMessage: [
            {
              value: `🔥 **RageBait Roast:**\n\n"${error.slang_message}"\n\n**Fix:** \`${error.fix}\``,
            },
          ],
        },
      };
    });

    decorationIdsRef.current = editor.deltaDecorations([], newDecorations);
  }, [errors, editorLoaded]);

  const handleFormat = async () => {
    if (!localEditorRef.current) return;
    const editor = localEditorRef.current;
    setFormatting(true);
    try {
      if (language === "javascript" || language === "typescript") {
        const currentCode = editor.getValue();
        const formatted = await formatJSorTS(currentCode, language === "typescript");
        editor.setValue(formatted);
      } else {
        editor.getAction("editor.action.formatDocument").run();
      }
    } catch (err) {
      console.error("Format error:", err);
      // fallback
      try {
        editor.getAction("editor.action.formatDocument").run();
      } catch (innerErr) {
        console.error("Fallback format failed:", innerErr);
      }
    } finally {
      setFormatting(false);
    }
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-dark-border bg-[#0d0d0d] shadow-2xl relative flex flex-col">
      {/* Title bar / Controls overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        {!readOnly && (
          <button
            onClick={handleFormat}
            disabled={formatting}
            className="px-3 py-1.5 rounded-lg bg-dark-card/90 hover:bg-dark-surface/90 border border-dark-border text-foreground hover:text-white font-mono text-xs cursor-pointer select-none transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
          >
            {formatting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Formatting...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Format Code</span>
              </>
            )}
          </button>
        )}
        {readOnly && (
          <div className="bg-toxic-green/10 border border-toxic-green/30 text-toxic-green font-mono text-[10px] px-2 py-1 rounded uppercase tracking-wider select-none shadow-md">
            Read-Only Fix
          </div>
        )}
      </div>

      <div className="w-full flex-grow relative overflow-hidden">
        <MonacoEditor
          height="100%"
          language={language}
          theme="ragebait-dark"
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            glyphMargin: true,
            folding: true,
            lineNumbersMinChars: 3,
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
          loading={
            <div className="w-full h-full flex flex-col items-center justify-center text-foreground/50 font-mono text-sm bg-[#0d0d0d] gap-3">
              <div className="w-6 h-6 border-2 border-fire-orange border-t-transparent rounded-full animate-spin"></div>
              <span>Loading editor...</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
