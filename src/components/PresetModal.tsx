import React from "react";
import { BugPreset } from "../types";
import { BUG_PRESETS } from "../data/presets";
import { X, FileCode, Bug, CheckCircle2, ArrowRight } from "lucide-react";

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: BugPreset) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Select Sample Code Snippet
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset List Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {BUG_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all space-y-2 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-full">
                    {preset.language}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      preset.category === "No Bug (Clean Code)"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-amber-950 text-amber-300 border border-amber-800"
                    }`}
                  >
                    {preset.category}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {preset.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 group-hover:text-indigo-400 font-medium">
                <span className="font-mono text-[10px]">{preset.code.split("\n")[0]}...</span>
                <span className="flex items-center space-x-1">
                  <span>Load into Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
