import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
  Printer,
  History,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  BarChart2,
  PieChart as PieIcon,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Bug,
  BrainCircuit,
  Share2,
  UserCheck,
  Check,
  X,
  Search,
  Filter,
  Save,
  RotateCcw,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { PredictionSessionReport, ModelPerformanceMetrics } from "../types";
import { BugDensityHeatmap } from "./BugDensityHeatmap";
import { ModelComparisonTable } from "./ModelComparisonTable";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ResultsReportModuleProps {
  report: PredictionSessionReport | null;
  savedReports: PredictionSessionReport[];
  onSelectSavedReport?: (rep: PredictionSessionReport) => void;
}

export const ResultsReportModule: React.FC<ResultsReportModuleProps> = ({
  report,
  savedReports,
  onSelectSavedReport,
}) => {
  const [selectedModelView, setSelectedModelView] = useState<string>(
    report ? report.selectedModel : "Random Forest"
  );
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Human Verification State (Persisted to localStorage)
  const [verificationsMap, setVerificationsMap] = useState<Record<string, "Actually Buggy" | "Actually Clean">>(() => {
    try {
      const saved = localStorage.getItem("codefix_human_verifications");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [verifySearch, setVerifySearch] = useState<string>("");
  const [verifyFilter, setVerifyFilter] = useState<"ALL" | "VERIFIED" | "DISCREPANCY" | "UNVERIFIED">("ALL");

  const handleToggleVerification = (itemId: string, status: "Actually Buggy" | "Actually Clean") => {
    setVerificationsMap((prev) => {
      const next = { ...prev };
      if (next[itemId] === status) {
        delete next[itemId]; // Toggle off if clicked again
      } else {
        next[itemId] = status;
      }
      try {
        localStorage.setItem("codefix_human_verifications", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save human verifications to localStorage", e);
      }
      return next;
    });
  };

  const handleClearVerifications = () => {
    setVerificationsMap({});
    try {
      localStorage.removeItem("codefix_human_verifications");
    } catch (e) {
      console.error("Failed to clear verifications", e);
    }
  };

  if (!report) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 text-cyan-400 flex items-center justify-center mx-auto border border-slate-700">
          <BarChart2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">No Prediction Session Report Generated Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload a software dataset in Module 2 and run the AI Defect Prediction engine in Module 3 to generate detailed model performance analytics and downloadable reports.
        </p>
      </div>
    );
  }

  const activeMetrics: ModelPerformanceMetrics =
    report.allModelMetrics.find((m) => m.modelName === selectedModelView) || report.metrics;

  const { confusionMatrix } = activeMetrics;

  // Chart data formatting
  const modelComparisonChartData = report.allModelMetrics.map((m) => ({
    name: m.modelName,
    Accuracy: m.accuracy,
    Precision: m.precision,
    Recall: m.recall,
    "F1-Score": m.f1Score,
  }));

  const pieDistributionData = [
    { name: "Buggy Modules", value: report.buggyCount, color: "#f43f5e" },
    { name: "Non-Buggy Modules", value: report.nonBuggyCount, color: "#10b981" },
  ];

  // Verification Filter & Statistics Calculation
  const filteredVerifyItems = report.items.filter((item) => {
    const matchesSearch = item.moduleName.toLowerCase().includes(verifySearch.toLowerCase());
    const verifiedStatus = verificationsMap[item.id];
    const aiStatus = item.predictedLabel === "Buggy" ? "Actually Buggy" : "Actually Clean";

    if (!matchesSearch) return false;

    if (verifyFilter === "VERIFIED") return Boolean(verifiedStatus);
    if (verifyFilter === "UNVERIFIED") return !verifiedStatus;
    if (verifyFilter === "DISCREPANCY") return Boolean(verifiedStatus && verifiedStatus !== aiStatus);
    return true;
  });

  const totalVerifiedCount = Object.keys(verificationsMap).filter((id) =>
    report.items.some((i) => i.id === id)
  ).length;

  let verifyMatchesCount = 0;
  let verifyDiscrepanciesCount = 0;

  report.items.forEach((item) => {
    const verified = verificationsMap[item.id];
    if (verified) {
      const aiStatus = item.predictedLabel === "Buggy" ? "Actually Buggy" : "Actually Clean";
      if (verified === aiStatus) {
        verifyMatchesCount++;
      } else {
        verifyDiscrepanciesCount++;
      }
    }
  });

  const agreementPercentage =
    totalVerifiedCount > 0 ? Math.round((verifyMatchesCount / totalVerifiedCount) * 100) : 100;

  // Export handlers
  const handleExportCSV = () => {
    const csvRows = report.items.map((i) => ({
      Module_Name: i.moduleName,
      Predicted_Classification: i.predictedLabel,
      Bug_Probability_Pct: i.bugProbability,
      Risk_Level: i.riskLevel,
      LOC: i.loc,
      Cyclomatic_Complexity: i.cyclomaticComplexity,
      Halstead_Volume: i.halsteadVolume,
      Coupling: i.coupling,
      Primary_Risk_Factor: i.primaryRiskFactor,
      AI_Recommendation: i.aiRecommendation,
    }));

    const csvStr = Papa.unparse(csvRows);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Software_Defect_Prediction_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const excelRows = report.items.map((i) => ({
      "Module Name": i.moduleName,
      Classification: i.predictedLabel,
      "Bug Probability (%)": i.bugProbability,
      "Risk Level": i.riskLevel,
      "Lines of Code (LOC)": i.loc,
      "Cyclomatic Complexity": i.cyclomaticComplexity,
      "Halstead Volume": i.halsteadVolume,
      "Class Coupling": i.coupling,
      "Primary Risk Contributor": i.primaryRiskFactor,
      "AI Recommendation": i.aiRecommendation,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Defect Predictions");

    // Add Metrics sheet
    const metricsData = report.allModelMetrics.map((m) => ({
      "Model Name": m.modelName,
      "Accuracy (%)": m.accuracy,
      "Precision (%)": m.precision,
      "Recall (%)": m.recall,
      "F1 Score (%)": m.f1Score,
    }));
    const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, "Model Performance");

    XLSX.writeFile(workbook, `Software_Defect_Report_${Date.now()}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Banner Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 30, "F");

    // Header Accent Bar
    doc.setFillColor(6, 182, 212); // cyan-500
    doc.rect(0, 28.5, pageWidth, 1.5, "F");

    doc.setTextColor(56, 189, 248); // cyan-400
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CodeFix AI Defect Analytics Report", 14, 12);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Software Quality & Machine Learning Defect Prediction Suite", 14, 18);

    doc.setTextColor(203, 213, 225); // slate-300
    doc.setFontSize(8);
    doc.text(`Generated: ${report.timestamp}`, pageWidth - 14, 12, { align: "right" });
    doc.text(`Dataset: ${report.datasetName}`, pageWidth - 14, 18, { align: "right" });

    let currentY = 36;

    // 2. Executive Summary Box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("EXECUTIVE ANALYSIS SUMMARY", 18, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const defectPct = Math.round((report.buggyCount / report.totalModules) * 100);
    doc.text(
      `Analyzed ${report.totalModules} software modules using '${selectedModelView}' model. Identified ${report.buggyCount} buggy modules (${defectPct}% defect rate) and ${report.nonBuggyCount} clean modules. Model achieved ${activeMetrics.accuracy}% accuracy and ${activeMetrics.f1Score}% F1 score.`,
      18,
      currentY + 13,
      { maxWidth: pageWidth - 36 }
    );

    currentY += 30;

    // 3. Key Model Metrics Table
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Primary Model Performance Metrics (${selectedModelView})`, 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["Accuracy", "Precision", "Recall (Sensitivity)", "F1-Score", "Specificity", "False Positive Rate"]],
      body: [
        [
          `${activeMetrics.accuracy}%`,
          `${activeMetrics.precision}%`,
          `${activeMetrics.recall}%`,
          `${activeMetrics.f1Score}%`,
          `${confusionMatrix.falsePositive + confusionMatrix.trueNegative > 0 ? Math.round((confusionMatrix.trueNegative / (confusionMatrix.falsePositive + confusionMatrix.trueNegative)) * 100) : 0}%`,
          `${confusionMatrix.falsePositive + confusionMatrix.trueNegative > 0 ? Math.round((confusionMatrix.falsePositive / (confusionMatrix.falsePositive + confusionMatrix.trueNegative)) * 100) : 0}%`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 9, halign: "center", fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 4. 2x2 Confusion Matrix Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("2x2 Machine Learning Confusion Matrix", 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [
        ["Actual \\ Predicted", "Predicted Buggy", "Predicted Clean", "Actual Class Total"],
      ],
      body: [
        [
          "Actual Buggy",
          `True Positive (TP): ${confusionMatrix.truePositive}`,
          `False Negative (FN): ${confusionMatrix.falseNegative}`,
          `${confusionMatrix.truePositive + confusionMatrix.falseNegative}`,
        ],
        [
          "Actual Clean",
          `False Positive (FP): ${confusionMatrix.falsePositive}`,
          `True Negative (TN): ${confusionMatrix.trueNegative}`,
          `${confusionMatrix.falsePositive + confusionMatrix.trueNegative}`,
        ],
        [
          "Predicted Total",
          `${confusionMatrix.truePositive + confusionMatrix.falsePositive}`,
          `${confusionMatrix.falseNegative + confusionMatrix.trueNegative}`,
          `${report.totalModules}`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252] },
        1: { fillColor: [236, 253, 245] },
        2: { fillColor: [254, 242, 242] },
        3: { fontStyle: "bold", halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 5. ML Benchmark Comparison Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("ML Classifier Benchmark Comparison", 14, currentY);
    currentY += 4;

    const modelComparisonRows = report.allModelMetrics.map((m) => [
      m.modelName,
      `${m.accuracy}%`,
      `${m.precision}%`,
      `${m.recall}%`,
      `${m.f1Score}%`,
      m.modelName === report.selectedModel ? "Selected Best Model" : "Evaluated",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Model Name", "Accuracy", "Precision", "Recall", "F1-Score", "Status"]],
      body: modelComparisonRows,
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8.5 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 6. High Risk Buggy Modules Table
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("High-Risk Buggy Software Modules & AI Recommendations", 14, currentY);
    currentY += 4;

    const moduleRows = report.items
      .slice(0, 20)
      .map((item) => [
        item.moduleName,
        item.predictedLabel,
        `${item.bugProbability}%`,
        item.riskLevel,
        item.loc,
        item.cyclomaticComplexity,
        item.primaryRiskFactor || "Complexity",
        item.aiRecommendation,
      ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Module", "Class", "Bug Prob", "Risk", "LOC", "Complexity", "Primary Risk", "AI Action Plan"]],
      body: moduleRows,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { fontStyle: "bold" },
        2: { halign: "center" },
        3: { fontStyle: "bold", halign: "center" },
        7: { cellWidth: 45 },
      },
      margin: { left: 14, right: 14 },
    });

    // Page Numbering Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `CodeFix AI - Software Defect Prediction Suite | Confidential Quality Documentation`,
        14,
        pageHeight - 8
      );
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: "right" });
    }

    doc.save(`Software_Defect_Prediction_Report_${Date.now()}.pdf`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded-full">
                Module 4
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Prediction Results & ML Performance Analytics Report
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Comprehensive defect prediction outcomes, model performance metrics (<strong className="text-slate-200">Accuracy, Precision, Recall, F1-Score</strong>), confusion matrix display, feature importance charts, and downloadable reports.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="pdf-export-button"
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Download professional PDF report with metrics, confusion matrix, and recommendations (Ctrl+S)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-black/30 border border-white/20 text-[9px] font-mono text-cyan-100 rounded ml-1">
                Ctrl+S
              </kbd>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Print browser view or save as system PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Model Performance Metrics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Model Accuracy" value={`${activeMetrics.accuracy}%`} sub="Overall Classification" color="cyan" icon={Award} />
        <MetricCard label="Precision Score" value={`${activeMetrics.precision}%`} sub="Positive Predictive Value" color="emerald" icon={CheckCircle2} />
        <MetricCard label="Recall (Sensitivity)" value={`${activeMetrics.recall}%`} sub="True Defect Detection Rate" color="indigo" icon={Sparkles} />
        <MetricCard label="F1-Score Metric" value={`${activeMetrics.f1Score}%`} sub="Harmonic Mean of Precision/Recall" color="purple" icon={BrainCircuit} />
      </div>

      {/* Confusion Matrix & Feature Importance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Confusion Matrix Table Component */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                2x2 ML Confusion Matrix Visualizer ({selectedModelView})
              </h3>
            </div>

            {/* Model Selector Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400">Model:</span>
              <select
                value={selectedModelView}
                onChange={(e) => setSelectedModelView(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-sans cursor-pointer font-medium"
              >
                {report.allModelMetrics.map((m) => (
                  <option key={m.modelName} value={m.modelName}>
                    {m.modelName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Cross-tabulates ground-truth bug labels against AI/ML model classifications to evaluate prediction precision and error types.
          </p>

          {/* Table Matrix Component */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs font-sans">
              <thead>
                <tr>
                  <th colSpan={2} rowSpan={2} className="p-2 border border-slate-800 bg-slate-950 text-slate-500 text-[10px] font-mono">
                    TOTAL SAMPLES: {(confusionMatrix.truePositive + confusionMatrix.falsePositive + confusionMatrix.trueNegative + confusionMatrix.falseNegative)}
                  </th>
                  <th colSpan={2} className="p-2 border border-slate-800 bg-slate-950 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                    PREDICTED CLASS (ML Model Output)
                  </th>
                  <th rowSpan={2} className="p-2 border border-slate-800 bg-slate-950 text-slate-400 font-bold text-[10px] uppercase">
                    Actual Total
                  </th>
                </tr>
                <tr>
                  <th className="p-2 border border-slate-800 bg-rose-950/40 text-rose-300 font-bold text-[11px]">
                    Predicted Buggy
                  </th>
                  <th className="p-2 border border-slate-800 bg-emerald-950/40 text-emerald-300 font-bold text-[11px]">
                    Predicted Clean
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {/* Row 1: Actual Buggy */}
                <tr>
                  <th rowSpan={2} className="p-2 border border-slate-800 bg-slate-950 text-indigo-400 font-bold uppercase tracking-wider text-[11px] [writing-mode:vertical-lr] sm:[writing-mode:horizontal-tb]">
                    ACTUAL CLASS
                  </th>
                  <th className="p-2 border border-slate-800 bg-rose-950/40 text-rose-300 font-bold text-[11px] font-sans text-left">
                    Actual Buggy
                  </th>
                  {/* True Positive Cell */}
                  <td className="p-3 border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-950/50 transition-colors relative group">
                    <div className="text-xs font-sans text-emerald-400 font-bold uppercase tracking-wider">True Positive (TP)</div>
                    <div className="text-2xl font-black text-emerald-300 my-0.5">{confusionMatrix.truePositive}</div>
                    <div className="text-[10px] font-sans text-emerald-200/80">Correct Defect Hits</div>
                  </td>
                  {/* False Negative Cell */}
                  <td className="p-3 border border-amber-500/30 bg-amber-950/30 hover:bg-amber-950/50 transition-colors relative group">
                    <div className="text-xs font-sans text-amber-400 font-bold uppercase tracking-wider">False Negative (FN)</div>
                    <div className="text-2xl font-black text-amber-300 my-0.5">{confusionMatrix.falseNegative}</div>
                    <div className="text-[10px] font-sans text-amber-200/80">Missed Defects (Risk)</div>
                  </td>
                  {/* Actual Buggy Total */}
                  <td className="p-2 border border-slate-800 bg-slate-950 text-slate-200 font-bold text-sm">
                    {confusionMatrix.truePositive + confusionMatrix.falseNegative}
                  </td>
                </tr>

                {/* Row 2: Actual Non-Buggy */}
                <tr>
                  <th className="p-2 border border-slate-800 bg-emerald-950/40 text-emerald-300 font-bold text-[11px] font-sans text-left">
                    Actual Clean
                  </th>
                  {/* False Positive Cell */}
                  <td className="p-3 border border-rose-500/30 bg-rose-950/30 hover:bg-rose-950/50 transition-colors relative group">
                    <div className="text-xs font-sans text-rose-400 font-bold uppercase tracking-wider">False Positive (FP)</div>
                    <div className="text-2xl font-black text-rose-300 my-0.5">{confusionMatrix.falsePositive}</div>
                    <div className="text-[10px] font-sans text-rose-200/80">False Alarms</div>
                  </td>
                  {/* True Negative Cell */}
                  <td className="p-3 border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-950/50 transition-colors relative group">
                    <div className="text-xs font-sans text-indigo-400 font-bold uppercase tracking-wider">True Negative (TN)</div>
                    <div className="text-2xl font-black text-indigo-300 my-0.5">{confusionMatrix.trueNegative}</div>
                    <div className="text-[10px] font-sans text-indigo-200/80">Correct Clean Hits</div>
                  </td>
                  {/* Actual Clean Total */}
                  <td className="p-2 border border-slate-800 bg-slate-950 text-slate-200 font-bold text-sm">
                    {confusionMatrix.falsePositive + confusionMatrix.trueNegative}
                  </td>
                </tr>

                {/* Totals Row */}
                <tr className="bg-slate-950 font-bold">
                  <td colSpan={2} className="p-2 border border-slate-800 text-slate-400 text-left font-sans text-[11px] uppercase">
                    Predicted Total
                  </td>
                  <td className="p-2 border border-slate-800 text-rose-300 text-sm">
                    {confusionMatrix.truePositive + confusionMatrix.falsePositive}
                  </td>
                  <td className="p-2 border border-slate-800 text-emerald-300 text-sm">
                    {confusionMatrix.falseNegative + confusionMatrix.trueNegative}
                  </td>
                  <td className="p-2 border border-slate-800 text-cyan-300 text-sm">
                    {confusionMatrix.truePositive + confusionMatrix.falsePositive + confusionMatrix.falseNegative + confusionMatrix.trueNegative}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Derived Classification Metrics Callout Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-sans">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 block">Sensitivity (Recall)</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {confusionMatrix.truePositive + confusionMatrix.falseNegative > 0
                  ? `${Math.round((confusionMatrix.truePositive / (confusionMatrix.truePositive + confusionMatrix.falseNegative)) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 block">Specificity</span>
              <span className="text-xs font-bold text-indigo-400 font-mono">
                {confusionMatrix.falsePositive + confusionMatrix.trueNegative > 0
                  ? `${Math.round((confusionMatrix.trueNegative / (confusionMatrix.falsePositive + confusionMatrix.trueNegative)) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 block">Precision (PPV)</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {confusionMatrix.truePositive + confusionMatrix.falsePositive > 0
                  ? `${Math.round((confusionMatrix.truePositive / (confusionMatrix.truePositive + confusionMatrix.falsePositive)) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 block">False Positive Rate</span>
              <span className="text-xs font-bold text-rose-400 font-mono">
                {confusionMatrix.falsePositive + confusionMatrix.trueNegative > 0
                  ? `${Math.round((confusionMatrix.falsePositive / (confusionMatrix.falsePositive + confusionMatrix.trueNegative)) * 100)}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* Buggy vs Non-Buggy Pie Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <PieIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Dataset Bug Classification Ratio
            </h3>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Performance Comparison Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Machine Learning Model Performance Comparison
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Random Forest vs XGBoost vs Decision Tree vs Logistic Regression</span>
        </div>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelComparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="Accuracy" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Precision" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1-Score" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side-by-Side Model Performance Comparative Summary Table */}
      <ModelComparisonTable
        allModelMetrics={report.allModelMetrics}
        selectedModelView={selectedModelView}
        onSelectModelView={setSelectedModelView}
      />

      {/* D3.js Bug Density Heatmap Visualization */}
      <BugDensityHeatmap items={report.items} />

      {/* Feature Importance Analysis Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Feature Importance Weight Analysis (What metric causes defects?)
          </h3>
        </div>

        <div className="space-y-3">
          {activeMetrics.featureImportance.map((feat) => (
            <div key={feat.feature} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="font-semibold">{feat.feature}</span>
                <span className="font-mono font-bold text-cyan-400">{feat.importance}% Impact</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full"
                  style={{ width: `${feat.importance * 2}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Ground-Truth Result Verification & Model Feedback Loop */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Human Ground-Truth Result Verification & Feedback
              </h3>
              <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800/80 rounded-full text-[10px] font-mono">
                Model Fine-Tuning Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify AI predictions against manual code inspections. Human ground-truth labels are automatically saved to local storage to refine model retraining pipelines.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 rounded-xl text-xs font-mono flex items-center space-x-1.5 shadow-sm">
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Feedback Auto-Saved</span>
            </span>
            {totalVerifiedCount > 0 && (
              <button
                onClick={handleClearVerifications}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                title="Reset human verifications"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Summary KPI Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Human Verified Modules
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-slate-100">{totalVerifiedCount}</span>
              <span className="text-xs text-slate-400">/ {report.items.length} modules</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Verified Matches (Agreement)
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-emerald-400">{verifyMatchesCount}</span>
              <span className="text-xs text-emerald-300/80 font-bold">({agreementPercentage}%)</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Flagged Discrepancies
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-amber-400">{verifyDiscrepanciesCount}</span>
              <span className="text-xs text-amber-300/80">AI Misclassifications</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
              Unverified Pending
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-cyan-400">
                {report.items.length - totalVerifiedCount}
              </span>
              <span className="text-xs text-slate-400">awaiting review</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={verifySearch}
              onChange={(e) => setVerifySearch(e.target.value)}
              placeholder="Search module to verify..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 border border-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setVerifyFilter("ALL")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                verifyFilter === "ALL"
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Modules ({report.items.length})
            </button>
            <button
              onClick={() => setVerifyFilter("VERIFIED")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                verifyFilter === "VERIFIED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Verified ({totalVerifiedCount})
            </button>
            <button
              onClick={() => setVerifyFilter("DISCREPANCY")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                verifyFilter === "DISCREPANCY"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Discrepancies ({verifyDiscrepanciesCount})
            </button>
            <button
              onClick={() => setVerifyFilter("UNVERIFIED")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                verifyFilter === "UNVERIFIED"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Unverified ({report.items.length - totalVerifiedCount})
            </button>
          </div>
        </div>

        {/* Verification Interactive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300 font-sans">
            <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-bold">Module Name</th>
                <th className="px-4 py-3 font-bold">Complexity (LOC / Cyclomatic)</th>
                <th className="px-4 py-3 font-bold">AI Model Prediction</th>
                <th className="px-4 py-3 font-bold text-center">Verify Result Toggle (Human Audit)</th>
                <th className="px-4 py-3 font-bold text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
              {filteredVerifyItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic font-sans text-xs">
                    No software modules match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVerifyItems.map((item) => {
                  const verifiedStatus = verificationsMap[item.id]; // "Actually Buggy" | "Actually Clean" | undefined
                  const aiStatus = item.predictedLabel === "Buggy" ? "Actually Buggy" : "Actually Clean";
                  const isMatch = verifiedStatus ? verifiedStatus === aiStatus : null;

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-3 font-sans font-semibold text-slate-200 max-w-[200px] truncate">
                        {item.moduleName}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        <span>{item.loc} LOC</span>
                        <span className="text-slate-500 mx-1.5">|</span>
                        <span>v(G)={item.cyclomaticComplexity}</span>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border inline-flex items-center space-x-1 ${
                              item.predictedLabel === "Buggy"
                                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {item.predictedLabel === "Buggy" ? (
                              <Bug className="w-3 h-3 text-rose-400" />
                            ) : (
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            )}
                            <span>{item.predictedLabel}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">({item.bugProbability}%)</span>
                        </div>
                      </td>

                      {/* Verify Result Interactive Toggle Buttons */}
                      <td className="px-4 py-3 text-center font-sans">
                        <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl space-x-1">
                          {/* Actually Buggy Toggle Button */}
                          <button
                            onClick={() => handleToggleVerification(item.id, "Actually Buggy")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                              verifiedStatus === "Actually Buggy"
                                ? "bg-rose-600 text-white shadow-md shadow-rose-900/40 border border-rose-500"
                                : "text-slate-400 hover:text-rose-300 hover:bg-slate-800"
                            }`}
                            title="Mark this module as manually verified: Actually Buggy"
                          >
                            <Bug className="w-3 h-3" />
                            <span>Actually Buggy</span>
                            {verifiedStatus === "Actually Buggy" && <Check className="w-3 h-3 ml-0.5" />}
                          </button>

                          {/* Actually Clean Toggle Button */}
                          <button
                            onClick={() => handleToggleVerification(item.id, "Actually Clean")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                              verifiedStatus === "Actually Clean"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40 border border-emerald-500"
                                : "text-slate-400 hover:text-emerald-300 hover:bg-slate-800"
                            }`}
                            title="Mark this module as manually verified: Actually Clean"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Actually Clean</span>
                            {verifiedStatus === "Actually Clean" && <Check className="w-3 h-3 ml-0.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Verification Status Badge */}
                      <td className="px-4 py-3 text-right font-sans">
                        {verifiedStatus ? (
                          isMatch ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-sm">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified Match</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700/80 shadow-sm">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>AI Discrepancy</span>
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Unverified</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Report Drawer/Modal View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Printable Defect Summary Report Preview
            </h3>
          </div>
          <span className="text-xs text-slate-400">Generated: {report.timestamp}</span>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <h4 className="font-bold text-white text-sm">CodeFix AI - Software Defect Quality Report</h4>
              <p className="text-[11px] text-slate-400">Dataset: {report.datasetName} ({report.totalModules} modules)</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[11px] text-cyan-400 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800">
                Classifier: {report.selectedModel}
              </span>
              <button
                onClick={handleExportPDF}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center py-2 bg-slate-900/60 rounded-lg">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Buggy</span>
              <span className="font-bold text-rose-400">{report.buggyCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Total Clean</span>
              <span className="font-bold text-emerald-400">{report.nonBuggyCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Accuracy</span>
              <span className="font-bold text-cyan-400">{activeMetrics.accuracy}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">F1 Score</span>
              <span className="font-bold text-purple-400">{activeMetrics.f1Score}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  color: "cyan" | "emerald" | "indigo" | "purple";
  icon: React.ComponentType<{ className?: string }>;
}> = ({ label, value, sub, color, icon: Icon }) => {
  const colorMap = {
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-950/30",
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30",
    indigo: "text-indigo-400 border-indigo-500/30 bg-indigo-950/30",
    purple: "text-purple-400 border-purple-500/30 bg-purple-950/30",
  };

  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color]} space-y-1 shadow-lg`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <Icon className="w-4 h-4 opacity-80" />
      </div>
      <div className="text-2xl font-black font-mono tracking-tight">{value}</div>
      <p className="text-[11px] text-slate-400 truncate">{sub}</p>
    </div>
  );
};
