import React from "react";
import { Bug, History, FileCode, HelpCircle, Code2, Upload, BrainCircuit, BarChart2, Keyboard, Save, UserCheck, Shield } from "lucide-react";
import { ActiveTab, UserProfile } from "../types";

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenHistory: () => void;
  onOpenFormatInfo: () => void;
  onSelectPresetModal: () => void;
  onOpenShortcuts: () => void;
  historyCount: number;
  isAnalyzing: boolean;
  autoSaveTime?: string | null;
  currentUser?: UserProfile | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenHistory,
  onOpenFormatInfo,
  onSelectPresetModal,
  onOpenShortcuts,
  historyCount,
  isAnalyzing,
  autoSaveTime,
  currentUser,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Tag */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bug className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">
                CodeFix<span className="text-cyan-400 font-extrabold">AI</span>
              </span>
              </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              Built By Saranaeswar   Team : 9
              
            </p>
          </div>
        </div>

        {/* Center Module Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-950 p-1 border border-slate-800 rounded-xl">
          <TabButton
            active={activeTab === "code-editor"}
            onClick={() => onSelectTab("code-editor")}
            icon={Code2}
            label="Live Code Fixer"
          />
          <TabButton
            active={activeTab === "data-upload"}
            onClick={() => onSelectTab("data-upload")}
            icon={Upload}
            label="Data Upload"
          />
          <TabButton
            active={activeTab === "bug-prediction"}
            onClick={() => onSelectTab("bug-prediction")}
            icon={BrainCircuit}
            label="Bug Prediction"
          />
          <TabButton
            active={activeTab === "results-reports"}
            onClick={() => onSelectTab("results-reports")}
            icon={BarChart2}
            label="Results & Reports"
          />
          <TabButton
            active={activeTab === "user-management"}
            onClick={() => onSelectTab("user-management")}
            icon={UserCheck}
            label="User Auth & Profile"
          />
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* User Account Quick Badge */}
          <button
            onClick={() => onSelectTab("user-management")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeTab === "user-management"
                ? "bg-emerald-500 text-slate-950 border-emerald-400"
                : "bg-slate-950 hover:bg-slate-800 text-emerald-400 border-emerald-800/80"
            }`}
            title="Manage User Account & Supabase Profile"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {currentUser ? currentUser.fullName.split(" ")[0] : "Sign In / Profile"}
            </span>
          </button>

          {/* Auto-Save Indicator Badge */}
          {autoSaveTime && (
            <div
              className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-lg text-[11px] font-mono shadow-sm"
              title="Draft prediction session report is auto-saved to local storage every 30 seconds"
            >
              <Save className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Auto-Saved</span>
            </div>
          )}

          {/* Shortcuts Guide Button */}
          <button
            onClick={onOpenShortcuts}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-cyan-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Keyboard shortcuts guide (Ctrl+K or ?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Shortcuts</span>
            <kbd className="hidden md:inline-block px-1 py-0.2 bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-400 rounded">
              ?
            </kbd>
          </button>

          {/* Preset Samples */}
          <button
            onClick={onSelectPresetModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Load sample buggy code snippets"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Snippets</span>
          </button>

          {/* History Drawer Toggle */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-cyan-500 text-slate-950 font-bold text-[10px] rounded-full">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Tabs Sub-Bar */}
      <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-3 py-2 flex items-center justify-around text-xs overflow-x-auto space-x-1">
        <TabButton active={activeTab === "code-editor"} onClick={() => onSelectTab("code-editor")} icon={Code2} label="Code Fixer" />
        <TabButton active={activeTab === "data-upload"} onClick={() => onSelectTab("data-upload")} icon={Upload} label="Upload" />
        <TabButton active={activeTab === "bug-prediction"} onClick={() => onSelectTab("bug-prediction")} icon={BrainCircuit} label="Prediction" />
        <TabButton active={activeTab === "results-reports"} onClick={() => onSelectTab("results-reports")} icon={BarChart2} label="Reports" />
        <TabButton active={activeTab === "user-management"} onClick={() => onSelectTab("user-management")} icon={UserCheck} label="Account" />
      </div>
    </header>
  );
};


const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
      active
        ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-950"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);