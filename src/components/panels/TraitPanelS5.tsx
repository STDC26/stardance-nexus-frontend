"use client";

import { useState } from "react";
import type { TraitBreakdown } from "@/types/explanation";
import { TraitDrilldownDrawer } from "./TraitDrilldownDrawer";

interface TraitScore {
  [key: string]: number;
}

const TRAIT_ORDER = [
  "Trust","Authenticity","Ethics","Resonance",
  "Presence","Empathy","Momentum","Taste","Autonomy",
];
const SAFEGUARD_TRAITS = ["Trust","Authenticity","Ethics"];

export function TraitPanelS5({
  scores,
  breakdowns,
}: {
  scores:     TraitScore;
  breakdowns: Record<string, TraitBreakdown>;
}) {
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
  const hasBreakdowns = Object.keys(breakdowns).length > 0;

  const handleTraitClick = (trait: string) => {
    setSelectedTrait(prev => prev === trait ? null : trait);
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">HCTS Trait Scores</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              All 9 traits · Deterministic · 0–100
              {hasBreakdowns && (
                <span className="ml-1 text-blue-600">· Click any trait to inspect</span>
              )}
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {TRAIT_ORDER.map(trait => {
            const score       = scores[trait] ?? 0;
            const isSafeguard = SAFEGUARD_TRAITS.includes(trait);
            const isSelected  = selectedTrait === trait;
            const hasBreakdown = !!breakdowns[trait];

            return (
              <div key={trait}>
                <button
                  onClick={() => hasBreakdown && handleTraitClick(trait)}
                  className={`w-full px-6 py-3 text-left transition-colors ${
                    hasBreakdown
                      ? "hover:bg-gray-50 cursor-pointer"
                      : "cursor-default"
                  } ${isSelected ? "bg-blue-50" : ""}`}
                  disabled={!hasBreakdown}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{trait}</span>
                      {isSafeguard && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100
                                         text-gray-500 font-medium">
                          safeguard
                        </span>
                      )}
                      {hasBreakdown && (
                        <svg
                          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                            isSelected ? "rotate-180 text-blue-500" : ""
                          }`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round"
                            strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${
                      isSafeguard && score < 50 ? "text-red-700" :
                      score >= 80 ? "text-emerald-700" :
                      score >= 65 ? "text-blue-700" : "text-gray-700"
                    }`}>
                      {score}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isSafeguard && score < 50 ? "bg-red-500" :
                        score >= 80 ? "bg-emerald-500" :
                        score >= 65 ? "bg-blue-500" : "bg-gray-400"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </button>

                {/* Inline drill-down drawer */}
                {isSelected && breakdowns[trait] && (
                  <div className="px-4 pb-4 pt-1 bg-blue-50 border-t border-blue-100">
                    <TraitDrilldownDrawer
                      breakdown={breakdowns[trait]}
                      onClose={() => setSelectedTrait(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Safeguard minimums: Trust ≥ 50 · Authenticity ≥ 45 · Ethics ≥ 45
          </p>
        </div>
      </div>
    </div>
  );
}
