"use client";

import type { DecisionExplanation, GatingTraitImpact, WeightedTraitImpact } from "@/types/explanation";

export function DecisionExplanationPanel({
  explanation,
}: {
  explanation: DecisionExplanation;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Decision Explanation</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Structured derivation from PLA rule matrix — no inference
        </p>
      </div>

      {/* Primary reasons — visible without interaction */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Primary Reasons
        </p>
        <ol className="space-y-1.5">
          {explanation.primary_reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-100
                               text-gray-500 text-xs flex items-center justify-center
                               font-medium mt-0.5">
                {i + 1}
              </span>
              <span className="text-gray-800">{reason}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Gating traits — always first per UI rules */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Safeguard Gates
        </p>
        <div className="space-y-2">
          {explanation.gating_traits.map((g) => (
            <GatingTraitRow key={g.trait} gate={g} />
          ))}
        </div>
      </div>

      {/* Threshold summary — pass/fail visible without interaction */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Threshold Summary
        </p>
        <div className="space-y-1.5">
          {explanation.threshold_summary.map((item) => (
            <div key={item.rule} className="flex items-start gap-2">
              <StatusDot status={item.status} />
              <div className="min-w-0">
                <span className="text-xs font-medium text-gray-700">{item.rule}</span>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weighted trait impacts */}
      <div className="px-5 py-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Weighted Trait Impacts (sorted by contribution)
        </p>
        <div className="space-y-1.5">
          {explanation.weighted_trait_impacts.map((wti) => (
            <WeightedImpactRow key={wti.trait} item={wti} />
          ))}
        </div>
      </div>

      {/* Version footer */}
      <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex gap-4">
        <span className="text-xs text-gray-400">
          engine: <code className="font-mono">{explanation.pla_model_version}</code>
        </span>
        <span className="text-xs text-gray-400">
          weights: <code className="font-mono">{explanation.pla_weight_table_version}</code>
        </span>
      </div>
    </div>
  );
}

function GatingTraitRow({ gate }: { gate: GatingTraitImpact }) {
  const pass = gate.status === "pass";
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${
      pass
        ? "border-emerald-200 bg-emerald-50"
        : "border-red-200 bg-red-50"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${pass ? "text-emerald-800" : "text-red-800"}`}>
            {gate.trait}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            pass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}>
            {pass ? "CLEAR" : "FAILED"}
          </span>
        </div>
        <span className={`text-lg font-bold tabular-nums ${
          pass ? "text-emerald-700" : "text-red-700"
        }`}>
          {gate.score}
        </span>
      </div>
      <p className="text-xs mt-1 font-mono text-gray-600">{gate.detail}</p>
      <div className="flex gap-3 mt-1">
        <span className="text-xs text-gray-500">
          min: {gate.minimum}
        </span>
        <span className="text-xs text-gray-500">
          weight: {(gate.weight * 100).toFixed(0)}%
        </span>
        <span className="text-xs text-gray-500">
          weighted impact: {gate.weighted_impact.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function WeightedImpactRow({ item }: { item: WeightedTraitImpact }) {
  const maxImpact = 20;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-700 w-24 truncate font-medium">{item.trait}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full"
          style={{ width: `${Math.min(100, (item.weighted_impact / maxImpact) * 100)}%` }}
        />
      </div>
      <div className="text-right w-28">
        <span className="text-xs font-mono text-gray-600 tabular-nums">
          {item.score} × {(item.weight * 100).toFixed(0)}% = {item.weighted_impact.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: "pass" | "fail" | "not_applicable" }) {
  return (
    <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center
                     justify-center ${
      status === "pass"           ? "bg-emerald-500" :
      status === "fail"           ? "bg-red-500" :
                                    "bg-gray-300"
    }`}>
      {status === "pass" && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor"
          viewBox="0 0 12 12">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.5 6l2.5 2.5 4.5-5"/>
        </svg>
      )}
      {status === "fail" && (
        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor"
          viewBox="0 0 12 12">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3l6 6M9 3l-6 6"/>
        </svg>
      )}
    </div>
  );
}
