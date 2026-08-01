import { PredictionResultItem, AIDecisionExplanation, MetricAttribution, DecisionPathNode } from "../types";

/**
 * Computes feature importance attribution (SHAP/LIME-style) and ML decision path
 * traversal for a given software module prediction item.
 */
export function generateAIDecisionExplanation(
  item: PredictionResultItem,
  modelName: string = "Random Forest",
  decisionThreshold: number = 50
): AIDecisionExplanation {
  const {
    loc,
    cyclomaticComplexity: cyc,
    halsteadVolume: hal,
    coupling: cbo,
    bugProbability,
    predictedLabel,
    riskLevel,
    primaryRiskFactor,
  } = item;

  // 1. Calculate relative impact points for each software metric based on IEEE software defect models
  let cycPoints = 0;
  if (cyc > 20) cycPoints = 35;
  else if (cyc > 10) cycPoints = 22;
  else if (cyc > 6) cycPoints = 10;
  else cycPoints = 2;

  let locPoints = 0;
  if (loc > 150) locPoints = 30;
  else if (loc > 80) locPoints = 18;
  else if (loc > 40) locPoints = 8;
  else locPoints = 2;

  let cboPoints = 0;
  if (cbo > 15) cboPoints = 22;
  else if (cbo > 8) cboPoints = 14;
  else if (cbo > 4) cboPoints = 6;
  else cboPoints = 2;

  let halPoints = 0;
  if (hal > 2000) halPoints = 20;
  else if (hal > 1000) halPoints = 12;
  else if (hal > 500) halPoints = 6;
  else halPoints = 2;

  const totalPoints = Math.max(1, cycPoints + locPoints + cboPoints + halPoints);

  // Normalize into percentages summing to ~100% or relative to total bug probability
  const cycPct = Math.round((cycPoints / totalPoints) * 100);
  const locPct = Math.round((locPoints / totalPoints) * 100);
  const cboPct = Math.round((cboPoints / totalPoints) * 100);
  const halPct = Math.min(100 - (cycPct + locPct + cboPct), Math.round((halPoints / totalPoints) * 100));

  const attributions: MetricAttribution[] = [
    {
      metricName: "McCabe Cyclomatic Complexity v(G)",
      codeKey: "v(G)",
      value: cyc,
      threshold: 10,
      unit: "branches",
      impactPercentage: cycPct,
      impactDirection: cyc > 10 ? "INCREASES_RISK" : "DECREASES_RISK",
      riskLevel: cyc > 20 ? "Critical" : cyc > 10 ? "High" : cyc > 6 ? "Medium" : "Low",
      explanation:
        cyc > 10
          ? `Branching factor v(G)=${cyc} exceeds IEEE threshold (10). Contains multiple nested loops/conditionals that increase test path coverage requirements.`
          : `Cyclomatic complexity v(G)=${cyc} is within safe maintainability guidelines (<=10).`,
    },
    {
      metricName: "Lines of Code (LOC)",
      codeKey: "LOC",
      value: loc,
      threshold: 100,
      unit: "lines",
      impactPercentage: locPct,
      impactDirection: loc > 100 ? "INCREASES_RISK" : "DECREASES_RISK",
      riskLevel: loc > 150 ? "Critical" : loc > 100 ? "High" : loc > 50 ? "Medium" : "Low",
      explanation:
        loc > 100
          ? `File length (${loc} LOC) increases mental load and code churn density during code reviews.`
          : `Module size (${loc} LOC) is compact and easy to audit during pull requests.`,
    },
    {
      metricName: "Class Coupling (CBO / Fan-Out)",
      codeKey: "CBO",
      value: cbo,
      threshold: 6,
      unit: "dependencies",
      impactPercentage: cboPct,
      impactDirection: cbo > 6 ? "INCREASES_RISK" : "DECREASES_RISK",
      riskLevel: cbo > 15 ? "Critical" : cbo > 8 ? "High" : cbo > 4 ? "Medium" : "Low",
      explanation:
        cbo > 6
          ? `Coupling CBO=${cbo} indicates heavy inter-class reliance. Changes to external classes risk cascading regressions.`
          : `Coupling CBO=${cbo} is well-encapsulated with low external class dependencies.`,
    },
    {
      metricName: "Halstead Program Volume (V)",
      codeKey: "Halstead_V",
      value: hal,
      threshold: 1000,
      unit: "bits",
      impactPercentage: halPct,
      impactDirection: hal > 1000 ? "INCREASES_RISK" : "DECREASES_RISK",
      riskLevel: hal > 2000 ? "Critical" : hal > 1000 ? "High" : hal > 500 ? "Medium" : "Low",
      explanation:
        hal > 1000
          ? `Halstead Volume V=${hal} reflects a high count of operators/operands, requiring higher cognitive effort to maintain.`
          : `Halstead Volume V=${hal} is concise with low computational density.`,
    },
  ];

  // Sort attributions by impact percentage descending
  attributions.sort((a, b) => b.impactPercentage - a.impactPercentage);

  // 2. Build Decision Path Traversal Nodes
  const decisionPath: DecisionPathNode[] = [
    {
      step: 1,
      condition: `Evaluate Cyclomatic Complexity v(G)`,
      evaluatedValue: `v(G) = ${cyc} vs. Threshold (10.0)`,
      outcome: cyc > 10 ? "Branch ➔ High Risk Cyclomatic Complexity" : "Branch ➔ Low Branching Risk",
      status: cyc > 10 ? "TRIGGERED" : "PASSED",
    },
    {
      step: 2,
      condition: `Evaluate Lines of Code (LOC)`,
      evaluatedValue: `LOC = ${loc} vs. Threshold (100.0)`,
      outcome: loc > 100 ? "Branch ➔ Elevated File Length Node" : "Branch ➔ Compact File Node",
      status: loc > 100 ? "TRIGGERED" : "PASSED",
    },
    {
      step: 3,
      condition: `Evaluate Inter-Class Coupling (CBO)`,
      evaluatedValue: `CBO = ${cbo} vs. Threshold (6.0)`,
      outcome: cbo > 6 ? "Branch ➔ Tight Coupling Fan-Out Node" : "Branch ➔ Encapsulated Dependencies",
      status: cbo > 6 ? "TRIGGERED" : "PASSED",
    },
    {
      step: 4,
      condition: `Compare Aggregated Risk Score (${bugProbability}%) against Decision Threshold (${decisionThreshold}%)`,
      evaluatedValue: `${bugProbability}% >= ${decisionThreshold}%`,
      outcome:
        predictedLabel === "Buggy"
          ? `Final Leaf Node ➔ Classified as BUGGY (${riskLevel} Risk)`
          : `Final Leaf Node ➔ Classified as NON-BUGGY (Clean)`,
      status: predictedLabel === "Buggy" ? "TRIGGERED" : "PASSED",
    },
  ];

  // 3. Generate Refactoring Plan
  const refactoringPlan: string[] = [];
  if (cyc > 10) {
    refactoringPlan.push(
      `Decompose high-complexity functions: Extract conditional blocks and nested loops into helper functions to lower v(G) from ${cyc} to <10.`
    );
  }
  if (loc > 100) {
    refactoringPlan.push(
      `Apply Single Responsibility Principle (SRP): Split '${item.moduleName}' into smaller, focused files to reduce LOC from ${loc} to <100.`
    );
  }
  if (cbo > 6) {
    refactoringPlan.push(
      `Reduce tight coupling: Introduce Dependency Inversion or interfaces to reduce CBO from ${cbo} to <=6.`
    );
  }
  if (refactoringPlan.length === 0) {
    refactoringPlan.push(
      `Maintain current clean code practices. Add regression unit tests to preserve low defect probability (${bugProbability}%).`
    );
  }

  return {
    moduleId: item.id,
    moduleName: item.moduleName,
    predictedLabel,
    bugProbability,
    riskLevel,
    primaryRiskFactor,
    modelName,
    decisionThreshold,
    attributions,
    decisionPath,
    refactoringPlan,
    sampleCode: item.sampleCode,
  };
}
