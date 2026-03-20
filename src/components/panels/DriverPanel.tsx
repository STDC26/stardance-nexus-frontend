"use client";

import type { HCTSTraitScores, ModifierParameters } from "@/types/api";

// ---------------------------------------------------------------------------
// Driver derivation — read from actual parameter values and trait scores.
// No scoring recalculation. Drivers are derived from the same weight table
// structure used in the CIS scorer, presented as signal attribution only.
// ---------------------------------------------------------------------------

interface Driver {
  label:      string;
  family:     string;
  trait:      keyof HCTSTraitScores;
  direction:  "positive" | "negative";
  signal:     number; // relative signal strength 0–1
}

const PARAM_TRAIT_SIGNALS: Array<{
  family:    keyof ModifierParameters;
  label:     string;
  trait:     keyof HCTSTraitScores;
  direction: "positive" | "negative";
  weight:    number;
}> = [
  { family: "audio",       label: "Voice Tone",       trait: "Trust",        direction: "positive", weight: 0.90 },
  { family: "audio",       label: "Voice Tone",       trait: "Empathy",      direction: "positive", weight: 0.85 },
  { family: "composition", label: "Camera Angle",     trait: "Trust",        direction: "positive", weight: 0.80 },
  { family: "composition", label: "Framing",          trait: "Presence",     direction: "positive", weight: 0.75 },
  { family: "color",       label: "Color Grade",      trait: "Authenticity", direction: "positive", weight: 0.72 },
  { family: "audio",       label: "Voiceover Style",  trait: "Authenticity", direction: "positive", weight: 0.70 },
  { family: "pacing",      label: "Cuts per 30s",     trait: "Momentum",     direction: "positive", weight: 0.68 },
  { family: "color",       label: "Palette",          trait: "Taste",        direction: "positive", weight: 0.65 },
  { family: "composition", label: "Focal Point",      trait: "Ethics",       direction: "positive", weight: 0.62 },
  { family: "audio",       label: "Music Energy",     trait: "Resonance",    direction: "positive", weight: 0.55 },
  { family: "pacing",      label: "BPM",              trait: "Autonomy",     direction: "negative", weight: 0.50 },
  { family: "composition", label: "Motion Style",     trait: "Authenticity", direction: "positive", weight: 0.48 },
];

function deriveDrivers(
  params: ModifierParameters,
  scores: HCTSTraitScores
): Driver[] {
  return PARAM_TRAIT_SIGNALS
    .filter(sig => params[sig.family] !== undefined)
    .map(sig => {
      const traitScore = scores[sig.trait];
      // Signal strength: how much this trait score deviates from neutral (50),
      // scaled by base weight. Pure display attribution — no recalculation.
      const deviation = Math.abs(traitScore - 50) / 50;
      return {
        label:     sig.label,
        family:    sig.family,
        trait:     sig.trait,
        direction: sig.direction,
        signal:    sig.weight * deviation,
      };
    })
    .sort((a, b) => b.signal - a.signal)
    .slice(0, 6);
}

export function DriverPanel({
  modifierParameters,
  traitScores,
}: {
  modifierParameters: ModifierParameters;
  traitScores:        HCTSTraitScores;
}) {
  const drivers = deriveDrivers(modifierParameters, traitScores);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Top Signal Drivers</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Parameter families with strongest trait influence
        </p>
      </div>

      {drivers.length === 0 ? (
        <p className="px-6 py-4 text-sm text-gray-400">
          No modifier parameters provided.
        </p>
      ) : (
        <div className="divide-y divide-gray-50">
          {drivers.map((driver, idx) => (
            <div key={`${driver.family}-${driver.trait}-${idx}`}
              className="px-6 py-3 flex items-center gap-4">
              <span className="text-xs font-mono text-gray-400 w-4 tabular-nums">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {driver.label}
                  </span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-xs font-medium text-gray-700">
                    {driver.trait}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 capitalize">
                    {driver.family}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    driver.direction === "positive"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {driver.direction}
                  </span>
                </div>
              </div>
              {/* Signal bar */}
              <div className="w-24 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      driver.direction === "positive"
                        ? "bg-emerald-400"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${Math.round(driver.signal * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Signal attribution only — scores computed by CIS, not by UI
        </p>
      </div>
    </div>
  );
}
