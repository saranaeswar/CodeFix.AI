import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  RefreshCw,
  Eye,
  Database,
  Layers,
  Search,
  Filter,
  Check,
  ArrowRight,
  HelpCircle,
  BarChart2,
  Files,
  FileCheck,
  ShieldCheck,
  Wrench,
  Download,
  X,
  CheckSquare,
} from "lucide-react";
import { SoftwareModuleRow, DatasetValidationResult, PreFlightCheckResult } from "../types";
import { SAMPLE_DATASETS } from "../data/sampleDatasets";
import { parseDatasetFile, validateDataset, removeDuplicates, sanitizeMissingValues } from "../utils/mlEngine";
import { runPreFlightCheck, autoFixPreFlightDataset } from "../utils/preFlightCheck";

interface DataUploadModuleProps {
  dataset: SoftwareModuleRow[] | null;
  datasetName: string | null;
  onDatasetLoaded: (rows: SoftwareModuleRow[], name: string) => void;
  onRemoveDataset?: () => void;
  onProceedToPrediction: () => void;
}

export const DataUploadModule: React.FC<DataUploadModuleProps> = ({
  dataset,
  datasetName,
  onDatasetLoaded,
  onRemoveDataset,
  onProceedToPrediction,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [page, setPage] = useState(1);
  const [batchSummaries, setBatchSummaries] = useState<
    { fileName: string; rowCount: number; fileSize: number }[]
  >([]);
  const pageSize = 10;

  // Pre-Flight Diagnostic State
  const [showPreFlightModal, setShowPreFlightModal] = useState<boolean>(false);
  const [preFlightResult, setPreFlightResult] = useState<PreFlightCheckResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validation: DatasetValidationResult | null = dataset ? validateDataset(dataset) : null;

  const handleRunPreFlightCheck = () => {
    if (!dataset || dataset.length === 0) return;
    const result = runPreFlightCheck(dataset, datasetName || "Uploaded_Dataset.csv");
    setPreFlightResult(result);
    setShowPreFlightModal(true);
  };

  const handleAutoFixPreFlight = () => {
    if (!dataset) return;
    const fixed = autoFixPreFlightDataset(dataset);
    const cleanName = datasetName ? `${datasetName.replace(/\.csv|\.xlsx|\.xls/g, "")}_PreFlightFixed.csv` : "Sanitized_Dataset.csv";
    onDatasetLoaded(fixed, cleanName);
    const reChecked = runPreFlightCheck(fixed, cleanName);
    setPreFlightResult(reChecked);
  };

  const handleExportPreFlightLog = () => {
    if (!preFlightResult) return;
    const logLines = [
      `=============================================================`,
      ` PRE-FLIGHT DATASET FORMATTING DIAGNOSTIC & READINESS REPORT`,
      `=============================================================`,
      `Dataset Name: ${datasetName || "Uploaded Dataset"}`,
      `Readiness Score: ${preFlightResult.score}% (${preFlightResult.overallStatus})`,
      `Generated At: ${preFlightResult.timestamp}`,
      `Summary: Passed ${preFlightResult.passedCount}/${preFlightResult.totalChecks} Checks | ${preFlightResult.warningCount} Warnings | ${preFlightResult.failedCount} Errors`,
      ``,
      `--- DETAILED DIAGNOSTIC SUITE RESULTS ---`,
      ...preFlightResult.checks.map(
        (c) =>
          `[${c.status}] Category: ${c.category}\nCheck: ${c.title}\nDescription: ${c.description}${
            c.details && c.details.length > 0 ? `\nDetails:\n  • ` + c.details.join("\n  • ") : ""
          }\n`
      ),
    ].join("\n");

    const blob = new Blob([logLines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PreFlight_Report_${(datasetName || "Dataset").replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFilesProcessing = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      if (files.length === 1) {
        const { rows, fileName, fileSize } = await parseDatasetFile(files[0]);
        setBatchSummaries([{ fileName, rowCount: rows.length, fileSize }]);
        onDatasetLoaded(rows, fileName);
      } else {
        // Process batch of multiple files concurrently
        const parsedResults = await Promise.all(files.map((file) => parseDatasetFile(file)));

        const summaries = parsedResults.map((res) => ({
          fileName: res.fileName,
          rowCount: res.rows.length,
          fileSize: res.fileSize,
        }));
        setBatchSummaries(summaries);

        let combinedRows: SoftwareModuleRow[] = [];
        parsedResults.forEach((res) => {
          const cleanName = res.fileName.replace(/\.[^/.]+$/, "");
          const prefixedRows = res.rows.map((r) => ({
            ...r,
            moduleName: `[${cleanName}] ${r.moduleName}`,
          }));
          combinedRows = combinedRows.concat(prefixedRows);
        });

        const batchName = `Batch Upload (${files.length} Files • ${combinedRows.length} Modules)`;
        onDatasetLoaded(combinedRows, batchName);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to parse uploaded dataset files.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesProcessing(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesProcessing(Array.from(e.dataTransfer.files));
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (sample) {
      setBatchSummaries([{ fileName: sample.fileName, rowCount: sample.modules.length, fileSize: 1024 * 18 }]);
      onDatasetLoaded(sample.modules, sample.fileName);
      setUploadError(null);
    }
  };

  const handleCleanDuplicates = () => {
    if (dataset) {
      const cleaned = removeDuplicates(dataset);
      onDatasetLoaded(cleaned, datasetName || "Cleaned_Dataset.csv");
    }
  };

  const handleFixMissingValues = () => {
    if (dataset) {
      const sanitized = sanitizeMissingValues(dataset);
      onDatasetLoaded(sanitized, datasetName || "Sanitized_Dataset.csv");
    }
  };

  const handleRemoveDataset = () => {
    setUploadError(null);
    setSearchQuery("");
    setPage(1);
    setBatchSummaries([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemoveDataset) {
      onRemoveDataset();
    }
  };

  // Filter dataset rows for preview
  const filteredRows = dataset
    ? dataset.filter(
        (r) =>
          r.moduleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(r.loc).includes(searchQuery) ||
          String(r.cyclomaticComplexity).includes(searchQuery)
      )
    : [];

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/80 rounded-full">
                Module 2
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Software Dataset Upload & Quality Validation
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Upload software project metrics datasets in <strong className="text-slate-200">CSV</strong> or{" "}
              <strong className="text-slate-200">Excel</strong> format. Automatically detects missing values, duplicate entries, and validates McCabe/Halstead metric compliance before AI model execution.
            </p>
          </div>

          {dataset && dataset.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={handleRunPreFlightCheck}
                className="px-4 py-2.5 bg-slate-950/90 hover:bg-cyan-950/80 hover:border-cyan-600/80 text-cyan-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                title="Run pre-flight diagnostic script to identify CSV/Excel formatting errors"
              >
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>Pre-Flight Check</span>
              </button>

              <button
                onClick={handleRemoveDataset}
                className="px-3.5 py-2.5 bg-slate-950/80 hover:bg-rose-950/80 hover:border-rose-700/80 text-slate-300 hover:text-rose-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                title="Remove dataset and reset state"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Remove Dataset</span>
              </button>

              <button
                onClick={onProceedToPrediction}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Proceed to AI Bug Prediction</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Dropzone & Sample Datasets Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone Box */}
        <div className="lg:col-span-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
              isDragOver
                ? "border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
              multiple
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              {isUploading ? (
                <RefreshCw className="w-7 h-7 animate-spin text-cyan-400" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            <h3 className="text-base font-bold text-white">
              {isUploading ? "Parsing & Batch-Analyzing Files..." : "Drop single or multiple dataset files here"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Supports selecting <strong className="text-slate-300">multiple CSV/Excel files at once</strong> to batch-analyze defect metrics across software modules simultaneously.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <Files className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-300 font-semibold">Multi-File Batch Enabled</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel (.xlsx)</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>CSV (.csv)</span>
              </span>
            </div>
          </div>

          {uploadError && (
            <div className="mt-3 p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Quick Sample Benchmark Loader Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                1-Click Sample Datasets
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don't have a file ready? Load standard software defect benchmark datasets instantly to test the AI prediction engine.
            </p>

            <div className="space-y-2 mt-4">
              {SAMPLE_DATASETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample.id)}
                  className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                      {sample.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                      {sample.modules.length} rows
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {sample.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Validation & Quality Audit Dashboard */}
      {dataset && validation && (
        <div className="space-y-6">
          {/* Multi-file batch breakdown card */}
          {batchSummaries.length > 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Files className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Batch Dataset Source Files ({batchSummaries.length} Files Loaded)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 border border-cyan-800/80 px-3 py-1 rounded-full self-start sm:self-auto">
                  Total Combined Modules: {validation.totalRows}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {batchSummaries.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between space-x-2 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate" title={f.fileName}>
                          {f.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {f.rowCount} modules • {f.fileSize > 0 ? `${(f.fileSize / 1024).toFixed(1)} KB` : "Parsed"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded shrink-0">
                      Merged
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Metrics Summary Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-xl border ${
                    validation.isValid
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {validation.isValid ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">{datasetName || "Uploaded Dataset"}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                        validation.isValid
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {validation.isValid ? "Validated & Ready" : "Validation Warnings"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {validation.totalRows} software module rows • {validation.totalColumns} attributes detected
                  </p>
                </div>
              </div>

              {/* Quality Fix & Reset Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRunPreFlightCheck}
                  className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Run automated pre-flight formatting check"
                >
                  <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Run Pre-Flight Check</span>
                </button>

                {validation.missingValuesCount > 0 && (
                  <button
                    onClick={handleFixMissingValues}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Auto-Impute Missing ({validation.missingValuesCount})</span>
                  </button>
                )}

                {validation.duplicateRowsCount > 0 && (
                  <button
                    onClick={handleCleanDuplicates}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Duplicates ({validation.duplicateRowsCount})</span>
                  </button>
                )}

                <button
                  onClick={handleRemoveDataset}
                  className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Remove current dataset and reset internal state"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Remove Dataset</span>
                </button>
              </div>
            </div>

            {/* Metric Attribute Compliance Pills */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Detected Software Metrics & Compliance Checklist:
              </span>
              <div className="flex flex-wrap gap-2">
                <MetricStatusBadge label="Lines of Code (LOC)" detected={validation.detectedMetrics.hasLOC} />
                <MetricStatusBadge label="Cyclomatic Complexity v(G)" detected={validation.detectedMetrics.hasCyclomatic} />
                <MetricStatusBadge label="Halstead Volume (V)" detected={validation.detectedMetrics.hasHalstead} />
                <MetricStatusBadge label="Class Coupling (CBO)" detected={validation.detectedMetrics.hasCoupling} />
                <MetricStatusBadge label="Bug Labels (Ground Truth)" detected={validation.detectedMetrics.hasLabel} />
              </div>
            </div>

            {/* Issues and Warnings Callouts */}
            {validation.warnings.length > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Data Quality Recommendations:</span>
                </span>
                <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-0.5 pl-1">
                  {validation.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Dataset Preview Table Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Dataset Preview Before Processing</h3>
                <span className="text-xs font-mono text-slate-400">({filteredRows.length} modules)</span>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by module or metric..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Scrollable Data Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300 font-sans">
                <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-bold">#</th>
                    <th className="px-4 py-3 font-bold">Module / Component</th>
                    <th className="px-4 py-3 font-bold">LOC</th>
                    <th className="px-4 py-3 font-bold">Cyclomatic v(G)</th>
                    <th className="px-4 py-3 font-bold">Halstead Vol</th>
                    <th className="px-4 py-3 font-bold">Coupling</th>
                    <th className="px-4 py-3 font-bold">Status / Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-4 py-2.5 text-slate-500 font-sans">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="px-4 py-2.5 font-sans font-semibold text-slate-200">
                          {row.moduleName}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">
                          {row.loc}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              row.cyclomaticComplexity > 15
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : row.cyclomaticComplexity > 10
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "text-slate-300"
                            }`}
                          >
                            {row.cyclomaticComplexity}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">{row.halsteadVolume}</td>
                        <td className="px-4 py-2.5 text-slate-300">{row.coupling}</td>
                        <td className="px-4 py-2.5 font-sans">
                          {row.actualBugLabel ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                row.actualBugLabel === "Buggy"
                                  ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {row.actualBugLabel}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">Unlabelled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500 font-sans italic">
                        No modules match the filter query "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>
                  Showing Page {page} of {totalPages} ({filteredRows.length} total entries)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded border border-slate-700 text-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded border border-slate-700 text-slate-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pre-Flight Format Diagnostic Modal */}
      {showPreFlightModal && preFlightResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">Pre-Flight Dataset Format Diagnostic</h3>
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-[10px] font-mono font-bold">
                      Script Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automated metric format, schema header, data-type, and structural integrity audit for{" "}
                    <strong className="text-slate-200">{datasetName || "Uploaded Dataset"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreFlightModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Pre-Flight Score Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xl border shrink-0 ${
                      preFlightResult.overallStatus === "READY"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : preFlightResult.overallStatus === "WARNINGS"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    <span>{preFlightResult.score}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-sans opacity-80">Score</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {preFlightResult.overallStatus === "READY"
                        ? "Pre-Flight Status: Ready for AI Execution"
                        : preFlightResult.overallStatus === "WARNINGS"
                        ? "Pre-Flight Status: Minor Formatting Warnings"
                        : "Pre-Flight Status: Formatting Errors Identified"}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Passed <strong className="text-emerald-400">{preFlightResult.passedCount}</strong> out of{" "}
                      <strong className="text-slate-200">{preFlightResult.totalChecks}</strong> diagnostic checks.
                      {preFlightResult.fixableCount > 0 && (
                        <span className="text-cyan-300 font-semibold ml-1">
                          ({preFlightResult.fixableCount} formatting issues auto-repairable)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {preFlightResult.fixableCount > 0 && (
                    <button
                      onClick={handleAutoFixPreFlight}
                      className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-900/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Auto-Fix Formatting Errors</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Check Suite Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Diagnostic Test Suite Results:
                </h4>
                <div className="space-y-2.5">
                  {preFlightResult.checks.map((check) => (
                    <div
                      key={check.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              check.status === "PASS"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : check.status === "WARN"
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {check.status}
                          </span>
                          <span className="text-xs font-bold text-slate-200">{check.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {check.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{check.description}</p>
                      {check.details && check.details.length > 0 && (
                        <ul className="list-disc list-inside text-[11px] text-amber-300/90 font-mono space-y-0.5 pl-1 pt-1 bg-amber-950/20 p-2 rounded-lg border border-amber-900/30">
                          {check.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
              <button
                onClick={handleExportPreFlightLog}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Diagnostic Log (.txt)</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPreFlightModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer"
                >
                  Close Diagnostic
                </button>
                <button
                  onClick={() => {
                    setShowPreFlightModal(false);
                    onProceedToPrediction();
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Proceed to AI Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricStatusBadge: React.FC<{ label: string; detected: boolean }> = ({ label, detected }) => (
  <span
    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 ${
      detected
        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
        : "bg-slate-800/80 text-slate-400 border-slate-700"
    }`}
  >
    {detected ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <span className="w-2 h-2 rounded-full bg-slate-500" />
    )}
    <span>{label}</span>
  </span>
);
