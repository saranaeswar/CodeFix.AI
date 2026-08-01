import React, { useState, useMemo } from "react";
import { ViewMode } from "../types";
import { Check, Copy, ArrowRight, Columns, Code, GitCompare, Plus, Minus, FileCode2 } from "lucide-react";

interface DiffViewerProps {
  originalCode: string;
  correctedCode: string;
  language: string;
  onApplyToEditor?: (code: string) => void;
}

interface DiffRow {
  type: "same" | "add" | "delete" | "modify";
  origLineNum?: number;
  fixedLineNum?: number;
  origContent?: string;
  fixedContent?: string;
}

function computeDiffRows(origLines: string[], fixedLines: string[]): {
  rows: DiffRow[];
  stats: { additions: number; deletions: number; modifications: number; totalChanges: number };
} {
  const m = origLines.length;
  const n = fixedLines.length;

  // Build LCS matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === fixedLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to extract ops
  type Op = { type: "same" | "delete" | "add"; origIdx?: number; fixedIdx?: number; line: string };
  const ops: Op[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === fixedLines[j - 1]) {
      ops.push({ type: "same", origIdx: i - 1, fixedIdx: j - 1, line: origLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "add", fixedIdx: j - 1, line: fixedLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      ops.push({ type: "delete", origIdx: i - 1, line: origLines[i - 1] });
      i--;
    }
  }

  ops.reverse();

  let additions = 0;
  let deletions = 0;
  let modifications = 0;

  const rows: DiffRow[] = [];
  let idx = 0;

  while (idx < ops.length) {
    const curr = ops[idx];
    if (curr.type === "same") {
      rows.push({
        type: "same",
        origLineNum: (curr.origIdx ?? 0) + 1,
        fixedLineNum: (curr.fixedIdx ?? 0) + 1,
        origContent: curr.line,
        fixedContent: curr.line,
      });
      idx++;
    } else if (curr.type === "delete") {
      // Check if followed by an add -> combine to 'modify'
      if (idx + 1 < ops.length && ops[idx + 1].type === "add") {
        const nextAdd = ops[idx + 1];
        rows.push({
          type: "modify",
          origLineNum: (curr.origIdx ?? 0) + 1,
          fixedLineNum: (nextAdd.fixedIdx ?? 0) + 1,
          origContent: curr.line,
          fixedContent: nextAdd.line,
        });
        modifications++;
        idx += 2;
      } else {
        rows.push({
          type: "delete",
          origLineNum: (curr.origIdx ?? 0) + 1,
          origContent: curr.line,
        });
        deletions++;
        idx++;
      }
    } else if (curr.type === "add") {
      rows.push({
        type: "add",
        fixedLineNum: (curr.fixedIdx ?? 0) + 1,
        fixedContent: curr.line,
      });
      additions++;
      idx++;
    }
  }

  return {
    rows,
    stats: {
      additions,
      deletions,
      modifications,
      totalChanges: additions + deletions + modifications,
    },
  };
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  correctedCode,
  language,
  onApplyToEditor,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode | "unified">("side-by-side");
  const [copied, setCopied] = useState(false);

  const origLines = useMemo(() => originalCode.split("\n"), [originalCode]);
  const fixedLines = useMemo(() => correctedCode.split("\n"), [correctedCode]);

  const { rows, stats } = useMemo(
    () => computeDiffRows(origLines, fixedLines),
    [origLines, fixedLines]
  );

  const handleCopyFixed = async () => {
    try {
      await navigator.clipboard.writeText(correctedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Diff Toolbar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Controls & Language Badge */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center space-x-1 bg-slate-900 p-1 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                viewMode === "side-by-side"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split Screen</span>
            </button>

            <button
              onClick={() => setViewMode("unified")}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                viewMode === "unified"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Unified Diff</span>
            </button>

            <button
              onClick={() => setViewMode("fixed-only")}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                viewMode === "fixed-only"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Fixed Code Only</span>
            </button>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center space-x-1.5 pl-1">
            {stats.totalChanges === 0 ? (
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-medium">
                No differences
              </span>
            ) : (
              <>
                {stats.modifications > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded text-[11px] font-mono font-medium flex items-center space-x-1">
                    <span>~{stats.modifications}</span>
                    <span className="text-[10px]">modified</span>
                  </span>
                )}
                {stats.additions > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-mono font-medium flex items-center space-x-1">
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>{stats.additions}</span>
                  </span>
                )}
                {stats.deletions > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded text-[11px] font-mono font-medium flex items-center space-x-1">
                    <Minus className="w-3 h-3 text-rose-400" />
                    <span>{stats.deletions}</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {onApplyToEditor && (
            <button
              onClick={() => onApplyToEditor(correctedCode)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md hover:shadow-emerald-900/40 transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Apply Fix to Editor</span>
            </button>
          )}

          <button
            onClick={handleCopyFixed}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Fixed Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display Body */}
      {viewMode === "side-by-side" && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 font-mono text-xs overflow-x-auto min-h-[300px] max-h-[600px] bg-slate-950">
          {/* Left Pane: Original Code (With Red Highlights for removed/modified) */}
          <div className="p-3 overflow-y-auto">
            <div className="sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10 pb-2 mb-2 border-b border-slate-800/80 flex items-center justify-between">
              <div className="text-[11px] font-sans font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Original Buggy Code</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{origLines.length} lines</span>
            </div>

            <div className="space-y-0.5">
              {rows.map((row, idx) => {
                if (row.type === "add") {
                  // Line was added in fixed, original side shows empty placeholder
                  return (
                    <div key={idx} className="flex space-x-3 leading-5 px-1 rounded opacity-30 select-none bg-slate-900/30">
                      <span className="text-slate-700 w-7 text-right shrink-0">-</span>
                      <pre className="font-mono text-xs text-slate-600 italic">// line added in fix</pre>
                    </div>
                  );
                }

                const isDeletedOrModified = row.type === "delete" || row.type === "modify";

                return (
                  <div
                    key={idx}
                    className={`flex space-x-2 leading-5 px-1.5 py-0.5 rounded transition-colors ${
                      isDeletedOrModified
                        ? "bg-rose-950/60 text-rose-200 border-l-2 border-rose-500 font-medium"
                        : "text-slate-400 hover:bg-slate-900/50"
                    }`}
                  >
                    <span className="text-slate-600 select-none w-6 text-right shrink-0 font-mono text-[11px]">
                      {row.origLineNum}
                    </span>
                    <span className="w-3 text-center shrink-0 select-none font-bold">
                      {isDeletedOrModified ? <span className="text-rose-400">-</span> : " "}
                    </span>
                    <pre className="whitespace-pre wrap-break font-mono text-xs">{row.origContent || " "}</pre>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Fixed Code (With Green Highlights for added/modified) */}
          <div className="p-3 overflow-y-auto">
            <div className="sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10 pb-2 mb-2 border-b border-slate-800/80 flex items-center justify-between">
              <div className="text-[11px] font-sans font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Corrected Code</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{fixedLines.length} lines</span>
            </div>

            <div className="space-y-0.5">
              {rows.map((row, idx) => {
                if (row.type === "delete") {
                  // Line was deleted from original, fixed side shows empty placeholder
                  return (
                    <div key={idx} className="flex space-x-3 leading-5 px-1 rounded opacity-30 select-none bg-slate-900/30">
                      <span className="text-slate-700 w-7 text-right shrink-0">-</span>
                      <pre className="font-mono text-xs text-slate-600 italic">// line removed in fix</pre>
                    </div>
                  );
                }

                const isAddedOrModified = row.type === "add" || row.type === "modify";

                return (
                  <div
                    key={idx}
                    className={`flex space-x-2 leading-5 px-1.5 py-0.5 rounded transition-colors ${
                      isAddedOrModified
                        ? "bg-emerald-950/60 text-emerald-200 border-l-2 border-emerald-500 font-medium"
                        : "text-slate-300 hover:bg-slate-900/50"
                    }`}
                  >
                    <span className="text-slate-600 select-none w-6 text-right shrink-0 font-mono text-[11px]">
                      {row.fixedLineNum}
                    </span>
                    <span className="w-3 text-center shrink-0 select-none font-bold">
                      {isAddedOrModified ? <span className="text-emerald-400">+</span> : " "}
                    </span>
                    <pre className="whitespace-pre wrap-break font-mono text-xs">{row.fixedContent || " "}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unified Diff View */}
      {viewMode === "unified" && (
        <div className="bg-slate-950 p-4 font-mono text-xs overflow-y-auto min-h-[300px] max-h-[600px]">
          <div className="space-y-1">
            {rows.map((row, idx) => {
              if (row.type === "same") {
                return (
                  <div key={idx} className="flex space-x-3 text-slate-400 leading-5 hover:bg-slate-900/40 px-2 py-0.5 rounded">
                    <span className="text-slate-600 w-6 text-right shrink-0 select-none">{row.fixedLineNum}</span>
                    <span className="text-slate-600 w-3 text-center shrink-0 select-none">&nbsp;</span>
                    <pre className="whitespace-pre wrap-break font-mono text-xs">{row.fixedContent || " "}</pre>
                  </div>
                );
              }

              if (row.type === "modify") {
                return (
                  <React.Fragment key={idx}>
                    <div className="flex space-x-3 bg-rose-950/60 text-rose-200 leading-5 px-2 py-0.5 rounded border-l-2 border-rose-500">
                      <span className="text-rose-400/70 w-6 text-right shrink-0 select-none">{row.origLineNum}</span>
                      <span className="text-rose-400 font-bold w-3 text-center shrink-0 select-none">-</span>
                      <pre className="whitespace-pre wrap-break font-mono text-xs">{row.origContent || " "}</pre>
                    </div>
                    <div className="flex space-x-3 bg-emerald-950/60 text-emerald-200 leading-5 px-2 py-0.5 rounded border-l-2 border-emerald-500">
                      <span className="text-emerald-400/70 w-6 text-right shrink-0 select-none">{row.fixedLineNum}</span>
                      <span className="text-emerald-400 font-bold w-3 text-center shrink-0 select-none">+</span>
                      <pre className="whitespace-pre wrap-break font-mono text-xs">{row.fixedContent || " "}</pre>
                    </div>
                  </React.Fragment>
                );
              }

              if (row.type === "delete") {
                return (
                  <div key={idx} className="flex space-x-3 bg-rose-950/60 text-rose-200 leading-5 px-2 py-0.5 rounded border-l-2 border-rose-500">
                    <span className="text-rose-400/70 w-6 text-right shrink-0 select-none">{row.origLineNum}</span>
                    <span className="text-rose-400 font-bold w-3 text-center shrink-0 select-none">-</span>
                    <pre className="whitespace-pre wrap-break font-mono text-xs">{row.origContent || " "}</pre>
                  </div>
                );
              }

              if (row.type === "add") {
                return (
                  <div key={idx} className="flex space-x-3 bg-emerald-950/60 text-emerald-200 leading-5 px-2 py-0.5 rounded border-l-2 border-emerald-500">
                    <span className="text-emerald-400/70 w-6 text-right shrink-0 select-none">{row.fixedLineNum}</span>
                    <span className="text-emerald-400 font-bold w-3 text-center shrink-0 select-none">+</span>
                    <pre className="whitespace-pre wrap-break font-mono text-xs">{row.fixedContent || " "}</pre>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Fixed Code Only Mode */}
      {viewMode === "fixed-only" && (
        <div className="bg-slate-950 p-4 font-mono text-xs overflow-y-auto max-h-[600px]">
          <div className="flex items-center space-x-2 pb-2 mb-3 border-b border-slate-800 text-slate-400">
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-sans font-semibold text-slate-300">Clean Corrected Source Code</span>
          </div>
          <div className="space-y-0.5">
            {fixedLines.map((line, idx) => (
              <div key={idx} className="flex space-x-3 text-slate-200 leading-5 hover:bg-slate-900 px-1 rounded">
                <span className="text-slate-600 select-none w-6 text-right shrink-0 font-mono text-[11px]">
                  {idx + 1}
                </span>
                <pre className="whitespace-pre wrap-break font-mono text-xs text-emerald-300">{line || " "}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

