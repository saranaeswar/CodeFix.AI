import { SoftwareModuleRow, PreFlightCheckItem, PreFlightCheckResult } from "../types";

/**
 * Runs a comprehensive pre-flight diagnostic check on software metric datasets
 * to identify formatting, structural, data-type, and missing value errors before AI execution.
 */
export function runPreFlightCheck(
  rows: SoftwareModuleRow[],
  datasetName?: string
): PreFlightCheckResult {
  const checks: PreFlightCheckItem[] = [];

  if (!rows || rows.length === 0) {
    return {
      score: 0,
      overallStatus: "ERRORS",
      totalChecks: 1,
      passedCount: 0,
      warningCount: 0,
      failedCount: 1,
      checks: [
        {
          id: "check-empty",
          category: "File Structure",
          status: "FAIL",
          title: "Empty Dataset File",
          description: "No data rows were found in the uploaded file.",
          details: ["Please upload a CSV or Excel file containing software metrics rows."],
          fixable: false,
        },
      ],
      fixableCount: 0,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // --- CHECK 1: Header & Metric Attribute Standard Conformity ---
  let hasLOC = false;
  let hasCyclomatic = false;
  let hasHalstead = false;
  let hasCoupling = false;
  const headerDetails: string[] = [];

  rows.forEach((r) => {
    if (r.loc > 0) hasLOC = true;
    if (r.cyclomaticComplexity > 0) hasCyclomatic = true;
    if (r.halsteadVolume > 0) hasHalstead = true;
    if (r.coupling > 0) hasCoupling = true;
  });

  if (!hasLOC) headerDetails.push("Missing or zero 'Lines of Code' (LOC) attribute.");
  if (!hasCyclomatic) headerDetails.push("Missing or zero 'Cyclomatic Complexity v(G)' attribute.");
  if (!hasHalstead) headerDetails.push("Missing or zero 'Halstead Volume (V)' metric attribute.");
  if (!hasCoupling) headerDetails.push("Missing or zero 'Class Coupling (CBO)' metric attribute.");

  if (headerDetails.length === 0) {
    checks.push({
      id: "check-headers",
      category: "Header & Columns",
      status: "PASS",
      title: "Metric Attributes & Headers Verified",
      description: "All primary software engineering metric columns (LOC, McCabe, Halstead, CBO) are correctly present.",
      fixable: false,
    });
  } else {
    checks.push({
      id: "check-headers",
      category: "Header & Columns",
      status: "WARN",
      title: "Metric Headers Missing or Non-Standard",
      description: "Some standard metric columns could not be mapped to standard names.",
      details: headerDetails,
      fixable: true,
    });
  }

  // --- CHECK 2: Data Types & Non-Numeric Pollution Audit ---
  let nonNumericCount = 0;
  const nonNumericDetails: string[] = [];

  rows.forEach((r, idx) => {
    const isInvalidNumber = (val: any) =>
      val === undefined || val === null || isNaN(val) || typeof val === "string";

    if (isInvalidNumber(r.loc) || isInvalidNumber(r.cyclomaticComplexity) || isInvalidNumber(r.halsteadVolume)) {
      nonNumericCount++;
      if (nonNumericDetails.length < 5) {
        nonNumericDetails.push(
          `Row #${idx + 1} ('${r.moduleName || "Module"}'): Non-numeric character or string found in metric field.`
        );
      }
    }
  });

  if (nonNumericCount === 0) {
    checks.push({
      id: "check-numerics",
      category: "Data Types & Numerics",
      status: "PASS",
      title: "Numeric Data Types Consistent",
      description: "All software metric fields contain clean, parseable floating-point numbers.",
      fixable: false,
    });
  } else {
    checks.push({
      id: "check-numerics",
      category: "Data Types & Numerics",
      status: "WARN",
      title: "Non-Numeric Pollution Detected",
      description: `Found ${nonNumericCount} instance(s) of string characters or NaN values in numeric metric columns.`,
      details: nonNumericDetails,
      fixable: true,
    });
  }

  // --- CHECK 3: Range & Outliers Audit ---
  let negativeValCount = 0;
  let extremeOutlierCount = 0;
  const rangeDetails: string[] = [];

  rows.forEach((r, idx) => {
    if (r.loc < 0 || r.cyclomaticComplexity < 0 || r.halsteadVolume < 0 || r.coupling < 0) {
      negativeValCount++;
      if (rangeDetails.length < 5) {
        rangeDetails.push(`Row #${idx + 1} ('${r.moduleName}'): Negative metric value detected.`);
      }
    }
    if (r.loc > 50000 || r.cyclomaticComplexity > 300) {
      extremeOutlierCount++;
      if (rangeDetails.length < 5) {
        rangeDetails.push(`Row #${idx + 1} ('${r.moduleName}'): Extreme metric anomaly (LOC=${r.loc}, v(G)=${r.cyclomaticComplexity}).`);
      }
    }
  });

  if (negativeValCount === 0 && extremeOutlierCount === 0) {
    checks.push({
      id: "check-range",
      category: "Range & Outliers",
      status: "PASS",
      title: "Metric Ranges Within Valid Bounds",
      description: "No negative numbers or extreme parsing corruption detected in code metrics.",
      fixable: false,
    });
  } else {
    checks.push({
      id: "check-range",
      category: "Range & Outliers",
      status: "WARN",
      title: "Range Anomaly or Negative Metrics Found",
      description: `Detected ${negativeValCount} negative value(s) and ${extremeOutlierCount} extreme outlier(s).`,
      details: rangeDetails,
      fixable: true,
    });
  }

  // --- CHECK 4: Null & Missing Values Density ---
  let missingValueFields = 0;
  const missingDetails: string[] = [];

  rows.forEach((r, idx) => {
    const fieldsToCheck = [r.loc, r.cyclomaticComplexity, r.halsteadVolume, r.coupling, r.essentialComplexity];
    fieldsToCheck.forEach((val: any) => {
      if (val === null || val === undefined || val === "" || (typeof val === "number" && isNaN(val))) {
        missingValueFields++;
      }
    });
    if (!r.moduleName || r.moduleName.trim() === "") {
      missingValueFields++;
      if (missingDetails.length < 5) {
        missingDetails.push(`Row #${idx + 1}: Blank module name header.`);
      }
    }
  });

  if (missingValueFields === 0) {
    checks.push({
      id: "check-missing",
      category: "Null & Missing Values",
      status: "PASS",
      title: "Zero Missing Cells (100% Density)",
      description: "All module entries have complete metric values across every column.",
      fixable: false,
    });
  } else {
    checks.push({
      id: "check-missing",
      category: "Null & Missing Values",
      status: "WARN",
      title: "Missing Value Density Warning",
      description: `Identified ${missingValueFields} null/blank cell entries across dataset rows.`,
      details: missingDetails,
      fixable: true,
    });
  }

  // --- CHECK 5: Duplicate Rows Analysis ---
  const seenModuleNames = new Set<string>();
  const duplicateNames: string[] = [];

  rows.forEach((r) => {
    const key = r.moduleName.trim().toLowerCase();
    if (seenModuleNames.has(key)) {
      duplicateNames.push(r.moduleName);
    } else {
      seenModuleNames.add(key);
    }
  });

  if (duplicateNames.length === 0) {
    checks.push({
      id: "check-duplicates",
      category: "Duplicate Rows",
      status: "PASS",
      title: "Unique Module Identifiers",
      description: "No duplicate module names or identical row records detected.",
      fixable: false,
    });
  } else {
    checks.push({
      id: "check-duplicates",
      category: "Duplicate Rows",
      status: "WARN",
      title: "Duplicate Module Entries Found",
      description: `Found ${duplicateNames.length} duplicate module entry/entries in dataset.`,
      details: duplicateNames.slice(0, 5).map((d) => `Duplicate module identifier: '${d}'`),
      fixable: true,
    });
  }

  // --- CHECK 6: Ground-Truth Target Label Conformity ---
  let labeledCount = 0;
  let nonStandardLabels = 0;

  rows.forEach((r) => {
    if (r.actualBugLabel) {
      labeledCount++;
      if (r.actualBugLabel !== "Buggy" && r.actualBugLabel !== "Non-Buggy") {
        nonStandardLabels++;
      }
    }
  });

  if (labeledCount > 0 && nonStandardLabels === 0) {
    checks.push({
      id: "check-labels",
      category: "Target Labels",
      status: "PASS",
      title: "Ground-Truth Defect Labels Valid",
      description: `${labeledCount} modules contain standardized target labels ('Buggy' or 'Non-Buggy') for model evaluation.`,
      fixable: false,
    });
  } else if (labeledCount === 0) {
    checks.push({
      id: "check-labels",
      category: "Target Labels",
      status: "WARN",
      title: "Unlabeled Dataset (Unsupervised Inference)",
      description: "Dataset contains no historical defect labels. AI engine will perform unsupervised prediction.",
      details: ["Target labels are optional. AI model will predict bug risk percentages for all modules."],
      fixable: false,
    });
  } else {
    checks.push({
      id: "check-labels",
      category: "Target Labels",
      status: "WARN",
      title: "Non-Standard Target Labels Detected",
      description: `Found ${nonStandardLabels} target label(s) with custom naming.`,
      fixable: true,
    });
  }

  // --- CHECK 7: File Structure & Dataset Size Integrity ---
  if (rows.length >= 10) {
    checks.push({
      id: "check-structure",
      category: "File Structure",
      status: "PASS",
      title: "Dataset Volume Sufficient",
      description: `Dataset contains ${rows.length} module rows, providing adequate sample size for 5-Fold cross validation.`,
      fixable: false,
    });
  } else {
    checks.push({
      id: "check-structure",
      category: "File Structure",
      status: "WARN",
      title: "Small Dataset Size Warning",
      description: `Dataset contains only ${rows.length} modules. Recommend at least 15+ modules for optimal AI accuracy.`,
      details: ["Small dataset sizes may increase model variance."],
      fixable: false,
    });
  }

  // Calculate score and status
  const totalChecks = checks.length;
  const passedCount = checks.filter((c) => c.status === "PASS").length;
  const warningCount = checks.filter((c) => c.status === "WARN").length;
  const failedCount = checks.filter((c) => c.status === "FAIL").length;
  const fixableCount = checks.filter((c) => c.fixable).length;

  const score = Math.round((passedCount / totalChecks) * 100);
  let overallStatus: "READY" | "WARNINGS" | "ERRORS" = "READY";
  if (failedCount > 0) overallStatus = "ERRORS";
  else if (warningCount > 0) overallStatus = "WARNINGS";

  return {
    score,
    overallStatus,
    totalChecks,
    passedCount,
    warningCount,
    failedCount,
    checks,
    fixableCount,
    timestamp: new Date().toLocaleTimeString(),
  };
}

/**
 * Auto-corrects pre-flight dataset formatting issues (sanitizes negative numbers, imputes missing values,
 * deduplicates module names, and standardizes labels).
 */
export function autoFixPreFlightDataset(rows: SoftwareModuleRow[]): SoftwareModuleRow[] {
  const seen = new Set<string>();
  const sanitizedRows: SoftwareModuleRow[] = [];

  rows.forEach((row, idx) => {
    // Trim whitespace from module name or set fallback
    let moduleName = (row.moduleName || `Module_${idx + 1}`).trim();
    if (seen.has(moduleName.toLowerCase())) {
      moduleName = `${moduleName}_v${idx + 1}`;
    }
    seen.add(moduleName.toLowerCase());

    // Sanitize non-numerics & negative values
    const cleanNum = (val: any, fallback: number) => {
      const parsed = typeof val === "number" ? val : parseFloat(val);
      if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
        return fallback;
      }
      return parsed;
    };

    const loc = Math.max(1, Math.round(cleanNum(row.loc, 45)));
    const cyclomaticComplexity = Math.max(1, Math.round(cleanNum(row.cyclomaticComplexity, 5)));
    const halsteadVolume = Math.max(10, cleanNum(row.halsteadVolume, 350));
    const essentialComplexity = Math.max(1, cleanNum(row.essentialComplexity, 2));
    const designComplexity = Math.max(1, cleanNum(row.designComplexity, 3));
    const coupling = Math.max(0, cleanNum(row.coupling, 3));
    const commentRatio = Math.min(1.0, Math.max(0.0, cleanNum(row.commentRatio, 0.15)));

    // Standardize target labels
    let actualBugLabel = row.actualBugLabel;
    if (actualBugLabel) {
      const strVal = String(actualBugLabel).trim().toLowerCase();
      if (["buggy", "1", "true", "yes", "defect"].includes(strVal)) {
        actualBugLabel = "Buggy";
      } else if (["non-buggy", "clean", "0", "false", "no"].includes(strVal)) {
        actualBugLabel = "Non-Buggy";
      }
    }

    sanitizedRows.push({
      ...row,
      moduleName,
      loc,
      cyclomaticComplexity,
      halsteadVolume,
      essentialComplexity,
      designComplexity,
      coupling,
      commentRatio,
      actualBugLabel,
    });
  });

  return sanitizedRows;
}
