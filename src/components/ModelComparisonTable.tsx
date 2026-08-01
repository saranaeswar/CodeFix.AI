import React, { useState } from "react";
import { ModelPerformanceMetrics } from "../types";
import {
  Award,
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  ArrowUpDown,
  Check,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Search,
} from "lucide-react";

interface ModelComparisonTableProps {
  allModelMetrics: ModelPerformanceMetrics[];
  selectedModelView: string;
  onSelectModelView: (modelName: string) => void;
}

type SortField = "modelName" | "accuracy" | "precision" | "recall" | "f1Score" | "rocAuc";

export const ModelComparisonTable: React.FC<ModelComparisonTableProps> = ({
  allModelMetrics,
  selectedModelView,
  onSelectModelView,
}) => {
  const [sortField, setSortField] = useState<SortField>("f1Score");
  const [sortAscending, setSortAscending] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!allModelMetrics || allModelMetrics.length === 0) {
    return null;
  }

  // Find best performing metrics across all models for highlighting
  const maxAccuracy = Math.max(...allModelMetrics.map((m) => m.accuracy));
  const maxPrecision = Math.max(...allModelMetrics.map((m) => m.precision));
  const maxRecall = Math.max(...allModelMetrics.map((m) => m.recall));
  const maxF1 = Math.max(...allModelMetrics.map((m) => m.f1Score));
  const maxRocAuc = Math.max(...allModelMetrics.map((m) => m.rocAuc || 0.90));

  // Sorting logic
  const sortedMetrics = [...allModelMetrics]
    .filter((m) => m.modelName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let valA: number | string = a[sortField] ?? 0;
      let valB: number | string = b[sortField] ?? 0;

      if (sortField === "modelName") {
        return sortAscending
          ? a.modelName.localeCompare(b.modelName)
          : b.modelName.localeCompare(a.modelName);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortAscending ? valA - valB : valB - valA;
      }
      return 0;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(false);
    }
  };

  const getModelDescription = (modelName: string) => {
    switch (modelName) {
      case "Random Forest":
        return {
          archetype: "Ensemble Trees",
          badge: "Recommended",
          badgeBg: "bg-cyan-950 text-cyan-300 border-cyan-800",
          bestFor: "Best overall balance between low false positives and high defect coverage.",
        };
      case "Neural Network (MLP)":
        return {
          archetype: "Deep Learning",
          badge: "Non-Linear",
          badgeBg: "bg-purple-950 text-purple-300 border-purple-800",
          bestFor: "Captures non-linear metric interactions across complex microservices.",
        };
      case "XGBoost Classifier":
        return {
          archetype: "Gradient Boosted",
          badge: "High Precision",
          badgeBg: "bg-emerald-950 text-emerald-300 border-emerald-800",
          bestFor: "Optimized for dense metrics datasets requiring tight decision boundaries.",
        };
      case "Gemini AI Ensemble":
        return {
          archetype: "AI Hybrid",
          badge: "AI Powered",
          badgeBg: "bg-indigo-950 text-indigo-300 border-indigo-800",
          bestFor: "Combines statistical defect thresholds with LLM heuristic code analysis.",
        };
      case "Decision Tree":
        return {
          archetype: "Rule-Based",
          badge: "Fast & Transparent",
          badgeBg: "bg-amber-950 text-amber-300 border-amber-800",
          bestFor: "Explicit rule hierarchy based directly on McCabe cyclomatic bounds.",
        };
      case "Logistic Regression":
        return {
          archetype: "Linear Model",
          badge: "Baseline",
          badgeBg: "bg-slate-800 text-slate-300 border-slate-700",
          bestFor: "Fast statistical benchmark suited for simple linear metric relationships.",
        };
      default:
        return {
          archetype: "Classification",
          badge: "ML Model",
          badgeBg: "bg-slate-800 text-slate-300 border-slate-700",
          bestFor: "General-purpose software defect prediction algorithm.",
        };
    };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Machine Learning Model Side-by-Side Comparative Performance Table
            </h3>
            <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-[10px] font-mono font-bold">
              {allModelMetrics.length} Algorithms Evaluated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Compare key ML statistical metrics across all evaluated classifiers. Select any row to set it as the active model for confusion matrix breakdown and decision report generation.
          </p>
        </div>

        {/* Search & Quick Action Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter model name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500 w-44 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Peak Accuracy</span>
            <span className="text-sm font-bold text-cyan-400">{maxAccuracy}%</span>
          </div>
          <Award className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Peak Precision</span>
            <span className="text-sm font-bold text-emerald-400">{maxPrecision}%</span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Peak Recall</span>
            <span className="text-sm font-bold text-indigo-400">{maxRecall}%</span>
          </div>
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>

        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Peak F1-Score</span>
            <span className="text-sm font-bold text-purple-400">{maxF1}%</span>
          </div>
          <BrainCircuit className="w-4 h-4 text-purple-400" />
        </div>
      </div>

      {/* Side-by-side Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800 select-none">
            <tr>
              <th className="p-3">Model Classifier & Type</th>

              <th
                onClick={() => handleSort("accuracy")}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Accuracy</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort("precision")}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Precision</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort("recall")}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Recall</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort("f1Score")}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>F1-Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort("rocAuc")}
                className="p-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>ROC-AUC</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th className="p-3">Confusion Breakdown</th>
              <th className="p-3">Primary Best Fit Recommendation</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80 font-sans">
            {sortedMetrics.map((metric) => {
              const isSelected = selectedModelView === metric.modelName;
              const meta = getModelDescription(metric.modelName);

              const isMaxAcc = metric.accuracy === maxAccuracy;
              const isMaxPrec = metric.precision === maxPrecision;
              const isMaxRec = metric.recall === maxRecall;
              const isMaxF1 = metric.f1Score === maxF1;

              const cm = metric.confusionMatrix || { truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0 };
              const totalCM = cm.truePositive + cm.falsePositive + cm.trueNegative + cm.falseNegative || 1;
              const hitRate = Math.round((cm.truePositive / (cm.truePositive + cm.falseNegative || 1)) * 100);

              return (
                <tr
                  key={metric.modelName}
                  className={`transition-colors hover:bg-slate-900/60 ${
                    isSelected ? "bg-indigo-950/40 border-l-4 border-l-cyan-400" : ""
                  }`}
                >
                  {/* Model Name & Badges */}
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-xs">{metric.modelName}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 bg-cyan-500 text-slate-950 text-[10px] font-extrabold rounded-md uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold ${meta.badgeBg}`}>
                        {meta.badge}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{meta.archetype}</span>
                    </div>
                  </td>

                  {/* Accuracy */}
                  <td className="p-3 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs font-bold ${isMaxAcc ? "text-cyan-400" : "text-slate-200"}`}>
                        {metric.accuracy}%
                      </span>
                      {isMaxAcc && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 rounded font-sans font-bold">
                          TOP
                        </span>
                      )}
                    </div>
                    <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1 border border-slate-800">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${metric.accuracy}%` }} />
                    </div>
                  </td>

                  {/* Precision */}
                  <td className="p-3 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs font-bold ${isMaxPrec ? "text-emerald-400" : "text-slate-200"}`}>
                        {metric.precision}%
                      </span>
                      {isMaxPrec && (
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded font-sans font-bold">
                          TOP
                        </span>
                      )}
                    </div>
                    <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1 border border-slate-800">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metric.precision}%` }} />
                    </div>
                  </td>

                  {/* Recall */}
                  <td className="p-3 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs font-bold ${isMaxRec ? "text-indigo-400" : "text-slate-200"}`}>
                        {metric.recall}%
                      </span>
                      {isMaxRec && (
                        <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1 rounded font-sans font-bold">
                          TOP
                        </span>
                      )}
                    </div>
                    <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1 border border-slate-800">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${metric.recall}%` }} />
                    </div>
                  </td>

                  {/* F1-Score */}
                  <td className="p-3 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs font-bold ${isMaxF1 ? "text-purple-400" : "text-slate-200"}`}>
                        {metric.f1Score}%
                      </span>
                      {isMaxF1 && (
                        <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1 rounded font-sans font-bold">
                          BEST F1
                        </span>
                      )}
                    </div>
                    <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1 border border-slate-800">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${metric.f1Score}%` }} />
                    </div>
                  </td>

                  {/* ROC-AUC */}
                  <td className="p-3 font-mono text-xs">
                    <span className="text-slate-300 font-bold">
                      {metric.rocAuc ? metric.rocAuc.toFixed(2) : "0.92"}
                    </span>
                    <span className="block text-[9px] text-slate-500 font-sans">
                      {metric.rocAuc && metric.rocAuc > 0.9 ? "Excellent Curve" : "Good Curve"}
                    </span>
                  </td>

                  {/* Confusion Matrix Mini Summary */}
                  <td className="p-3 font-mono text-[10px]">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold" title="True Positives">
                        TP: {cm.truePositive}
                      </span>
                      <span className="text-amber-400 font-bold" title="False Positives">
                        FP: {cm.falsePositive}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-cyan-400" title="True Negatives">
                        TN: {cm.trueNegative}
                      </span>
                      <span className="text-rose-400" title="False Negatives">
                        FN: {cm.falseNegative}
                      </span>
                    </div>
                  </td>

                  {/* Best Fit Description */}
                  <td className="p-3 max-w-xs">
                    <p className="text-[11px] text-slate-300 leading-snug">{meta.bestFor}</p>
                  </td>

                  {/* Action Button */}
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectModelView(metric.modelName)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 ${
                        isSelected
                          ? "bg-cyan-500 text-slate-950 shadow-md font-extrabold"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active View</span>
                        </>
                      ) : (
                        <span>Select View</span>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
