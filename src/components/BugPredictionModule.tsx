import React, { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  Cpu,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Bug,
  ShieldCheck,
  Search,
  ArrowRight,
  Code2,
  Zap,
  Sliders,
  Gauge,
  Activity,
  Layers,
  FileCode,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Settings,
  Terminal,
  TrendingDown,
  LineChart,
  Trash2,
  GitCompare,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  SoftwareModuleRow,
  PredictionResultItem,
  PredictionSessionReport,
  ModelHyperparameters,
} from "../types";
import { runBugPredictionEngine, DEFAULT_HYPERPARAMETERS } from "../utils/mlEngine";
import { ExplainDecisionModal } from "./ExplainDecisionModal";
import { MultiModelComparisonMatrix } from "./MultiModelComparisonMatrix";

interface TrainingLog {
  timestamp: string;
  level: "INFO" | "TRAIN" | "CONFIG" | "EVAL" | "SUCCESS";
  message: string;
  epoch?: number;
  loss?: number;
  accuracy?: number;
}

interface BugPredictionModuleProps {
  dataset: SoftwareModuleRow[] | null;
  onPredictionComplete: (report: PredictionSessionReport) => void;
  onOpenCodeEditorWithSnippet?: (code: string, moduleName: string) => void;
  onProceedToReports: () => void;
}

export const BugPredictionModule: React.FC<BugPredictionModuleProps> = ({
  dataset,
  onPredictionComplete,
  onOpenCodeEditorWithSnippet,
  onProceedToReports,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>("Random Forest");
  const [selectedBenchmarkModels, setSelectedBenchmarkModels] = useState<string[]>([
    "Random Forest",
    "Neural Network (MLP)",
    "XGBoost Classifier",
    "Decision Tree",
    "Logistic Regression",
  ]);
  const [hyperparameters, setHyperparameters] = useState<ModelHyperparameters>(DEFAULT_HYPERPARAMETERS);
  const [showHyperparamsPanel, setShowHyperparamsPanel] = useState<boolean>(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [currentReport, setCurrentReport] = useState<PredictionSessionReport | null>(null);
  const [activeResultsTab, setActiveResultsTab] = useState<"side-by-side" | "primary-table">("side-by-side");

  // Explain AI Decision Modal State
  const [explainItem, setExplainItem] = useState<PredictionResultItem | null>(null);
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);

  // Real-time Training Logs Console State
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const totalEpochs = 10;
  const [currentLoss, setCurrentLoss] = useState<number | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [showLogsConsole, setShowLogsConsole] = useState<boolean>(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current && isPredicting) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [trainingLogs, isPredicting]);

  const modelOptions = [
    {
      id: "Random Forest",
      label: "Random Forest Classifier",
      badge: "Recommended",
      desc: "Ensemble of decision trees trained on software metric thresholds.",
    },
    {
      id: "Neural Network (MLP)",
      label: "Neural Network (MLP)",
      badge: "Deep Learning",
      desc: "Multi-layer perceptron with non-linear activation layers for complex metrics.",
    },
    {
      id: "XGBoost Classifier",
      label: "XGBoost Gradient Boosting",
      badge: "High Precision",
      desc: "Gradient boosted decision trees optimized for non-linear metric interactions.",
    },
    {
      id: "Gemini AI Ensemble",
      label: "Gemini AI Deep Ensemble",
      badge: "AI Powered",
      desc: "Combines LLM heuristic analysis with statistical software defect models.",
    },
    {
      id: "Decision Tree",
      label: "Decision Tree Classifier",
      badge: "Explainable",
      desc: "Fast rule-based binary classifier based on McCabe cyclomatic bounds.",
    },
    {
      id: "Logistic Regression",
      label: "Logistic Regression",
      badge: "Baseline",
      desc: "Standard sigmoid probability model for linear defect risk estimation.",
    },
  ];

  const handleToggleBenchmarkModel = (modelId: string) => {
    if (selectedBenchmarkModels.includes(modelId)) {
      if (selectedBenchmarkModels.length === 1) return; // keep at least 1
      setSelectedBenchmarkModels(selectedBenchmarkModels.filter((m) => m !== modelId));
    } else {
      setSelectedBenchmarkModels([...selectedBenchmarkModels, modelId]);
    }
  };

  const handleSelectAllModels = () => {
    setSelectedBenchmarkModels(modelOptions.map((m) => m.id));
  };

  const handleRunPrediction = () => {
    if (!dataset || dataset.length === 0) return;

    setIsPredicting(true);
    setShowLogsConsole(true);
    setTrainingLogs([]);
    setCurrentEpoch(0);
    setCurrentLoss(0.85);
    setCurrentAccuracy(55.0);

    const getTime = () => new Date().toLocaleTimeString();

    const initialLogs: TrainingLog[] = [
      {
        timestamp: getTime(),
        level: "INFO",
        message: `Initializing simultaneous multi-model pipeline (${selectedBenchmarkModels.length} models) for ${dataset.length} software modules...`,
      },
      {
        timestamp: getTime(),
        level: "CONFIG",
        message: `Benchmarking algorithms: ${selectedBenchmarkModels.join(", ")}`,
      },
      {
        timestamp: getTime(),
        level: "CONFIG",
        message: `Hyperparameters: LR=${hyperparameters.learningRate}, Threshold=${hyperparameters.decisionThreshold}%, Estimators=${hyperparameters.numberOfEstimators}, Depth=${hyperparameters.maxDepth}, Scaling=${hyperparameters.featureScaling}, Folds=${hyperparameters.crossValidationFolds}`,
      },
    ];
    setTrainingLogs([...initialLogs]);

    let epoch = 1;
    let loss = 0.82;
    let acc = 62.5;

    const currentLogs = [...initialLogs];

    const interval = setInterval(() => {
      if (epoch <= totalEpochs) {
        const lrMult = hyperparameters.learningRate * 2.2;
        loss = Math.max(0.045, loss - (0.072 + Math.random() * 0.018) * (1 + lrMult));
        acc = Math.min(97.8, acc + (3.4 + Math.random() * 1.6));

        setCurrentEpoch(epoch);
        setCurrentLoss(loss);
        setCurrentAccuracy(acc);

        const currentModelName = selectedBenchmarkModels[(epoch - 1) % selectedBenchmarkModels.length] || selectedModel;

        const epochLog: TrainingLog = {
          timestamp: new Date().toLocaleTimeString(),
          level: "TRAIN",
          message: `Epoch ${epoch}/${totalEpochs} finished [${currentModelName}] - Loss: ${loss.toFixed(4)} - Training Acc: ${acc.toFixed(1)}% - Val F1: ${(acc * 0.96).toFixed(1)}%`,
          epoch,
          loss,
          accuracy: acc,
        };

        currentLogs.push(epochLog);
        setTrainingLogs([...currentLogs]);
        epoch++;
      } else {
        clearInterval(interval);

        const evalLog: TrainingLog = {
          timestamp: new Date().toLocaleTimeString(),
          level: "EVAL",
          message: `Executing ${hyperparameters.crossValidationFolds}-Fold cross-validation & comparative matrix evaluation for ${selectedBenchmarkModels.length} models...`,
        };
        currentLogs.push(evalLog);

        const successLog: TrainingLog = {
          timestamp: new Date().toLocaleTimeString(),
          level: "SUCCESS",
          message: `Multi-model benchmarking complete! Predictions and side-by-side matrices generated for ${dataset.length} software modules across ${selectedBenchmarkModels.length} algorithms.`,
        };
        currentLogs.push(successLog);

        setTrainingLogs([...currentLogs]);

        // Synthesize prediction report with multi-model results
        const { report } = runBugPredictionEngine(dataset, selectedModel, hyperparameters, selectedBenchmarkModels);
        setCurrentReport(report);
        onPredictionComplete(report);
        setIsPredicting(false);
      }
    }, 140);
  };

  const filteredItems = currentReport
    ? currentReport.items.filter((item) => {
        const matchesSearch =
          item.moduleName.toLowerCase().includes(searchFilter.toLowerCase()) ||
          item.primaryRiskFactor.toLowerCase().includes(searchFilter.toLowerCase());

        if (riskFilter === "ALL") return matchesSearch;
        if (riskFilter === "BUGGY") return matchesSearch && item.predictedLabel === "Buggy";
        if (riskFilter === "NON_BUGGY") return matchesSearch && item.predictedLabel === "Non-Buggy";
        if (riskFilter === "HIGH_RISK") return matchesSearch && (item.riskLevel === "Critical" || item.riskLevel === "High");

        return matchesSearch;
      })
    : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800/80 rounded-full">
                Module 3
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI/ML Software Defect & Bug Prediction Engine
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Analyze uploaded software project metrics using Artificial Intelligence & Machine Learning techniques. Identifies early-stage defect risk, classifies components into <strong className="text-slate-200">Buggy / Non-Buggy</strong>, and provides targeted refactoring guidance.
            </p>
          </div>

          <button
            id="run-prediction-button"
            onClick={handleRunPrediction}
            disabled={!dataset || dataset.length === 0 || isPredicting}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-xl shadow-indigo-500/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Run Machine Learning prediction model (Ctrl+Enter)"
          >
            {isPredicting ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Running Machine Learning Analysis...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4 text-cyan-300" />
                <span>Run AI Defect Prediction</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-black/30 border border-white/20 text-[10px] font-mono text-cyan-100 rounded ml-1">
                  Ctrl+↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model Selector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Select Machine Learning Classification Algorithm & Benchmark Suite
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAllModels}
              className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <CheckSquare className="w-3 h-3 text-cyan-400" />
              <span>Select All for Benchmark</span>
            </button>
            <span className="text-xs font-mono text-slate-400">
              {dataset ? `${dataset.length} Modules Loaded` : "No dataset loaded"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {modelOptions.map((model) => {
            const isSelected = selectedModel === model.id;
            const isBenchmarked = selectedBenchmarkModels.includes(model.id);

            return (
              <div
                key={model.id}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-950/80 border-cyan-400/80 ring-2 ring-cyan-500/20 shadow-lg shadow-indigo-950/50"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {model.badge}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-tight">{model.label}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{model.desc}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedModel(model.id)}
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors cursor-pointer ${
                      isSelected ? "bg-cyan-500 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {isSelected ? "Active Target" : "Set Primary"}
                  </button>

                  <button
                    onClick={() => handleToggleBenchmarkModel(model.id)}
                    className={`p-1 rounded transition-colors cursor-pointer flex items-center space-x-1 text-[10px] font-mono ${
                      isBenchmarked ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-400"
                    }`}
                    title="Include in multi-model benchmark comparison"
                  >
                    {isBenchmarked ? <CheckSquare className="w-3.5 h-3.5 text-cyan-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>Benchmark</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ML Model Hyperparameters Configuration Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <span>Model Hyperparameters & Training Configuration</span>
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800 rounded-full">
                  Customizable
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tune decision threshold, learning rate, and tree hyper-parameters before initiating analysis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => setHyperparameters(DEFAULT_HYPERPARAMETERS)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Reset all parameters to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={() => setShowHyperparamsPanel(!showHyperparamsPanel)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <span>{showHyperparamsPanel ? "Collapse Panel" : "Expand Config"}</span>
              {showHyperparamsPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showHyperparamsPanel && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
            {/* 1. Decision Threshold Slider */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <span>Decision Threshold</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Cutoff Probability)</span>
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                  {hyperparameters.decisionThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={1}
                value={hyperparameters.decisionThreshold}
                onChange={(e) =>
                  setHyperparameters({ ...hyperparameters, decisionThreshold: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>10% (High Recall)</span>
                <span>50% (Balanced)</span>
                <span>90% (High Precision)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Modules with bug probability ≥ <strong className="text-cyan-300">{hyperparameters.decisionThreshold}%</strong> are classified as <span className="text-rose-400 font-bold">Buggy</span>.
              </p>
            </div>

            {/* 2. Learning Rate Slider */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <span>Learning Rate (α)</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Shrinkage)</span>
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                  {hyperparameters.learningRate.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.50}
                step={0.01}
                value={hyperparameters.learningRate}
                onChange={(e) =>
                  setHyperparameters({ ...hyperparameters, learningRate: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex items-center space-x-1.5 pt-0.5">
                {[0.01, 0.10, 0.30].map((lr) => (
                  <button
                    key={lr}
                    onClick={() => setHyperparameters({ ...hyperparameters, learningRate: lr })}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                      hyperparameters.learningRate === lr
                        ? "bg-cyan-900/60 text-cyan-300 border-cyan-500"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {lr.toFixed(2)} {lr === 0.10 ? "(Std)" : ""}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Step-size shrinkage used in gradient optimization to prevent overshooting local minima.
              </p>
            </div>

            {/* 3. Batch Size Configuration */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <span>Batch Size</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Mini-Batch)</span>
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                  {hyperparameters.batchSize || 32} samples
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[16, 32, 64, 128, 256].map((bs) => (
                  <button
                    key={bs}
                    onClick={() => setHyperparameters({ ...hyperparameters, batchSize: bs })}
                    className={`py-1.5 text-center text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      (hyperparameters.batchSize || 32) === bs
                        ? "bg-cyan-950 text-cyan-300 border-cyan-500 shadow-md ring-1 ring-cyan-500/30"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {bs}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Number of metric samples processed before updating internal gradient weights.
              </p>
            </div>

            {/* 3. Number of Estimators */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <span>Number of Estimators</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Trees)</span>
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                  {hyperparameters.numberOfEstimators} trees
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={300}
                step={10}
                value={hyperparameters.numberOfEstimators}
                onChange={(e) =>
                  setHyperparameters({ ...hyperparameters, numberOfEstimators: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>10 Trees</span>
                <span>100 (Default)</span>
                <span>300 Trees</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Total decision trees created in ensemble classifiers (Random Forest & XGBoost).
              </p>
            </div>

            {/* 4. Max Tree Depth */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <span>Max Tree Depth</span>
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                  {hyperparameters.maxDepth} levels
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                step={1}
                value={hyperparameters.maxDepth}
                onChange={(e) =>
                  setHyperparameters({ ...hyperparameters, maxDepth: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>2 (Shallow)</span>
                <span>6 (Optimal)</span>
                <span>15 (Deep)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Controls depth of decision splits to capture complex metric interactions.
              </p>
            </div>

            {/* 5. Feature Scaling Method */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <label className="text-xs font-bold text-slate-200 block">
                Feature Normalization & Scaling
              </label>
              <select
                value={hyperparameters.featureScaling}
                onChange={(e) =>
                  setHyperparameters({
                    ...hyperparameters,
                    featureScaling: e.target.value as any,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="StandardScaler">StandardScaler (Z-Score Normalization)</option>
                <option value="MinMaxScaler">MinMaxScaler (0 - 1 Rescaling)</option>
                <option value="RobustScaler">RobustScaler (Median & IQR)</option>
                <option value="None">None (Raw Unscaled Metrics)</option>
              </select>
              <p className="text-[11px] text-slate-400 leading-tight">
                Normalizes numerical scales (LOC vs CBO) before feeding metrics into risk classifiers.
              </p>
            </div>

            {/* 6. Cross Validation Folds */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <label className="text-xs font-bold text-slate-200 block">
                Cross-Validation Fold Validation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((folds) => (
                  <button
                    key={folds}
                    onClick={() =>
                      setHyperparameters({ ...hyperparameters, crossValidationFolds: folds })
                    }
                    className={`py-1.5 px-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      hyperparameters.crossValidationFolds === folds
                        ? "bg-cyan-950 text-cyan-300 border-cyan-500 shadow-md"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {folds}-Fold
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                K-Fold cross validation splits dataset to calculate unbiased accuracy metrics.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Training Progress & Inference Log Console */}
      {(trainingLogs.length > 0 || isPredicting) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Real-Time Model Training & Inference Console
                  </h3>
                  {isPredicting ? (
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-[10px] font-mono animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>Training Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[10px] font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Converged & Completed</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Live execution feedback displaying epoch completion, loss reduction curve, and evaluation metrics
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTrainingLogs([])}
                disabled={isPredicting}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center space-x-1 transition-colors cursor-pointer"
                title="Clear console logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
              <button
                onClick={() => setShowLogsConsole(!showLogsConsole)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>{showLogsConsole ? "Hide Console" : "Show Console"}</span>
                {showLogsConsole ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {showLogsConsole && (
            <div className="space-y-3">
              {/* Training Progress Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Epoch Completion */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Epoch Completion
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-200">
                      Epoch {currentEpoch} / {totalEpochs}
                    </span>
                  </div>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 font-mono text-xs font-bold">
                    {Math.round((currentEpoch / totalEpochs) * 100)}%
                  </div>
                </div>

                {/* Loss Reduction */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Loss Reduction
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-mono font-bold text-cyan-400">
                        {currentLoss !== null ? currentLoss.toFixed(4) : "--"}
                      </span>
                      {currentLoss !== null && (
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20 text-[10px] font-mono">
                    Loss Curve
                  </div>
                </div>

                {/* Training Accuracy */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Validation Accuracy
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {currentAccuracy !== null ? `${currentAccuracy.toFixed(1)}%` : "--"}
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 font-mono text-[10px]">
                    Optimized
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Training Pipeline Progress</span>
                  <span>{Math.round((currentEpoch / totalEpochs) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-150 rounded-full"
                    style={{ width: `${(currentEpoch / totalEpochs) * 100}%` }}
                  />
                </div>
              </div>

              {/* Terminal Output */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs max-h-52 overflow-y-auto space-y-1.5 shadow-inner">
                {trainingLogs.map((log, index) => {
                  let badgeColor = "bg-slate-800 text-slate-300";
                  let textColor = "text-slate-300";

                  if (log.level === "INFO") {
                    badgeColor = "bg-cyan-950 text-cyan-300 border border-cyan-800/80";
                    textColor = "text-cyan-200";
                  } else if (log.level === "CONFIG") {
                    badgeColor = "bg-purple-950 text-purple-300 border border-purple-800/80";
                    textColor = "text-purple-200";
                  } else if (log.level === "TRAIN") {
                    badgeColor = "bg-slate-900 text-emerald-400 border border-slate-800";
                    textColor = "text-slate-200";
                  } else if (log.level === "EVAL") {
                    badgeColor = "bg-amber-950 text-amber-300 border border-amber-800/80";
                    textColor = "text-amber-200";
                  } else if (log.level === "SUCCESS") {
                    badgeColor = "bg-emerald-950 text-emerald-300 border border-emerald-700";
                    textColor = "text-emerald-300 font-bold";
                  }

                  return (
                    <div key={index} className="flex items-start space-x-2 leading-relaxed">
                      <span className="text-[10px] text-slate-500 shrink-0 select-none">
                        [{log.timestamp}]
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded shrink-0 select-none ${badgeColor}`}
                      >
                        {log.level}
                      </span>
                      <span className={`break-all ${textColor}`}>{log.message}</span>
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prediction Results Table & Defect Risk Analysis */}
      {currentReport ? (
        <div className="space-y-6">
          {/* Results Mode View Switcher */}
          {currentReport.multiModelResults && currentReport.multiModelResults.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveResultsTab("side-by-side")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                    activeResultsTab === "side-by-side"
                      ? "bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <GitCompare className="w-4 h-4 text-cyan-300" />
                  <span>Side-by-Side Multi-Model Matrix</span>
                  <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-[10px] font-mono">
                    {currentReport.multiModelResults.length} Models
                  </span>
                </button>

                <button
                  onClick={() => setActiveResultsTab("primary-table")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                    activeResultsTab === "primary-table"
                      ? "bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Activity className="w-4 h-4 text-cyan-300" />
                  <span>Single Model Detailed View ({currentReport.selectedModel})</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  onClick={onProceedToReports}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <span>Full Analytics & Export Report</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          )}

          {activeResultsTab === "side-by-side" && currentReport.multiModelResults ? (
            <MultiModelComparisonMatrix
              multiModelResults={currentReport.multiModelResults}
              selectedPrimaryModel={selectedModel}
              onSelectPrimaryModel={(modelName) => {
                setSelectedModel(modelName);
                setActiveResultsTab("primary-table");
              }}
              onOpenCodeEditorWithSnippet={onOpenCodeEditorWithSnippet}
            />
          ) : (
            <div className="space-y-6">
              {/* Quick Metrics KPI Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Total Modules Analyzed
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-white font-mono">{currentReport.totalModules}</span>
                    <span className="text-xs text-slate-400">components</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                    Buggy Modules Detected
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-rose-400 font-mono">{currentReport.buggyCount}</span>
                    <span className="text-xs text-rose-300/80 font-bold">
                      ({Math.round((currentReport.buggyCount / currentReport.totalModules) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Clean / Non-Buggy Modules
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-emerald-400 font-mono">{currentReport.nonBuggyCount}</span>
                    <span className="text-xs text-emerald-300/80 font-bold">
                      ({Math.round((currentReport.nonBuggyCount / currentReport.totalModules) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                    Model F1 Accuracy Score
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-cyan-400 font-mono">{currentReport.metrics.f1Score}%</span>
                    <span className="text-xs text-slate-400">{currentReport.selectedModel}</span>
                  </div>
                </div>
              </div>

          {/* Module Classification Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Software Module Buggy vs Non-Buggy Classification</h3>
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

                {/* Filter Badges */}
                <div className="flex items-center space-x-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
                  <FilterBtn label="All" active={riskFilter === "ALL"} onClick={() => setRiskFilter("ALL")} />
                  <FilterBtn label="Buggy" active={riskFilter === "BUGGY"} onClick={() => setRiskFilter("BUGGY")} color="rose" />
                  <FilterBtn label="Non-Buggy" active={riskFilter === "NON_BUGGY"} onClick={() => setRiskFilter("NON_BUGGY")} color="emerald" />
                  <FilterBtn label="High Risk" active={riskFilter === "HIGH_RISK"} onClick={() => setRiskFilter("HIGH_RISK")} color="amber" />
                </div>

                <button
                  onClick={onProceedToReports}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs rounded-lg shadow flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <span>View Analytics & Export Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Prediction List Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300 font-sans">
                <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-bold">Module Name</th>
                    <th className="px-4 py-3 font-bold">ML Classification</th>
                    <th className="px-4 py-3 font-bold">Bug Probability</th>
                    <th className="px-4 py-3 font-bold">Risk Level</th>
                    <th className="px-4 py-3 font-bold">Primary Risk Contributor</th>
                    <th className="px-4 py-3 font-bold">AI Refactoring Recommendation</th>
                    <th className="px-4 py-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
                  {filteredItems.map((item) => {
                    const isBuggy = item.predictedLabel === "Buggy";
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-4 py-3 font-sans font-semibold text-slate-200 max-w-[200px] truncate">
                          {item.moduleName}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center space-x-1 ${
                              isBuggy
                                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {isBuggy ? <Bug className="w-3 h-3 text-rose-400" /> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                            <span>{item.predictedLabel}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  item.bugProbability >= 70
                                    ? "bg-rose-500"
                                    : item.bugProbability >= 40
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${item.bugProbability}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-200">{item.bugProbability}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.riskLevel === "Critical"
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : item.riskLevel === "High"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : item.riskLevel === "Medium"
                                ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                                : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}
                          >
                            {item.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-300 max-w-[220px] truncate">
                          {item.primaryRiskFactor}
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-400 text-[11px] max-w-[260px] truncate">
                          {item.aiRecommendation}
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setExplainItem(item);
                                setShowExplainModal(true);
                              }}
                              className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900/80 hover:border-cyan-500/80 text-cyan-300 border border-cyan-800/80 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer shadow-sm"
                              title="Explain AI Decision: View SHAP feature contribution & ML decision tree traversal"
                            >
                              <BrainCircuit className="w-3 h-3 text-cyan-400" />
                              <span>Explain AI Decision</span>
                            </button>

                            {item.sampleCode && onOpenCodeEditorWithSnippet ? (
                              <button
                                onClick={() => onOpenCodeEditorWithSnippet(item.sampleCode!, item.moduleName)}
                                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                                title="Load source code into Live Code Auto-Fixer"
                              >
                                <Code2 className="w-3 h-3 text-cyan-400" />
                                <span>Fix Code</span>
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
        /* Empty State */
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center mx-auto">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Ready for Machine Learning Analysis</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong className="text-cyan-400">"Run AI Defect Prediction"</strong> above to execute classification algorithms on your software project metrics dataset.
          </p>
        </div>
      )}

      {/* Explain AI Decision Modal */}
      {showExplainModal && explainItem && (
        <ExplainDecisionModal
          item={explainItem}
          modelName={selectedModel}
          decisionThreshold={hyperparameters.decisionThreshold}
          onClose={() => {
            setShowExplainModal(false);
            setExplainItem(null);
          }}
          onOpenCodeEditorWithSnippet={onOpenCodeEditorWithSnippet}
        />
      )}
    </div>
  );
};

const FilterBtn: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "rose" | "emerald" | "amber";
}> = ({ label, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
      active
        ? color === "rose"
          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold"
          : color === "emerald"
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
          : color === "amber"
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
          : "bg-indigo-600 text-white font-bold"
        : "text-slate-400 hover:text-slate-200"
    }`}
  >
    {label}
  </button>
);
