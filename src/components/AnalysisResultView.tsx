import React, { useState, useMemo } from "react";
import { CodeFixResult } from "../types";
import { DiffViewer } from "./DiffViewer";
import {
  Bug,
  CheckCircle2,
  Copy,
  Terminal,
  Check,
  Code2,
  Zap,
  GitPullRequest,
  Gauge,
  ShieldCheck,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

export type FixCategoryType =
  | "Syntax"
  | "Runtime"
  | "Logical"
  | "Performance"
  | "Best Practice"
  | "Type Safety";

interface FixCategoryMeta {
  type: FixCategoryType;
  label: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const CATEGORIES_META: Record<FixCategoryType, FixCategoryMeta> = {
  Syntax: {
    type: "Syntax",
    label: "Syntax Error",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    iconColor: "text-rose-400",
    icon: Code2,
    keywords: [
      "syntax",
      "colon",
      "bracket",
      "parentheses",
      "brace",
      "indentation",
      "semicolon",
      "quote",
      "token",
      "typo",
      "keyword",
      "missing ;",
      "missing :",
      "unclosed",
      "parser",
    ],
  },
  Runtime: {
    type: "Runtime",
    label: "Runtime Error",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-950/20",
    iconColor: "text-amber-400",
    icon: Zap,
    keywords: [
      "runtime",
      "undefined",
      "null",
      "nan",
      "typeerror",
      "referenceerror",
      "index",
      "out of bounds",
      "zero",
      "exception",
      "crash",
      "unhandled",
      "not defined",
      "attributeerror",
      "keyerror",
      "pointer",
    ],
  },
  Logical: {
    type: "Logical",
    label: "Logical Error",
    badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    borderClass: "border-purple-500/30",
    bgClass: "bg-purple-950/20",
    iconColor: "text-purple-400",
    icon: GitPullRequest,
    keywords: [
      "logic",
      "logical",
      "condition",
      "off-by-one",
      "infinite loop",
      "return value",
      "boolean",
      "operator",
      "comparison",
      "wrong variable",
      "calculation",
      "math",
      "state",
      "order",
      "incorrect loop",
      "assignment",
    ],
  },
  Performance: {
    type: "Performance",
    label: "Performance",
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    borderClass: "border-cyan-500/30",
    bgClass: "bg-cyan-950/20",
    iconColor: "text-cyan-400",
    icon: Gauge,
    keywords: [
      "performance",
      "efficiency",
      "memory",
      "leak",
      "complexity",
      "loop optimization",
      "redundant",
      "caching",
      "memoization",
      "async",
      "bottleneck",
      "slow",
      "allocation",
    ],
  },
  "Best Practice": {
    type: "Best Practice",
    label: "Best Practice",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-950/20",
    iconColor: "text-emerald-400",
    icon: ShieldCheck,
    keywords: [
      "best practice",
      "clean code",
      "naming",
      "scope",
      "global",
      "mutation",
      "cleanup",
      "deprecation",
      "convention",
      "structure",
      "refactored",
      "readability",
      "style",
    ],
  },
  "Type Safety": {
    type: "Type Safety",
    label: "Type Safety",
    badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    borderClass: "border-indigo-500/30",
    bgClass: "bg-indigo-950/20",
    iconColor: "text-indigo-400",
    icon: Shield,
    keywords: [
      "type",
      "interface", "generic", "coercion", "cast", "typescript", "annotation", "mismatch", "signature"
    ],
  },
};

interface CategorizedFixItem {
  id: string;
  text: string;
  category: FixCategoryType;
}

interface AnalysisResultViewProps {
  result: CodeFixResult;
  onApplyToEditor: (code: string) => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onApplyToEditor,
}) => {
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  const isBugFound = result.status === "BUG_FOUND";

  const handleCopyRawFormat = async () => {
    try {
      await navigator.clipboard.writeText(result.rawOutput);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } catch (e) {
      console.error("Failed to copy raw format", e);
    }
  };

  // Group explanations / fixes by category type
  const categorizedFixes = useMemo(() => {
    if (!isBugFound) {
      return [];
    }

    // Split explanation into sentences or clauses
    const rawExplanation = result.explanation || "";
    const clauses = rawExplanation
      .split(/(?<=[.!?])\s+|\n+|(?:;\s+)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    if (clauses.length === 0) {
      clauses.push(rawExplanation || "Identified bug and provided corrected code.");
    }

    const items: CategorizedFixItem[] = [];

    clauses.forEach((clause, idx) => {
      const lowerClause = clause.toLowerCase();
      let bestCategory: FixCategoryType = "Logical";
      let highestScore = 0;

      (Object.keys(CATEGORIES_META) as FixCategoryType[]).forEach((catKey) => {
        const meta = CATEGORIES_META[catKey];
        let score = 0;
        meta.keywords.forEach((kw) => {
          if (lowerClause.includes(kw)) {
            score += kw.length > 5 ? 3 : 2;
          }
        });

        if (score > highestScore) {
          highestScore = score;
          bestCategory = catKey;
        }
      });

      // Secondary fallback heuristics if no strong keyword hit
      if (highestScore === 0) {
        if (lowerClause.includes("syntax") || lowerClause.includes("missing") || lowerClause.includes("typo")) {
          bestCategory = "Syntax";
        } else if (lowerClause.includes("undefined") || lowerClause.includes("null") || lowerClause.includes("error")) {
          bestCategory = "Runtime";
        } else if (lowerClause.includes("type") || lowerClause.includes("interface")) {
          bestCategory = "Type Safety";
        } else if (lowerClause.includes("clean") || lowerClause.includes("best") || lowerClause.includes("use")) {
          bestCategory = "Best Practice";
        } else {
          bestCategory = "Logical";
        }
      }

      items.push({
        id: `fix-${idx}`,
        text: clause,
        category: bestCategory,
      });
    });

    return items;
  }, [result.explanation, isBugFound]);

  // Group items by category key
  const groupedCategoryMap = useMemo(() => {
    const map: Partial<Record<FixCategoryType, CategorizedFixItem[]>> = {};

    categorizedFixes.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = [];
      }
      map[item.category]!.push(item);
    });

    return map;
  }, [categorizedFixes]);

  const activeCategoryKeys = useMemo(() => {
    return (Object.keys(groupedCategoryMap) as FixCategoryType[]);
  }, [groupedCategoryMap]);

  const filteredItems = useMemo(() => {
    if (selectedCategoryFilter === "ALL") {
      return categorizedFixes;
    }
    return categorizedFixes.filter((item) => item.category === selectedCategoryFilter);
  }, [categorizedFixes, selectedCategoryFilter]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Result Status Header Box */}
      <div
        className={`p-5 rounded-xl border shadow-xl transition-all ${
          isBugFound
            ? "bg-slate-900/90 border-amber-500/40 shadow-amber-500/5"
            : "bg-slate-900/90 border-emerald-500/40 shadow-emerald-500/5"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            {/* Status Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isBugFound
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              }`}
            >
              {isBugFound ? <Bug className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isBugFound
                      ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                      : "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                  }`}
                >
                  STATUS: {result.status}
                </span>

                <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-800 text-cyan-300 border border-slate-700 rounded-full">
                  LANGUAGE: {result.language}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Analysis completed at {new Date(result.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRawOutput(!showRawOutput)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showRawOutput ? "Hide Protocol View" : "View Protocol View"}</span>
            </button>

            <button
              onClick={handleCopyRawFormat}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Copy exact 4-field protocol format output"
            >
              {copiedRaw ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Format!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Copy Raw Protocol</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Overview Technical Explanation Box */}
        <div className="mt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            TECHNICAL OVERVIEW:
          </span>
          <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            {result.explanation}
          </p>
        </div>
      </div>

      {/* Grouped Fixes By Type Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Fixes Grouped By Category
            </span>
          </div>

          {/* Filter Badges Bar */}
          {isBugFound && activeCategoryKeys.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategoryFilter("ALL")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors cursor-pointer ${
                  selectedCategoryFilter === "ALL"
                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/50 font-bold"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                All ({categorizedFixes.length})
              </button>

              {activeCategoryKeys.map((catKey) => {
                const meta = CATEGORIES_META[catKey];
                const count = groupedCategoryMap[catKey]?.length || 0;
                const isSelected = selectedCategoryFilter === catKey;

                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedCategoryFilter(catKey)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all cursor-pointer flex items-center space-x-1 ${
                      meta.badgeClass
                    } ${isSelected ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950 font-bold" : "opacity-80 hover:opacity-100"}`}
                  >
                    <span>{meta.label}</span>
                    <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/60 rounded-full font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Render Category Grouped Cards */}
        {isBugFound ? (
          <div className="space-y-3">
            {(selectedCategoryFilter === "ALL" ? activeCategoryKeys : [selectedCategoryFilter as FixCategoryType])
              .filter((catKey) => groupedCategoryMap[catKey as FixCategoryType])
              .map((catKey) => {
                const meta = CATEGORIES_META[catKey as FixCategoryType];
                const catItems = groupedCategoryMap[catKey as FixCategoryType] || [];
                const IconComponent = meta.icon;

                return (
                  <div
                    key={catKey}
                    className={`p-3.5 rounded-lg border ${meta.borderClass} ${meta.bgClass} space-y-2 transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`p-1.5 rounded-md bg-slate-950/80 ${meta.iconColor} border ${meta.borderClass}`}>
                          <IconComponent className="w-4 h-4" />
                        </span>
                        <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {catItems.length} {catItems.length === 1 ? "issue addressed" : "issues addressed"}
                      </span>
                    </div>

                    <ul className="space-y-1.5 pt-1">
                      {catItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start space-x-2 text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/50 p-2.5 rounded border border-slate-800/60"
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${meta.iconColor} shrink-0 mt-0.5`} />
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

            {filteredItems.length === 0 && (
              <div className="text-xs text-slate-400 py-3 text-center italic">
                No fixes found under the selected category filter.
              </div>
            )}
          </div>
        ) : (
          /* NO BUG Clean Code State */
          <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                  VERIFIED CLEAN CODE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                No syntax errors, runtime issues, logical flaws, or bad practices detected across all diagnostic categories.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Raw Output Terminal Modal / Toggle */}
      {showRawOutput && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner font-mono text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-cyan-400 font-semibold flex items-center space-x-1.5">
              <Terminal className="w-4 h-4" />
              <span>Raw CodeFix AI Protocol Output</span>
            </span>
            <button
              onClick={handleCopyRawFormat}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              Copy Protocol Text
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-slate-300 leading-5 select-all overflow-x-auto p-2 bg-slate-900/60 rounded border border-slate-800">
            {result.rawOutput}
          </pre>
        </div>
      )}

      {/* Code Comparison / Diff Viewer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            CODE: {isBugFound ? "(Auto-Corrected Version)" : "(Verified Unchanged Code)"}
          </span>
          {isBugFound && (
            <span className="text-xs text-emerald-400 font-medium">
              Line-by-line diff auto-generated
            </span>
          )}
        </div>

        <DiffViewer
          originalCode={result.originalCode}
          correctedCode={result.code}
          language={result.language}
          onApplyToEditor={onApplyToEditor}
        />
      </div>
    </div>
  );
};

