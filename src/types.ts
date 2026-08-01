export interface CodeFixResult {
  success: boolean;
  language: string;
  status: "BUG_FOUND" | "NO_BUG";
  explanation: string;
  code: string;
  originalCode: string;
  rawOutput: string;
  timestamp: string;
  id?: string;
}

export interface BugPreset {
  id: string;
  title: string;
  language: string;
  category: "Syntax Error" | "Runtime Error" | "Logical Error" | "Type Safety" | "No Bug (Clean Code)";
  description: string;
  code: string;
}

export interface HistoryItem extends CodeFixResult {
  id: string;
  snippetTitle: string;
}

export type ViewMode = "side-by-side" | "unified" | "fixed-only" | "raw-format";

export type ActiveTab = "code-editor" | "data-upload" | "bug-prediction" | "results-reports" | "user-management";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organization: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  bio?: string;
  themePreference?: "dark" | "light" | "system";
}

export interface SoftwareModuleRow {
  id: string;
  moduleName: string;
  loc: number;
  cyclomaticComplexity: number;
  halsteadVolume: number;
  essentialComplexity: number;
  designComplexity: number;
  coupling: number;
  commentRatio: number;
  actualBugLabel?: "Buggy" | "Non-Buggy" | null;
  [key: string]: any;
}

export interface DatasetValidationResult {
  isValid: boolean;
  totalRows: number;
  totalColumns: number;
  columns: string[];
  missingValuesCount: number;
  missingValueDetails: { column: string; missingCount: number }[];
  duplicateRowsCount: number;
  duplicateRowIndices: number[];
  detectedMetrics: {
    hasLOC: boolean;
    hasCyclomatic: boolean;
    hasHalstead: boolean;
    hasCoupling: boolean;
    hasLabel: boolean;
  };
  issues: string[];
  warnings: string[];
}

export interface PredictionResultItem {
  id: string;
  moduleName: string;
  predictedLabel: "Buggy" | "Non-Buggy";
  bugProbability: number; // 0 - 100
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  loc: number;
  cyclomaticComplexity: number;
  halsteadVolume: number;
  coupling: number;
  actualLabel?: "Buggy" | "Non-Buggy";
  userVerification?: "Actually Buggy" | "Actually Clean" | "Unverified";
  isCorrect?: boolean;
  primaryRiskFactor: string;
  aiRecommendation: string;
  sampleCode?: string;
}

export interface ModelPerformanceMetrics {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  rocAuc: number;
  featureImportance: { feature: string; importance: number }[];
}

export interface ModelHyperparameters {
  learningRate: number; // 0.01 - 0.50
  decisionThreshold: number; // 10 - 90 (%)
  batchSize: number; // 16, 32, 64, 128, 256
  numberOfEstimators: number; // 10 - 300
  maxDepth: number; // 2 - 15
  featureScaling: "StandardScaler" | "MinMaxScaler" | "RobustScaler" | "None";
  crossValidationFolds: number; // 3, 5, 10
}

export interface PreFlightCheckItem {
  id: string;
  category: "Header & Columns" | "Data Types & Numerics" | "Range & Outliers" | "Null & Missing Values" | "Duplicate Rows" | "Target Labels" | "File Structure";
  status: "PASS" | "WARN" | "FAIL";
  title: string;
  description: string;
  details?: string[];
  fixable: boolean;
}

export interface PreFlightCheckResult {
  score: number; // 0 - 100
  overallStatus: "READY" | "WARNINGS" | "ERRORS";
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  checks: PreFlightCheckItem[];
  fixableCount: number;
  timestamp: string;
}

export interface MetricAttribution {
  metricName: string;
  codeKey: string;
  value: number | string;
  threshold: number | string;
  unit?: string;
  impactPercentage: number; // e.g. 38%
  impactDirection: "INCREASES_RISK" | "DECREASES_RISK" | "NEUTRAL";
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  explanation: string;
}

export interface DecisionPathNode {
  step: number;
  condition: string;
  evaluatedValue: string;
  outcome: string;
  status: "PASSED" | "TRIGGERED";
}

export interface AIDecisionExplanation {
  moduleId: string;
  moduleName: string;
  predictedLabel: "Buggy" | "Non-Buggy";
  bugProbability: number;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  primaryRiskFactor: string;
  modelName: string;
  decisionThreshold: number;
  attributions: MetricAttribution[];
  decisionPath: DecisionPathNode[];
  refactoringPlan: string[];
  sampleCode?: string;
}

export interface MultiModelPrediction {
  modelName: string;
  metrics: ModelPerformanceMetrics;
  items: PredictionResultItem[];
  buggyCount: number;
  nonBuggyCount: number;
}

export interface PredictionSessionReport {
  id: string;
  datasetName: string;
  timestamp: string;
  totalModules: number;
  buggyCount: number;
  nonBuggyCount: number;
  selectedModel: string;
  hyperparameters?: ModelHyperparameters;
  metrics: ModelPerformanceMetrics;
  allModelMetrics: ModelPerformanceMetrics[];
  items: PredictionResultItem[];
  multiModelResults?: MultiModelPrediction[];
}

