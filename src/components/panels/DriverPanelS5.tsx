"use client";

import { useState } from "react";
import type { DriverRanking, DriverRankingEntry } from "@/types/explanation";

export function DriverPanelS5({ ranking }: { ranking: DriverRanking }) {
  const [tab, setTab] = useState<"positive" | "negative">("positive");

  const drivers     = ranking[tab];
  const posCount    = ranking.positive.length;
  const negCount    = ranking.negative.length;
  const maxAbsImpact = Math.max(...[...ranking.positive, ...ranking.negative]
    .map(d => d.abs_impact), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Signal Drivers</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Ranked by absolute impact · Backend-ordered · No client computation
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        <TabButton
          label="Positive"
          count={posCount}
          active={tab === "positive"}
          color="emerald"
          onClick={() => setTab("positive")}
        />
        <TabButton
          label="Negative"
          count={negCount}
          active={tab === "negative"}
          color="red"
          onClick={() => setTab("negative")}
        />
      </div>

      {/* Driver list */}
      {drivers.length === 0 ? (
        <p className="px-6 py-4 text-sm text-gray-400">No {tab} drivers.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {drivers.map((d, idx) => (
            <DriverRow
              key={`${d.trait}-${d.source_key}-${idx}`}
              driver={d}
              rank={idx + 1}
              maxAbsImpact={maxAbsImpact}
              isPositive={tab === "positive"}
            />
          ))}
        </div>
      )}

      <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Tie-breaking: |impact| desc → trait asc → source key asc
        </p>
      </div>
    </div>
  );
}

function TabButton({
  label, count, active, color, onClick,
}: {
  label:   string;
  count:   number;
  active:  boolean;
  color:   "emerald" | "red";
  onClick: () => void;
}) {
  const activeStyle = color === "emerald"
    ? "border-emerald-500 text-emerald-700"
    : "border-red-500 text-red-700";

  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active ? activeStyle : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
        active
          ? color === "emerald" ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-500"
      }`}>
        {count}
      </span>
    </button>
  );
}

function DriverRow({
  driver, rank, maxAbsImpact, isPositive,
}: {
  driver:       DriverRankingEntry;
  rank:         number;
  maxAbsImpact: number;
  isPositive:   boolean;
}) {
  const barPct = (driver.abs_impact / maxAbsImpact) * 100;

  return (
    <div className="px-6 py-3 flex items-center gap-4">
      <span className="text-xs font-mono text-gray-400 w-4 tabular-nums flex-shrink-0">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">
            {driver.description}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
            driver.source_type === "weighted_contribution"
              ? "bg-gray-100 text-gray-600"
              : driver.source_type === "interaction_adjustment"
              ? "bg-blue-50 text-blue-700"
              : "bg-red-50 text-red-700"
          }`}>
            {driver.source_type.replace("_", " ")}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{driver.trait}</span>
          {driver.family && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{driver.family}</span>
            </>
          )}
        </div>
      </div>
      <div className="w-28 flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              isPositive ? "bg-emerald-400" : "bg-red-400"
            }`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <span className={`text-xs font-mono tabular-nums w-12 text-right ${
          isPositive ? "text-emerald-700" : "text-red-700"
        }`}>
          {isPositive ? "+" : ""}{driver.impact.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
