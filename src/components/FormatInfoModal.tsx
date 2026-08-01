import React from "react";
import { X, ShieldCheck, Terminal, CheckCircle2, AlertCircle } from "lucide-react";

interface FormatInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormatInfoModal: React.FC<FormatInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              CodeFix AI Output Protocol Specifications
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-300 leading-relaxed max-h-[80vh] overflow-y-auto">
          <p className="text-sm text-slate-200">
            CodeFix AI follows a strict 4-field protocol designed for immediate automated consumption in CI/CD pipelines, IDE extensions, or developer tools:
          </p>

          {/* Field Breakdown */}
          <div className="space-y-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-cyan-400 text-xs">LANGUAGE: &lt;detected programming language&gt;</span>
              <p className="text-slate-400 text-[11px]">
                Automatically identifies language (Python, Java, C++, JavaScript, TypeScript, SQL, Rust, Go, etc.) from syntax.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-amber-400 text-xs">STATUS: &lt;"BUG_FOUND" | "NO_BUG"&gt;</span>
              <p className="text-slate-400 text-[11px]">
                Determines whether actionable syntax, runtime, or logical bugs exist. Personal style choices are excluded.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-purple-400 text-xs">EXPLANATION: &lt;1-3 concise technical sentences&gt;</span>
              <p className="text-slate-400 text-[11px]">
                Directly describes what was wrong and why it caused incorrect behavior (under 60 words).
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono font-bold text-emerald-400 text-xs">CODE:\n&lt;complete code&gt;</span>
              <p className="text-slate-400 text-[11px]">
                Always returns the complete runnable source code — corrected if BUG_FOUND, unchanged if NO_BUG.
              </p>
            </div>
          </div>

          {/* Rules Summary */}
          <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-800/40 space-y-2">
            <span className="font-semibold text-indigo-300 flex items-center space-x-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Core Guarantees</span>
            </span>
            <ul className="list-disc list-inside space-y-1 text-indigo-200 text-[11px]">
              <li>Never rewrites unrelated code or adds unrequested refactorings</li>
              <li>Never invents false positive bugs on valid code</li>
              <li>Preserves original language conventions & syntax</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
