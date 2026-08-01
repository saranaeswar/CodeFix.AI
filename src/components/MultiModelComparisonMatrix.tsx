import React, { useState } from "react";
import {
  Trophy,
  GitCompare,
  Layers,
  Bug,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Search,
  Filter,
  ArrowRightLeft,
  Sparkles,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { MultiModelPrediction, SoftwareModuleRow } from "../types";

interface MultiModelComparisonMatrixProps {
  multiModelResults: MultiModelPrediction[];
  selectedPrimaryModel: string;
  onSelectPrimaryModel: (modelName: string) => void;
  onOpenCodeEditorWithSnippet?: (code: string, moduleName: string) => void;
}

export const MultiModelComparisonMatrix: React.FC<MultiModelComparisonMatrixProps> = ({
  multiModelResults,
  selectedPrimaryModel,
  onSelectPrimaryModel,
  onOpenCodeEditorWithSnippet,
}) => {
  const [searchFilter, setSearchFilter] = useState("");
  const [disagreementOnly, setDisagreementOnly] = useState(false);
  const [selectedMetricView, setSelectedMetricView] = useState<"f1Score" | "accuracy" | "precision" | "recall" | "rocAuc">("f1Score");

  if (!multiModelResults || multiModelResults.length === 0) {
    return null;
  }

  // Find top performing model based on selected metric
  const sortedModels = [...multiModelResults].sort(
    (a, b) => (b.metrics[selectedMetricView] || 0) - (a.metrics[selectedMetricView] || 0)
  );
  const topModelName = sortedModels[0]?.modelName;

  // Extract list of modules from first model result
  const firstModelItems = multiModelResults[0].items || [];

  // Map module rows with prediction across all models
  const moduleComparisonRows = firstModelItems.map((item) => {
    const predictionsByModel: Record<string, { label: "Buggy" | "Non-Buggy"; prob: number; risk: string }> = {};
    let buggyVoteCount = 0;

    multiModelResults.forEach((modelRes) => {
      const match = modelRes.items.find((m) => m.id === item.id);
      if (match) {
        predictionsByModel[modelRes.modelName] = {
          label: match.predictedLabel,
          prob: match.bugProbability,
          risk: match.riskLevel,
        };
        if (match.predictedLabel === "Buggy") {
          buggyVoteCount++;
        }
      }
    });

    const totalModels = multiModelResults.length;
    const isUnanimous = buggyVoteCount === 0 || buggyVoteCount === totalModels;
    const isDisagreement = !isUnanimous;

    return {
      id: item.id,
      moduleName: item.moduleName,
      loc: item.loc,
      cyclomaticComplexity: item.cyclomaticComplexity,
      predictionsByModel,
      buggyVoteCount,
      totalModels,
      isDisagreement,
      sampleCode: item.sampleCode,
    };
  });

  // Filter modules
  const filteredModules = moduleComparisonRows.filter((mod) => {
    const matchesSearch = mod.moduleName.toLowerCase().includes(searchFilter.toLowerCase());
    if (disagreementOnly) {
      return matchesSearch && mod.isDisagreement;
    }
    return matchesSearch;
  });

  const disagreementCount = moduleComparisonRows.filter((m) => m.isDisagreement).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full flex items-center space-x-1">
                <GitCompare className="w-3 h-3 text-cyan-400" />
                <span>Side-by-Side ML Multi-Model Benchmark</span>
              </span>
              <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-[10px] font-mono">
                {multiModelResults.length} Algorithms Evaluated
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Simultaneous Machine Learning Model Accuracy & Prediction Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Compare classification metrics (Accuracy, F1-Score, Precision, Recall) across Random Forest, Neural Networks, XGBoost, Decision Trees, and Logistic Regression on the exact same software metrics dataset.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 shrink-0">
            <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Performing Model</span>
              <span className="text-xs font-bold text-amber-300 font-mono">{topModelName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Performance Comparison Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Algorithm Performance Leaderboard</span>
          </h3>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 border border-slate-800 rounded-lg text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Sort Metric:</span>
            {(["f1Score", "accuracy", "precision", "recall", "rocAuc"] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetricView(metric)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer uppercase ${
                  selectedMetricView === metric
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {metric === "f1Score" ? "F1-Score" : metric === "rocAuc" ? "ROC-AUC" : metric}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {sortedModels.map((modelRes, index) => {
            const isTop = modelRes.modelName === topModelName;
            const isSelectedPrimary = modelRes.modelName === selectedPrimaryModel;

            return (
              <div
                key={modelRes.modelName}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative ${
                  isSelectedPrimary
                    ? "bg-indigo-950/80 border-cyan-400/80 ring-2 ring-cyan-500/30 shadow-xl"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                {isTop && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-full shadow-md flex items-center space-x-1">
                    <Trophy className="w-3 h-3 text-slate-950" />
                    <span>Rank #1</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold"># {index + 1}</span>
                      {isSelectedPrimary && (
                        <span className="text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded">
                          Active Target
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white truncate" title={modelRes.modelName}>
                      {modelRes.modelName}
                    </h4>
                  </div>

                  {/* Primary Highlight Metric */}
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {selectedMetricView === "f1Score"
                        ? "F1-Score"
                        : selectedMetricView === "accuracy"
                        ? "Accuracy"
                        : selectedMetricView === "precision"
                        ? "Precision"
                        : selectedMetricView === "recall"
                        ? "Recall"
                        : "ROC-AUC"}
                    </span>
                    <span className="text-xl font-black font-mono text-cyan-400">
                      {modelRes.metrics[selectedMetricView]}%
                    </span>
                  </div>

                  {/* Mini metrics list */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300">
                    <div className="p-1.5 bg-slate-950/60 rounded border border-slate-800/80">
                      <span className="text-slate-500 block">Acc</span>
                      <span className="font-bold text-slate-200">{modelRes.metrics.accuracy}%</span>
                    </div>
                    <div className="p-1.5 bg-slate-950/60 rounded border border-slate-800/80">
                      <span className="text-slate-500 block">F1</span>
                      <span className="font-bold text-slate-200">{modelRes.metrics.f1Score}%</span>
                    </div>
                    <div className="p-1.5 bg-slate-950/60 rounded border border-slate-800/80">
                      <span className="text-slate-500 block">Prec</span>
                      <span className="font-bold text-slate-200">{modelRes.metrics.precision}%</span>
                    </div>
                    <div className="p-1.5 bg-slate-950/60 rounded border border-slate-800/80">
                      <span className="text-slate-500 block">Recall</span>
                      <span className="font-bold text-slate-200">{modelRes.metrics.recall}%</span>
                    </div>
                  </div>

                  {/* Predictions Count */}
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                    <span className="text-rose-400 font-bold">{modelRes.buggyCount} Buggy</span>
                    <span className="text-emerald-400 font-bold">{modelRes.nonBuggyCount} Clean</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectPrimaryModel(modelRes.modelName)}
                  className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelectedPrimary
                      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                  }`}
                >
                  {isSelectedPrimary ? "Selected Target" : "Set Primary"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module-by-Module Side-by-Side Consensus & Disagreement Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Module-by-Module Side-by-Side Prediction Matrix</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect how each algorithm classified individual software components side-by-side. Spot model disagreements and consensus predictions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search module name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Disagreement Filter Toggle */}
            <button
              onClick={() => setDisagreementOnly(!disagreementOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 transition-all cursor-pointer ${
                disagreementOnly
                  ? "bg-amber-950/80 text-amber-300 border-amber-500 shadow-md"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${disagreementOnly ? "text-amber-400" : "text-slate-500"}`} />
              <span>Show Disagreements Only ({disagreementCount})</span>
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-sans font-bold">
              <tr>
                <th className="px-4 py-3 min-w-[180px]">Module Name</th>
                <th className="px-3 py-3 w-28">Consensus Status</th>
                {multiModelResults.map((m) => (
                  <th key={m.modelName} className="px-3 py-3 text-center min-w-[130px]">
                    <span className="block font-bold text-slate-200">{m.modelName}</span>
                    <span className="text-[9px] text-slate-500 font-mono font-normal">F1: {m.metrics.f1Score}%</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
              {filteredModules.map((mod) => (
                <tr key={mod.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-4 py-3 font-sans font-semibold text-slate-200">
                    <div className="truncate max-w-[180px]" title={mod.moduleName}>
                      {mod.moduleName}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      LOC: {mod.loc} | Cyc: {mod.cyclomaticComplexity}
                    </span>
                  </td>

                  {/* Consensus Badge */}
                  <td className="px-3 py-3 font-sans">
                    {mod.isDisagreement ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 inline-flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>
                          {mod.buggyVoteCount}/{mod.totalModels} Split
                        </span>
                      </span>
                    ) : mod.buggyVoteCount === mod.totalModels ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/30 inline-flex items-center space-x-1">
                        <Bug className="w-3 h-3 text-rose-400" />
                        <span>Full Buggy</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 inline-flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Full Clean</span>
                      </span>
                    )}
                  </td>

                  {/* Side-by-Side Model Columns */}
                  {multiModelResults.map((m) => {
                    const pred = mod.predictionsByModel[m.modelName];
                    if (!pred) return <td key={m.modelName} className="px-3 py-3 text-center">--</td>;

                    const isBuggy = pred.label === "Buggy";
                    return (
                      <td key={m.modelName} className="px-3 py-3 text-center">
                        <div
                          className={`p-1.5 rounded-lg border text-center transition-all ${
                            isBuggy
                              ? "bg-rose-950/40 border-rose-800/80 text-rose-300"
                              : "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase block">{pred.label}</span>
                          <span className="text-[11px] font-mono font-black">{pred.prob}%</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
