import React, { useState } from "react";
import { HistoryItem } from "../types";
import { X, History, Bug, CheckCircle2, Search, Trash2, ArrowRight } from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "BUG_FOUND" | "NO_BUG">("ALL");

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.language.toLowerCase().includes(search.toLowerCase()) ||
      item.explanation.toLowerCase().includes(search.toLowerCase()) ||
      item.originalCode.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || item.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 h-full border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Analysis History</h2>
            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full font-mono">
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, explanation, or language..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex space-x-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                  filterStatus === "ALL" ? "bg-slate-800 text-white" : "text-slate-400"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("BUG_FOUND")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                  filterStatus === "BUG_FOUND" ? "bg-amber-950 text-amber-300 border border-amber-800/50" : "text-slate-400"
                }`}
              >
                Bugs
              </button>
              <button
                onClick={() => setFilterStatus("NO_BUG")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                  filterStatus === "NO_BUG" ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50" : "text-slate-400"
                }`}
              >
                Clean
              </button>
            </div>

            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-slate-400 hover:text-red-400 text-xs flex items-center space-x-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* History Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
              <p>No history entries found.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {item.status === "BUG_FOUND" ? (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-700/60 rounded-full">
                        <Bug className="w-3 h-3" />
                        <span>BUG_FOUND</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>NO_BUG</span>
                      </span>
                    )}
                    <span className="text-xs font-semibold text-cyan-300">
                      {item.language}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 font-sans leading-relaxed">
                  {item.explanation}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 group-hover:text-indigo-400 transition-colors">
                  <span className="font-mono text-[10px] truncate max-w-[200px]">
                    {item.originalCode.split("\n")[0]}...
                  </span>
                  <span className="flex items-center space-x-1 font-medium">
                    <span>Load</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
