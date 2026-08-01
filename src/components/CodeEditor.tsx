import React, { useState } from "react";
import { Play, Sparkles, Trash2, Clipboard, FileText, Code2, AlertTriangle } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onAnalyze: (languageHint?: string) => void;
  isAnalyzing: boolean;
  selectedLanguageHint: string;
  onLanguageHintChange: (lang: string) => void;
  onOpenPresets: () => void;
  errorMsg: string | null;
}

const SUPPORTED_LANGUAGES = [
  "Auto-Detect",
  "Python",
  "JavaScript",
  "TypeScript",
  "C++",
  "Java",
  "C#",
  "Go",
  "Rust",
  "SQL",
  "HTML/CSS",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onAnalyze,
  isAnalyzing,
  selectedLanguageHint,
  onLanguageHintChange,
  onOpenPresets,
  errorMsg,
}) => {
  const lineCount = code.split("\n").length;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      }
    } catch (e) {
      console.error("Clipboard paste error", e);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Editor Header Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
            Source Code Input
          </span>
          <span className="text-xs text-slate-500">
            ({lineCount} {lineCount === 1 ? "line" : "lines"}, {code.length} chars)
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <span className="text-[11px] text-slate-400 font-medium">Language:</span>
            <select
              value={selectedLanguageHint}
              onChange={(e) => onLanguageHintChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-slate-900 text-slate-200">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePaste}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
            title="Paste code from clipboard"
          >
            <Clipboard className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            disabled={!code}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-40"
            title="Clear editor"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex-1 bg-slate-950 flex font-mono text-sm overflow-hidden min-h-[300px]">
        {/* Line Numbers Sidebar */}
        <div className="select-none py-3 px-3 bg-slate-900/60 border-r border-slate-800 text-slate-600 text-right text-xs font-mono min-w-[40px]">
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              if (!isAnalyzing && code.trim()) {
                onAnalyze(selectedLanguageHint !== "Auto-Detect" ? selectedLanguageHint : undefined);
              }
            }
          }}
          placeholder="// Paste or write your source code here (Python, JS, C++, Java, Rust, SQL, etc.)...&#10;&#10;CodeFix AI will detect syntax errors, runtime bugs, and logical flaws, then automatically fix them.&#10;&#10;Press Ctrl+Enter (or ⌘+Enter) to analyze immediately."
          spellCheck={false}
          className="w-full h-full p-3 bg-transparent text-slate-100 placeholder-slate-600 resize-none font-mono text-sm leading-6 focus:outline-none scrollbar-thin scrollbar-thumb-slate-800"
        />
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="px-4 py-2.5 bg-amber-950/80 border-t border-amber-800/80 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => onAnalyze(selectedLanguageHint !== "Auto-Detect" ? selectedLanguageHint : undefined)}
            disabled={isAnalyzing}
            className="px-2.5 py-1 bg-amber-800/60 hover:bg-amber-700/80 text-amber-100 rounded text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Footer Bar / Run Button */}
      <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenPresets}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Try a Buggy Sample</span>
        </button>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => onAnalyze(selectedLanguageHint !== "Auto-Detect" ? selectedLanguageHint : undefined)}
            disabled={isAnalyzing || !code.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Run CodeFix AI diagnostics (Ctrl+Enter)"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing Code...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Analyze & Auto-Fix</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-black/30 border border-white/20 text-[10px] font-mono text-cyan-100 rounded ml-1">
                  Ctrl+↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
