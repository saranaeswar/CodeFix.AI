import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PredictionResultItem } from "../types";
import {
  Flame,
  Grid,
  Info,
  Filter,
  Maximize2,
  Bug,
  ShieldCheck,
  Zap,
  Sliders,
  Layers,
} from "lucide-react";

interface BugDensityHeatmapProps {
  items: PredictionResultItem[];
  onSelectModule?: (item: PredictionResultItem) => void;
}

export const BugDensityHeatmap: React.FC<BugDensityHeatmapProps> = ({
  items,
  onSelectModule,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [heatmapMode, setHeatmapMode] = useState<"binned-matrix" | "module-tiles">("binned-matrix");
  const [colorScheme, setColorScheme] = useState<"inferno" | "cyber" | "rose">("inferno");
  const [selectedCell, setSelectedCell] = useState<{
    locBin: string;
    cycBin: string;
    modules: PredictionResultItem[];
    avgDensity: number;
    avgProb: number;
  } | null>(null);

  const [hoveredTile, setHoveredTile] = useState<PredictionResultItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute bug density for items: Defects per 1000 Lines of Code (or Prob / LOC * 10)
  const itemsWithDensity = items.map((item) => {
    const density = item.loc > 0 ? (item.bugProbability * 10) / item.loc : 0;
    return {
      ...item,
      density: Math.round(density * 10) / 10, // defects per KLOC equivalent score
    };
  });

  // Binning logic for 2D Matrix
  const locBins = ["<50 LOC", "50-100 LOC", "101-200 LOC", "201-500 LOC", ">500 LOC"];
  const cycBins = ["v(G) 1-5 (Low)", "v(G) 6-10 (Med)", "v(G) 11-20 (High)", "v(G) >20 (Critical)"];

  const getLocBin = (loc: number) => {
    if (loc < 50) return locBins[0];
    if (loc <= 100) return locBins[1];
    if (loc <= 200) return locBins[2];
    if (loc <= 500) return locBins[3];
    return locBins[4];
  };

  const getCycBin = (cyc: number) => {
    if (cyc <= 5) return cycBins[0];
    if (cyc <= 10) return cycBins[1];
    if (cyc <= 20) return cycBins[2];
    return cycBins[3];
  };

  // Build matrix grid data
  const matrixData: {
    locBin: string;
    cycBin: string;
    modules: PredictionResultItem[];
    avgDensity: number;
    avgProb: number;
    buggyCount: number;
  }[] = [];

  locBins.forEach((lBin) => {
    cycBins.forEach((cBin) => {
      const cellModules = itemsWithDensity.filter(
        (m) => getLocBin(m.loc) === lBin && getCycBin(m.cyclomaticComplexity) === cBin
      );
      const avgDensity =
        cellModules.length > 0
          ? cellModules.reduce((acc, curr) => acc + curr.density, 0) / cellModules.length
          : 0;
      const avgProb =
        cellModules.length > 0
          ? cellModules.reduce((acc, curr) => acc + curr.bugProbability, 0) / cellModules.length
          : 0;
      const buggyCount = cellModules.filter((m) => m.predictedLabel === "Buggy").length;

      matrixData.push({
        locBin: lBin,
        cycBin: cBin,
        modules: cellModules,
        avgDensity: Math.round(avgDensity * 10) / 10,
        avgProb: Math.round(avgProb),
        buggyCount,
      });
    });
  });

  const maxDensity = Math.max(...matrixData.map((d) => d.avgDensity), 10);

  // Render D3 Binned Matrix
  useEffect(() => {
    if (heatmapMode !== "binned-matrix" || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerWidth = containerRef.current.clientWidth || 700;
    const margin = { top: 40, right: 30, bottom: 60, left: 140 };
    const width = containerWidth - margin.left - margin.right;
    const height = 340 - margin.top - margin.bottom;

    const g = svg
      .attr("width", containerWidth)
      .attr("height", 340)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3.scaleBand().domain(locBins).range([0, width]).padding(0.08);

    // Y Scale
    const y = d3.scaleBand().domain(cycBins).range([height, 0]).padding(0.08);

    // Color Scale
    let colorScale: (val: number) => string;
    if (colorScheme === "inferno") {
      const interpolator = d3.scaleSequential(d3.interpolateInferno).domain([0, maxDensity * 1.1]);
      colorScale = (val: number) => (val === 0 ? "#0f172a" : interpolator(val));
    } else if (colorScheme === "cyber") {
      colorScale = d3
        .scaleLinear<string>()
        .domain([0, maxDensity * 0.4, maxDensity])
        .range(["#030712", "#06b6d4", "#f43f5e"]);
    } else {
      colorScale = d3
        .scaleLinear<string>()
        .domain([0, maxDensity * 0.5, maxDensity])
        .range(["#020617", "#f59e0b", "#e11d48"]);
    }

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .style("font-size", "11px")
      .style("font-family", "monospace");

    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 42)
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text("MODULE SIZE TIER (Lines of Code)");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .style("font-size", "11px")
      .style("font-family", "sans-serif");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -110)
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text("CYCLOMATIC COMPLEXITY");

    // Remove axis domain lines for modern look
    g.selectAll(".domain").remove();
    g.selectAll(".tick line").attr("stroke", "#1e293b");

    // Draw Heatmap Rectangles
    g.selectAll("rect.cell")
      .data(matrixData)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", (d) => x(d.locBin) || 0)
      .attr("y", (d) => y(d.cycBin) || 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", (d) => (d.modules.length === 0 ? "#090d16" : colorScale(d.avgDensity)))
      .attr("stroke", (d) => (d.avgProb > 65 ? "#f43f5e" : "#1e293b"))
      .attr("stroke-width", (d) => (d.avgProb > 65 ? 1.5 : 1))
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 2.5)
          .attr("filter", "brightness(1.2)");
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .attr("stroke", d.avgProb > 65 ? "#f43f5e" : "#1e293b")
          .attr("stroke-width", d.avgProb > 65 ? 1.5 : 1)
          .attr("filter", "none");
      })
      .on("click", (event, d) => {
        setSelectedCell(d);
      });

    // Add cell labels (Module Count & Avg Prob)
    g.selectAll("text.cell-count")
      .data(matrixData)
      .enter()
      .append("text")
      .attr("class", "cell-count")
      .attr("x", (d) => (x(d.locBin) || 0) + x.bandwidth() / 2)
      .attr("y", (d) => (y(d.cycBin) || 0) + y.bandwidth() / 2 - 4)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => (d.modules.length === 0 ? "#334155" : d.avgDensity > maxDensity * 0.5 ? "#ffffff" : "#e2e8f0"))
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .text((d) => (d.modules.length === 0 ? "Empty" : `${d.modules.length} Mods`));

    g.selectAll("text.cell-density")
      .data(matrixData)
      .enter()
      .append("text")
      .attr("class", "cell-density")
      .attr("x", (d) => (x(d.locBin) || 0) + x.bandwidth() / 2)
      .attr("y", (d) => (y(d.cycBin) || 0) + y.bandwidth() / 2 + 12)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => (d.buggyCount > 0 ? "#fb7185" : "#38bdf8"))
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .text((d) => (d.modules.length === 0 ? "" : `${d.buggyCount} Buggy (${d.avgProb}%)`));
  }, [heatmapMode, colorScheme, items, maxDensity]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              D3.js Software Bug Density & Defect Cluster Heatmap
            </h3>
            <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-full text-[10px] font-mono font-bold">
              Visual Risk Clustering
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Heatmap clustering software modules across <strong className="text-slate-200">Lines of Code (LOC)</strong> and <strong className="text-slate-200">Cyclomatic Complexity v(G)</strong>. Darker & redder cells signal concentrated bug hotspots requiring immediate refactoring.
          </p>
        </div>

        {/* View Mode & Color Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 border border-slate-800 rounded-xl">
            <button
              onClick={() => setHeatmapMode("binned-matrix")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                heatmapMode === "binned-matrix"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Complexity Grid Matrix</span>
            </button>

            <button
              onClick={() => setHeatmapMode("module-tiles")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                heatmapMode === "module-tiles"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Module Tiles ({items.length})</span>
            </button>
          </div>

          {/* Color Palette Picker */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 border border-slate-800 rounded-xl text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-semibold"
            >
              <option value="inferno" className="bg-slate-900">Fiery Inferno</option>
              <option value="cyber" className="bg-slate-900">Cyber Cyan-Rose</option>
              <option value="rose" className="bg-slate-900">Spectral Red</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualization Body */}
      {heatmapMode === "binned-matrix" ? (
        <div className="space-y-4">
          <div ref={containerRef} className="w-full overflow-x-auto bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <svg ref={svgRef} className="w-full h-auto min-w-[650px]" />
          </div>

          {/* Color Scale Legend Bar */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="flex items-center space-x-1 font-bold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Low Bug Density (Clean Cluster)</span>
            </span>

            <div className="flex-1 max-w-md mx-4 h-3 rounded-full bg-gradient-to-r from-slate-950 via-amber-500 to-rose-600 border border-slate-800" />

            <span className="flex items-center space-x-1 font-bold text-rose-400">
              <Bug className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>Critical Bug Cluster Hotspot</span>
            </span>
          </div>
        </div>
      ) : (
        /* Tile View Mode */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>All software modules sized & colored by defect probability density:</span>
            <span className="font-mono text-cyan-400 font-bold">{items.length} Modules</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[420px] overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
            {itemsWithDensity
              .sort((a, b) => b.bugProbability - a.bugProbability)
              .map((mod) => {
                const isBuggy = mod.predictedLabel === "Buggy";

                return (
                  <div
                    key={mod.id}
                    onClick={() => onSelectModule && onSelectModule(mod)}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                      isBuggy
                        ? "bg-gradient-to-br from-rose-950/60 to-slate-900 border-rose-800/80 hover:border-rose-500 hover:shadow-lg shadow-rose-950/30"
                        : "bg-slate-900/80 border-slate-800 hover:border-emerald-500/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[80px]" title={mod.moduleName}>
                          {mod.moduleName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isBuggy ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {mod.bugProbability}%
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 truncate" title={mod.moduleName}>
                        {mod.moduleName}
                      </h4>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>LOC: {mod.loc}</span>
                      <span>v(G): {mod.cyclomaticComplexity}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Selected Cell Modal / Drawer Detail */}
      {selectedCell && (
        <div className="p-4 bg-slate-950 border border-indigo-500/40 rounded-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Inspect Heatmap Cluster: {selectedCell.locBin} | {selectedCell.cycBin}
              </h4>
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs font-bold text-slate-400 hover:text-white px-2 py-0.5 bg-slate-900 rounded border border-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Total Modules</span>
              <span className="text-sm font-bold text-white">{selectedCell.modules.length}</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Avg Bug Density</span>
              <span className="text-sm font-bold text-rose-400">{selectedCell.avgDensity} Score</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Avg Bug Prob</span>
              <span className="text-sm font-bold text-cyan-400">{selectedCell.avgProb}%</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Buggy Count</span>
              <span className="text-sm font-bold text-rose-500 font-mono">
                {selectedCell.modules.filter((m) => m.predictedLabel === "Buggy").length}
              </span>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto divide-y divide-slate-800/80 rounded-lg border border-slate-800 bg-slate-900 text-xs">
            {selectedCell.modules.map((m) => (
              <div key={m.id} className="p-2.5 flex items-center justify-between hover:bg-slate-850">
                <div>
                  <span className="font-bold text-slate-200 block">{m.moduleName}</span>
                  <span className="text-[10px] text-slate-500">LOC: {m.loc} | Cyc: {m.cyclomaticComplexity}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.predictedLabel === "Buggy"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {m.predictedLabel} ({m.bugProbability}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
