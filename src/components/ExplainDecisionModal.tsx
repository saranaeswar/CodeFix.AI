import React, { useState } from "react";
import {
  X,
  Sparkles,
  BrainCircuit,
  Bug,
  ShieldCheck,
  AlertTriangle,
  Code2,
  ArrowRight,
  GitBranch,
  Layers,
  Wrench,
  CheckCircle2,
  Info,
  Sliders,
  BarChart2,
  HelpCircle,
} from "lucide-react";
import { PredictionResultItem, AIDecisionExplanation } from "../types";
import { generateAIDecisionExplanation } from "../utils/explainabilityEngine";

interface ExplainDecisionModalProps {
  item: PredictionResultItem | null;
  modelName?: string;
  decisionThreshold?: number;
  onClose: () => void;
  onOpenCodeEditorWithSnippet?: (code: string, moduleName: string) => void;
}

export const ExplainDecisionModal: React.FC<ExplainDecisionModalProps> = ({
  item,
  modelName = "Random Forest",
  decisionThreshold = 50,
  onClose,
  onOpenCodeEditorWithSnippet,
}) => {
  const [activeTab, setActiveTab] = useState<"ATTRIBUTION" | "DECISION_TREE" | "REFACTORING">("ATTRIBUTION");

  if (!item) return null;

  const explanation: AIDecisionExplanation = generateAIDecisionExplanation(item, modelName, decisionThreshold);
  const isBuggy = explanation.predictedLabel === "Buggy";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isBuggy
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">AI Decision Explanation</h3>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/80 rounded-full text-[10px] font-mono font-bold">
                  {explanation.modelName} Model
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Software Module: <strong className="text-slate-200">{explanation.moduleName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 space-y-6">
          {/* Classification Banner Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className={`px-4 py-3 rounded-2xl flex flex-col items-center justify-center border font-mono ${
                  isBuggy
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-lg">
                  {isBuggy ? <Bug className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  <span>{explanation.predictedLabel}</span>
                </div>
                <span className="text-[10px] uppercase font-sans tracking-wider opacity-80 mt-0.5">
                  Classification
                </span>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-300">Defect Risk Probability:</span>
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      explanation.bugProbability >= 70
                        ? "text-rose-400"
                        : explanation.bugProbability >= 40
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {explanation.bugProbability}%
                  </span>
                  <span className="text-xs text-slate-500">
                    (Decision Threshold: {explanation.decisionThreshold}%)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Primary Risk Factor: <strong className="text-amber-300 font-sans">{explanation.primaryRiskFactor}</strong>
                </p>
              </div>
            </div>

            {explanation.sampleCode && onOpenCodeEditorWithSnippet && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCodeEditorWithSnippet(explanation.sampleCode!, explanation.moduleName);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Code2 className="w-4 h-4 text-cyan-300" />
                <span>Fix Code in Live Auto-Fixer</span>
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("ATTRIBUTION")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === "ATTRIBUTION"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Metric Feature Attribution (SHAP)</span>
            </button>

            <button
              onClick={() => setActiveTab("DECISION_TREE")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === "DECISION_TREE"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>ML Inference Decision Path</span>
            </button>

            <button
              onClick={() => setActiveTab("REFACTORING")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === "REFACTORING"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>AI Refactoring Action Plan</span>
            </button>
          </div>

          {/* TAB 1: Metric Feature Attribution (SHAP/LIME style breakdown) */}
          {activeTab === "ATTRIBUTION" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Relative Software Metric Contribution to Prediction:
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Weighted SHAP Feature Impact Analysis
                </span>
              </div>

              <div className="space-y-3">
                {explanation.attributions.map((attr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">{attr.metricName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                          {attr.codeKey}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <span className="text-slate-400">
                          Measured: <strong className="text-slate-100">{attr.value}</strong> {attr.unit || ""}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400">
                          Threshold: <strong className="text-amber-400">{attr.threshold}</strong>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            attr.riskLevel === "Critical"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : attr.riskLevel === "High"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : attr.riskLevel === "Medium"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {attr.riskLevel} Risk
                        </span>
                      </div>
                    </div>

                    {/* Progress Impact Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-sans">Attribution Impact Score:</span>
                        <span className="font-bold font-mono text-cyan-300">
                          +{attr.impactPercentage}% Contribution
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            attr.impactDirection === "INCREASES_RISK"
                              ? attr.riskLevel === "Critical"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(5, attr.impactPercentage)}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{attr.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ML Inference Decision Path */}
          {activeTab === "DECISION_TREE" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Step-by-Step ML Model Decision Traversal:
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Tree Node Evaluation Log
                </span>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-800 space-y-4 my-2">
                {explanation.decisionPath.map((node) => (
                  <div key={node.step} className="relative group">
                    {/* Node Circle */}
                    <div
                      className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold ${
                        node.status === "TRIGGERED"
                          ? "bg-amber-950 text-amber-300 border-amber-600"
                          : "bg-slate-900 text-emerald-400 border-emerald-600"
                      }`}
                    >
                      {node.step}
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{node.condition}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            node.status === "TRIGGERED"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-cyan-300">{node.evaluatedValue}</p>
                      <p className="text-xs text-slate-400 font-sans mt-1">
                        Outcome: <strong className="text-slate-200">{node.outcome}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AI Refactoring Action Plan */}
          {activeTab === "REFACTORING" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recommended Refactoring Plan to Mitigate Defect Risk:
                </h4>
              </div>

              <div className="space-y-3">
                {explanation.refactoringPlan.map((plan, i) => (
                  <div key={i} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start space-x-3">
                    <div className="p-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Action #{i + 1}
                      </span>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">{plan}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between sticky bottom-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Explainable AI (XAI) transparent model audit.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
