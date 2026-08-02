import React, { useState, useEffect } from "react";
import {
  CodeFixResult,
  HistoryItem,
  BugPreset,
  ActiveTab,
  SoftwareModuleRow,
  PredictionSessionReport,
  UserProfile,
} from "./types";
import { SAMPLE_DATASETS } from "./data/sampleDatasets";
import { Navbar } from "./components/Navbar";
import { TypewriterCredit } from "./components/TypewriterCredit";
import { CodeEditor } from "./components/CodeEditor";
import { AnalysisResultView } from "./components/AnalysisResultView";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { FormatInfoModal } from "./components/FormatInfoModal";
import { PresetModal } from "./components/PresetModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { DataUploadModule } from "./components/DataUploadModule";
import { BugPredictionModule } from "./components/BugPredictionModule";
import { ResultsReportModule } from "./components/ResultsReportModule";
import { UserManagementModule } from "./components/UserManagementModule";
import { getStoredLocalUser } from "./lib/supabase";
import { Sparkles, Terminal, Code2, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("code-editor");

  // User Management state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getStoredLocalUser();
  });

  // Code Editor state
  const [code, setCode] = useState<string>("");
  const [languageHint, setLanguageHint] = useState<string>("Auto-Detect");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<CodeFixResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dataset & Prediction state (Modules 2, 3, 4)
  const [dataset, setDataset] = useState<SoftwareModuleRow[] | null>(SAMPLE_DATASETS[0].modules);
  const [datasetName, setDatasetName] = useState<string | null>(SAMPLE_DATASETS[0].fileName);
  const [predictionReport, setPredictionReport] = useState<PredictionSessionReport | null>(null);
  const [savedReports, setSavedReports] = useState<PredictionSessionReport[]>([]);
  const [autoSaveTime, setAutoSaveTime] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isFormatInfoOpen, setIsFormatInfoOpen] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts listener for power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Escape key closes open modals or drawers
      if (e.key === "Escape") {
        setIsShortcutsOpen(false);
        setIsHistoryOpen(false);
        setIsFormatInfoOpen(false);
        setIsPresetModalOpen(false);
        return;
      }

      // Ctrl+K / Cmd+K or '?' (when not typing) opens Shortcuts modal
      if (((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) || (!isTyping && e.key === "?")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Ctrl+H / Cmd+H toggles History Drawer
      if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
        return;
      }

      // Tab Navigation Shortcuts: Ctrl+1..4 or Alt+1..4 or Cmd+1..4
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          setActiveTab("code-editor");
          return;
        }
        if (e.key === "2") {
          e.preventDefault();
          setActiveTab("data-upload");
          return;
        }
        if (e.key === "3") {
          e.preventDefault();
          setActiveTab("bug-prediction");
          return;
        }
        if (e.key === "4") {
          e.preventDefault();
          setActiveTab("results-reports");
          return;
        }
        if (e.key === "5") {
          e.preventDefault();
          setActiveTab("user-management");
          return;
        }
      }

      // Alt+P opens Bug Presets Modal
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setIsPresetModalOpen(true);
        return;
      }

      // Ctrl+S / Cmd+S export report shortcut
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (activeTab === "results-reports") {
          const pdfBtn = document.getElementById("pdf-export-button");
          if (pdfBtn) {
            pdfBtn.click();
          }
        }
        return;
      }

      // Ctrl+Enter / Cmd+Enter execution shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (activeTab === "code-editor") {
          if (!isAnalyzing && code.trim()) {
            e.preventDefault();
            handleAnalyze(languageHint !== "Auto-Detect" ? languageHint : undefined);
          }
        } else if (activeTab === "bug-prediction") {
          const runPredBtn = document.getElementById("run-prediction-button");
          if (runPredBtn) {
            e.preventDefault();
            runPredBtn.click();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, languageHint, isAnalyzing, activeTab]);

  // Load history, saved reports & draft report from localStorage on mount
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem("codefix_history");
      if (savedHist) {
        setHistory(JSON.parse(savedHist));
      }
      const savedReps = localStorage.getItem("codefix_prediction_reports");
      if (savedReps) {
        setSavedReports(JSON.parse(savedReps));
      }
      const savedDraft = localStorage.getItem("codefix_prediction_draft");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.report) {
          setPredictionReport(parsed.report);
          setIsDraftRestored(true);
          if (parsed.savedAt) {
            setAutoSaveTime(new Date(parsed.savedAt).toLocaleTimeString());
          }
        }
      }
    } catch (e) {
      console.error("Failed to load history or saved reports", e);
    }
  }, []);

  // 30-Second Auto-Save Interval Effect for Prediction Session Draft
  useEffect(() => {
    const saveDraftNow = () => {
      if (predictionReport) {
        try {
          const now = new Date();
          const timeStr = now.toLocaleTimeString();
          const draftPayload = {
            report: predictionReport,
            savedAt: now.toISOString(),
            datasetName: datasetName || predictionReport.datasetName,
          };
          localStorage.setItem("codefix_prediction_draft", JSON.stringify(draftPayload));
          setAutoSaveTime(timeStr);
        } catch (e) {
          console.error("Failed to auto-save prediction session draft", e);
        }
      }
    };

    // Trigger initial draft save if report exists
    if (predictionReport && !autoSaveTime) {
      saveDraftNow();
    }

    // Interval every 30 seconds (30,000ms)
    const interval = setInterval(() => {
      saveDraftNow();
    }, 30000);

    return () => clearInterval(interval);
  }, [predictionReport, datasetName]);

  // Save history to localStorage
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("codefix_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const handleDatasetLoaded = (rows: SoftwareModuleRow[], name: string) => {
    setDataset(rows);
    setDatasetName(name);
  };

  const handleRemoveDataset = () => {
    setDataset(null);
    setDatasetName(null);
    setPredictionReport(null);
    try {
      localStorage.removeItem("codefix_prediction_draft");
      setAutoSaveTime(null);
    } catch (e) {
      console.error("Failed to remove draft", e);
    }
  };

  const handlePredictionComplete = (report: PredictionSessionReport) => {
    setPredictionReport(report);
    const updated = [report, ...savedReports.slice(0, 9)];
    setSavedReports(updated);
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setAutoSaveTime(timeStr);
    try {
      localStorage.setItem("codefix_prediction_reports", JSON.stringify(updated));
      localStorage.setItem(
        "codefix_prediction_draft",
        JSON.stringify({
          report,
          savedAt: now.toISOString(),
          datasetName: datasetName || report.datasetName,
        })
      );
    } catch (e) {
      console.error("Failed to save prediction report or draft", e);
    }
  };

  const handleOpenCodeEditorWithSnippet = (snippetCode: string, moduleName: string) => {
    setCode(snippetCode);
    setActiveTab("code-editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnalyze = async (langHint?: string) => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          languageHint: langHint && langHint !== "Auto-Detect" ? langHint : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze code.");
      }

      const newResult: CodeFixResult = {
        success: true,
        language: data.language,
        status: data.status,
        explanation: data.explanation,
        code: data.code,
        originalCode: data.originalCode,
        rawOutput: data.rawOutput,
        timestamp: data.timestamp,
        id: "res-" + Date.now(),
      };

      setResult(newResult);

      // Append to history
      const historyItem: HistoryItem = {
        ...newResult,
        id: "hist-" + Date.now(),
        snippetTitle: `${data.language} (${data.status})`,
      };

      saveHistory([historyItem, ...history.slice(0, 29)]); // keep last 30
    } catch (err: any) {
      console.error("Analyze error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToEditor = (fixedCode: string) => {
    setCode(fixedCode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectPreset = (preset: BugPreset) => {
    setCode(preset.code);
    setLanguageHint(preset.language);
    setResult(null);
    setErrorMsg(null);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setCode(item.originalCode);
    setLanguageHint(item.language);
    setResult(item);
    setErrorMsg(null);
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFormatInfo={() => setIsFormatInfoOpen(true)}
        onSelectPresetModal={() => setIsPresetModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        historyCount={history.length}
        isAnalyzing={isAnalyzing}
        autoSaveTime={autoSaveTime}
        currentUser={currentUser}
      />

      

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Restored Draft Notification Banner */}
        {isDraftRestored && (
          <div className="bg-emerald-950/80 border border-emerald-800/90 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-emerald-200 shadow-lg animate-fadeIn">
            <div className="flex items-center space-x-2.5">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span>
                <strong>Draft Restored:</strong> Your active prediction session report draft was auto-saved and restored from local storage {autoSaveTime ? `(Last saved at ${autoSaveTime})` : ""}.
              </span>
            </div>
            <button
              onClick={() => setIsDraftRestored(false)}
              className="text-emerald-400 hover:text-white font-mono text-[11px] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Animated Active Tab Content with Fading Scale Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Module Tab 1: Live Code Auto-Fixer */}
            {activeTab === "code-editor" && (
              <div className="space-y-6">
                {/* Banner Section */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                        <span>CodeFix AI Debugging & Auto-Fix System</span>
                      </h1>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                        Paste any source code (Python, JS, C++, Java, Rust, SQL, etc.). CodeFix AI scans line-by-line for syntax, runtime, or logical errors, and returns a verified auto-fixed version.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsPresetModalOpen(true)}
                      className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Explore Bug Snippets</span>
                    </button>
                  </div>
                </div>

                {/* Main Grid: Code Editor (Left/Top) & Analysis Results (Right/Bottom) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Input Editor Column */}
                  <div className="lg:col-span-6 flex flex-col h-[580px]">
                    <CodeEditor
                      code={code}
                      onChange={setCode}
                      onAnalyze={handleAnalyze}
                      isAnalyzing={isAnalyzing}
                      selectedLanguageHint={languageHint}
                      onLanguageHintChange={setLanguageHint}
                      onOpenPresets={() => setIsPresetModalOpen(true)}
                      errorMsg={errorMsg}
                    />
                  </div>

                  {/* Analysis Result / Output Column */}
                  <div className="lg:col-span-6">
                    {result ? (
                      <AnalysisResultView
                        result={result}
                        onApplyToEditor={handleApplyToEditor}
                      />
                    ) : (
                      <div className="h-[580px] bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner text-cyan-400">
                          <Terminal className="w-8 h-8 stroke-1" />
                        </div>
                        <div className="max-w-sm space-y-2">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Awaiting Analysis
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Paste your code on the left and click <span className="text-cyan-400 font-semibold">Analyze & Auto-Fix</span>. CodeFix AI will run diagnostic checks and display the precise bug report and auto-corrected code.
                          </p>
                        </div>

                        <div className="pt-4 flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Supports 15+ Languages • Automatic Syntax & Logic Diagnostics</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Module Tab 2: Data Upload & Quality Validation */}
            {activeTab === "data-upload" && (
              <DataUploadModule
                dataset={dataset}
                datasetName={datasetName}
                onDatasetLoaded={handleDatasetLoaded}
                onRemoveDataset={handleRemoveDataset}
                onProceedToPrediction={() => setActiveTab("bug-prediction")}
              />
            )}

            {/* Module Tab 3: Bug Prediction Module */}
            {activeTab === "bug-prediction" && (
              <BugPredictionModule
                dataset={dataset}
                onPredictionComplete={handlePredictionComplete}
                onOpenCodeEditorWithSnippet={handleOpenCodeEditorWithSnippet}
                onProceedToReports={() => setActiveTab("results-reports")}
              />
            )}

            {/* Module Tab 4: Results & Report Module */}
            {activeTab === "results-reports" && (
              <ResultsReportModule
                report={predictionReport}
                savedReports={savedReports}
              />
            )}

            {/* Module Tab 5: User Management Module (Supabase Auth & Profile) */}
            {activeTab === "user-management" && (
              <UserManagementModule
                onUserSessionChange={setCurrentUser}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 mt-auto text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} CodeFix AI • AI Defect Suite & ML Software Defect Predictor</p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab("data-upload")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Data Upload
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab("bug-prediction")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Bug Prediction
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab("results-reports")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Analytics & Reports
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab("user-management")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              User Auth & Profile
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      <FormatInfoModal
        isOpen={isFormatInfoOpen}
        onClose={() => setIsFormatInfoOpen(false)}
      />

      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}