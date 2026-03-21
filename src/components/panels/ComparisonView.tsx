"use client";

import { useState, useCallback } from "react";
import type { DeltaCompareResponse, OutputDeltaItem, InputDeltaItem } from "@/types/delta";
import { PLA_BAND_LABELS, PLA_BAND_COLOR } from "@/types/api";

const HCTS_TRAITS = [
  "Trust","Authenticity","Ethics","Resonance",
  "Presence","Empathy","Momentum","Taste","Autonomy",
];

// ---------------------------------------------------------------------------
// ComparisonView — renders backend delta payload exactly
// ---------------------------------------------------------------------------

export function ComparisonView({
  comparison,
  onClose,
}: {
  comparison: DeltaCompareResponse;
  onClose:    () => void;
}) {
  const [activeTab, setActiveTab] = useState<"traits" | "parameters" | "decision">("traits");
  const traitMap = Object.fromEntries(
    comparison.output_delta.map(d => [d.trait, d])
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Comparison View</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Backend-computed delta · No client arithmetic
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Run identity */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
        <RunHeader label="Run A" traceId={comparison.trace_id_a}
                   assetId={comparison.asset_id_a} recordId={comparison.record_id_a} />
        <RunHeader label="Run B" traceId={comparison.trace_id_b}
                   assetId={comparison.asset_id_b} recordId={comparison.record_id_b}
                   parentTraceId={comparison.parent_trace_id_b ?? undefined} />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {(["traits","parameters","decision"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="divide-y divide-gray-50">
        {activeTab === "traits" && HCTS_TRAITS.map(trait => {
          const d = traitMap[trait];
          if (!d) return null;
          return (
            <TraitDeltaRow
              key={trait}
              trait={trait}
              item={d}
              data-testid={`delta-row-${trait}`}
            />
          );
        })}

        {activeTab === "parameters" && (
          <ParameterDeltaTable items={comparison.input_delta} />
        )}

        {activeTab === "decision" && (
          <DecisionDeltaPanel delta={comparison.decision_delta} />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          engine: <code className="font-mono">{comparison.delta_engine_version}</code>
          {" · "}computed: {new Date(comparison.computed_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RunHeader({
  label, traceId, assetId, recordId, parentTraceId,
}: {
  label:          string;
  traceId:        string;
  assetId:        string;
  recordId:       string;
  parentTraceId?: string;
}) {
  return (
    <div className="px-5 py-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-xs font-mono text-gray-800 truncate">{assetId}</p>
      <p className="text-xs text-gray-500 mt-0.5" data-testid={
        label === "Run A" ? "trace-id-a" : "trace-id-b"
      }>
        trace: <code className="font-mono">{traceId}</code>
      </p>
      {parentTraceId && (
        <p className="text-xs text-blue-600 mt-0.5">
          ↳ parent: <code className="font-mono">{parentTraceId}</code>
        </p>
      )}
    </div>
  );
}

function TraitDeltaRow({
  trait, item, ...props
}: {
  trait: string;
  item:  OutputDeltaItem;
  [key: string]: any;
}) {
  const color = item.direction === "improved" ? "text-emerald-600" :
                item.direction === "declined" ? "text-red-600" :
                "text-gray-400";
  const sign  = item.delta > 0 ? "+" : "";
  const arrow = item.direction === "improved" ? "↑" :
                item.direction === "declined" ? "↓" : "—";

  return (
    <div className="flex items-center gap-4 px-6 py-3" {...props}>
      <span className="text-sm font-medium text-gray-900 w-28">{trait}</span>
      <span className="text-sm tabular-nums text-gray-700 w-10 text-right"
            data-testid="score-a">
        {item.score_a}
      </span>
      <span className="text-gray-300 text-xs">→</span>
      <span className="text-sm tabular-nums text-gray-700 w-10 text-right"
            data-testid="score-b">
        {item.score_b}
      </span>
      <span className={`text-sm font-bold tabular-nums w-12 text-right ${color}`}
            data-testid="delta">
        {sign}{item.delta}
      </span>
      <span className={`text-sm ${color}`}>{arrow}</span>
      {/* Score bar delta visualization */}
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="relative h-full">
          <div className="absolute h-full bg-gray-300 rounded-full"
               style={{ width: `${item.score_a}%` }} />
          {item.delta !== 0 && (
            <div
              className={`absolute h-full rounded-full opacity-60 ${
                item.direction === "improved" ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{
                left:  `${Math.min(item.score_a, item.score_b)}%`,
                width: `${Math.abs(item.delta)}%`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ParameterDeltaTable({ items }: { items: InputDeltaItem[] }) {
  const changed = items.filter(d => d.changed);
  const unchanged = items.filter(d => !d.changed);

  return (
    <div>
      {changed.length > 0 && (
        <>
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-100">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">
              Changed ({changed.length})
            </span>
          </div>
          {changed.map((d, i) => <ParameterRow key={i} item={d} />)}
        </>
      )}
      {unchanged.length > 0 && (
        <>
          <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Unchanged ({unchanged.length})
            </span>
          </div>
          {unchanged.map((d, i) => <ParameterRow key={i} item={d} dim />)}
        </>
      )}
    </div>
  );
}

function ParameterRow({ item, dim }: { item: InputDeltaItem; dim?: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-6 py-2.5 ${dim ? "opacity-40" : ""}`}>
      <span className="text-xs font-mono text-gray-700 w-36 truncate">{item.parameter}</span>
      <span className="text-xs text-gray-400 w-16">{item.family}</span>
      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
        {item.type}
      </span>
      <span className="text-xs font-mono text-gray-600 flex-1">
        {item.type === "numeric"
          ? `${item.value_a} → ${item.value_b}`
          : `${item.value_a} → ${item.value_b}`}
      </span>
      {item.type === "numeric" && item.delta !== undefined && (
        <span className={`text-xs font-mono font-bold tabular-nums ${
          (item.delta ?? 0) > 0 ? "text-emerald-600" :
          (item.delta ?? 0) < 0 ? "text-red-600" : "text-gray-400"
        }`}>
          {(item.delta ?? 0) > 0 ? "+" : ""}{item.delta}
        </span>
      )}
      {item.type === "categorical" && item.changed && (
        <span className="text-xs text-amber-600 font-medium">changed</span>
      )}
    </div>
  );
}

function DecisionDeltaPanel({ delta }: { delta: DeltaCompareResponse["decision_delta"] }) {
  const scoreDelta = delta.pla_score_delta;
  const scoreColor = scoreDelta > 0 ? "text-emerald-600" :
                     scoreDelta < 0 ? "text-red-600" : "text-gray-400";

  return (
    <div className="px-6 py-5 space-y-5">
      {/* PLA score comparison */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          PLA Score
        </p>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Run A</p>
            <p className="text-3xl font-bold tabular-nums text-gray-900"
               data-testid="pla-score-a">
              {delta.pla_score_a}
            </p>
          </div>
          <div className={`text-center ${scoreColor}`}>
            <p className="text-xs mb-1">Delta</p>
            <p className="text-2xl font-bold tabular-nums"
               data-testid="pla-score-delta">
              {scoreDelta > 0 ? "+" : ""}{scoreDelta}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Run B</p>
            <p className="text-3xl font-bold tabular-nums text-gray-900"
               data-testid="pla-score-b">
              {delta.pla_score_b}
            </p>
          </div>
        </div>
      </div>

      {/* Band comparison */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Decision Band
        </p>
        <div className="flex items-center gap-4">
          <BandBadge band={delta.pla_band_a} />
          <span className="text-gray-300">→</span>
          <BandBadge band={delta.pla_band_b} />
          {delta.band_changed && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              band changed
            </span>
          )}
        </div>
      </div>

      {/* Launch eligibility */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Launch Eligibility
        </p>
        <div className="flex items-center gap-4 text-sm">
          <EligibilityBadge eligible={delta.launch_eligible_a} label="Run A" />
          <span className="text-gray-300">→</span>
          <EligibilityBadge eligible={delta.launch_eligible_b} label="Run B" />
          {delta.eligibility_changed && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              eligibility changed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function BandBadge({ band }: { band: string }) {
  const label = PLA_BAND_LABELS[band as keyof typeof PLA_BAND_LABELS] ?? band;
  const color = PLA_BAND_COLOR[band as keyof typeof PLA_BAND_COLOR] ?? "";
  return (
    <span className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${color}`}>
      {label}
    </span>
  );
}

function EligibilityBadge({ eligible, label }: { eligible: boolean; label: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded ${
      eligible ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
    }`}>
      {label}: {eligible ? "Eligible" : "Not Eligible"}
    </span>
  );
}
