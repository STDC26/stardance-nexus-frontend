"use client";

import type { HCTSTraitScores } from "@/types/api";
import { TRAIT_ORDER, SAFEGUARD_TRAITS } from "@/types/api";

const TRAIT_DESCRIPTIONS: Record<keyof HCTSTraitScores, string> = {
  Trust:        "Credibility and reliability signals",
  Authenticity: "Genuine, unmanufactured feel",
  Ethics:       "Transparent, non-manipulative intent",
  Resonance:    "Emotional and contextual fit",
  Presence:     "Visual and sonic attention capture",
  Empathy:      "Human warmth and connection",
  Momentum:     "Pacing energy and forward drive",
  Taste:        "Aesthetic quality and restraint",
  Autonomy:     "Viewer agency, low pressure",
};

function traitColor(score: number, isSafeguard: boolean): string {
  if (isSafeguard && score < 50) return "bg-red-500";
  if (isSafeguard && score < 60) return "bg-amber-500";
  if (score >= 80) return "bg-emerald-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 50) return "bg-gray-400";
  return "bg-red-400";
}

function traitTextColor(score: number, isSafeguard: boolean): string {
  if (isSafeguard && score < 50) return "text-red-700";
  if (score >= 80) return "text-emerald-700";
  if (score >= 65) return "text-blue-700";
  return "text-gray-700";
}

export function TraitPanel({ scores }: { scores: HCTSTraitScores }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">HCTS Trait Scores</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          All 9 traits · Deterministic · 0–100
        </p>
      </div>

      <div className="divide-y divide-gray-50">
        {TRAIT_ORDER.map(trait => {
          const score       = scores[trait];
          const isSafeguard = SAFEGUARD_TRAITS.includes(trait);
          const barColor    = traitColor(score, isSafeguard);
          const textColor   = traitTextColor(score, isSafeguard);

          return (
            <div key={trait} className="px-6 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {trait}
                  </span>
                  {isSafeguard && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100
                                     text-gray-500 font-medium">
                      safeguard
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {TRAIT_DESCRIPTIONS[trait]}
                  </span>
                  <span className={`text-sm font-bold tabular-nums w-8 text-right ${textColor}`}>
                    {score}
                  </span>
                </div>
              </div>

              {/* Score bar — exact API value, no rounding or smoothing */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-none ${barColor}`}
                  style={{ width: `${score}%` }}
                />
              </div>

              {/* Safeguard threshold marker */}
              {isSafeguard && (
                <div className="relative h-0">
                  <div
                    className="absolute top-[-6px] w-px h-3 bg-red-300"
                    style={{ left: "50%" }}
                    title="Safeguard minimum (50)"
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
  );
}
