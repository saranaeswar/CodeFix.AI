import React from "react";
import { Command, X, Keyboard, Zap, Sparkles } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: "Navigation" | "Actions" | "Export & Reporting";
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  {
    keys: ["Ctrl", "1"],
    description: "Switch to Live Code Auto-Fixer Tab",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "2"],
    description: "Switch to Data Upload Tab",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "3"],
    description: "Switch to Bug Prediction Tab",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "4"],
    description: "Switch to Results & Reports Tab",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "H"],
    description: "Toggle Code Fix History Drawer",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "K"],
    description: "Open Keyboard Shortcuts Guide",
    category: "Navigation",
  },
  {
    keys: ["Esc"],
    description: "Close active modal or drawer",
    category: "Navigation",
  },

  // Actions
  {
    keys: ["Ctrl", "Enter"],
    description: "Run Code Analysis & Auto-Fix (Code Fixer) / Run ML Prediction (Bug Prediction)",
    category: "Actions",
  },
  {
    keys: ["Alt", "P"],
    description: "Open Bug Preset Code Snippets",
    category: "Actions",
  },

  // Export & Reporting
  {
    keys: ["Ctrl", "S"],
    description: "Export Analytics Report to PDF Format",
    category: "Export & Reporting",
  },
  {
    keys: ["Ctrl", "Shift", "S"],
    description: "Export Results to CSV Format",
    category: "Export & Reporting",
  },
  {
    keys: ["Ctrl", "P"],
    description: "Print / Save PDF Report View",
    category: "Export & Reporting",
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const categories = ["Navigation", "Actions", "Export & Reporting"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Power User Keyboard Shortcuts</span>
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800 rounded-full">
                  Shortcuts Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Use these hotkeys anywhere in CodeFix AI to accelerate your debugging workflow.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Grouped by Category */}
        <div className="space-y-5">
          {categories.map((cat) => {
            const group = SHORTCUTS.filter((s) => s.category === cat);
            return (
              <div key={cat} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  {cat}
                </h3>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
                  {group.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2.5 flex items-center justify-between space-x-4 text-xs hover:bg-slate-900/50 transition-colors"
                    >
                      <span className="text-slate-300 font-medium">{item.description}</span>
                      <div className="flex items-center space-x-1 shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            {kIdx > 0 && <span className="text-slate-600 font-mono text-[10px]">+</span>}
                            <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md font-mono text-[11px] font-bold text-slate-200 shadow-sm">
                              {k === "Ctrl" && navigator.platform.includes("Mac") ? "⌘" : k}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1 text-slate-500 font-mono text-[11px]">
            <Command className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">?</kbd> anytime to open this menu</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
