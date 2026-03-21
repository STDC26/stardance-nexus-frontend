"use client";

import type { TraitBreakdown } from "@/types/explanation";

interface Props {
  breakdown: TraitBreakdown;
  onClose:   () => void;
}

export function TraitDrilldownDrawer({ breakdown, onClose }: Props) {
  const hasInteractions = breakdown.interaction_adjustments.length > 0;
  const hasPenalties    = breakdown.conflict_penalties.length > 0;
  const isClamped       = breakdown.rounded_pre_clamp_total !== breakdown.final_score;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between
                      bg-gray-50">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">
              {breakdown.trait}
            </h3>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {breakdown.final_score}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            base {breakdown.base_score} + contributions + interactions − penalties
            {isClamped && (
              <span className="ml-1 text-amber-600">
                (clamped from {breakdown.rounded_pre_clamp_total})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="divide-y divide-gray-50">
        {/* Reconciliation bar */}
        <ReconciliationBar breakdown={breakdown} />

        {/* Weighted contributions */}
        <Section title="Parameter Contributions" count={breakdown.weighted_contributions.length}>
          {breakdown.weighted_contributions.map((c, i) => (
            <ContributionRow key={`${c.parameter}-${i}`} contribution={c} />
          ))}
        </Section>

        {/* Interaction adjustments */}
        {hasInteractions && (
          <Section title="Interaction Adjustments" count={breakdown.interaction_adjustments.length}
                   accent="blue">
            {breakdown.interaction_adjustments.map((ia) => (
              <div key={ia.rule_id} className="flex items-center justify-between py-1.5 px-4">
                <div>
                  <p className="text-xs font-mono text-blue-700">{ia.param_a} + {ia.param_b}</p>
                  <p className="text-xs text-gray-400">
                    both ≥ threshold → {breakdown.trait} boost
                  </p>
                </div>
                <span className="text-sm font-medium text-blue-600 tabular-nums">
                  +{ia.impact.toFixed(2)}
                </span>
              </div>
            ))}
          </Section>
        )}

        {/* Conflict penalties */}
        {hasPenalties && (
          <Section title="Conflict Penalties" count={breakdown.conflict_penalties.length}
                   accent="red">
            {breakdown.conflict_penalties.map((cp) => (
              <div key={cp.rule_id} className="flex items-center justify-between py-1.5 px-4">
                <div>
                  <p className="text-xs font-mono text-red-700">{cp.param_a} vs {cp.param_b}</p>
                  <p className="text-xs text-gray-400">
                    conflicting signals → {breakdown.trait} penalty
                  </p>
                </div>
                <span className="text-sm font-medium text-red-600 tabular-nums">
                  −{cp.impact.toFixed(2)}
                </span>
              </div>
            ))}
          </Section>
        )}
      </div>

      {/* Version footer */}
      <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex gap-4">
        <span className="text-xs text-gray-400">
          scorer: <code className="font-mono">{breakdown.scoring_model_version}</code>
        </span>
        <span className="text-xs text-gray-400">
          weights: <code className="font-mono">{breakdown.weight_table_version}</code>
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ReconciliationBar({ breakdown }: { breakdown: TraitBreakdown }) {
  const { base_score, pre_clamp_total, rounded_pre_clamp_total, final_score } = breakdown;
  const contribSum = pre_clamp_total - base_score;

  return (
    <div className="px-5 py-3 bg-white">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        Score Composition
      </p>
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-gray-500">base({base_score})</span>
        <span className="text-gray-400">+</span>
        <span className={contribSum >= 0 ? "text-emerald-600" : "text-red-600"}>
          {contribSum >= 0 ? "+" : ""}{contribSum.toFixed(3)}
        </span>
        <span className="text-gray-400">=</span>
        <span className="text-gray-700">{pre_clamp_total.toFixed(3)}</span>
        <span className="text-gray-400">→ round →</span>
        <span className="text-gray-700">{rounded_pre_clamp_total}</span>
        <span className="text-gray-400">→ clamp →</span>
        <span className="font-bold text-gray-900">{final_score}</span>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  accent = "gray",
  children,
}: {
  title:    string;
  count:    number;
  accent?:  "gray" | "blue" | "red";
  children: React.ReactNode;
}) {
  const headerColor = {
    gray: "text-gray-500",
    blue: "text-blue-600",
    red:  "text-red-600",
  }[accent];

  return (
    <div>
      <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
        <span className={`text-xs font-medium uppercase tracking-wider ${headerColor}`}>
          {title}
        </span>
        <span className="ml-2 text-xs text-gray-400">({count})</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ContributionRow({
  contribution: c,
}: {
  contribution: import("@/types/explanation").WeightedContribution;
}) {
  const isPositive = c.impact > 0;
  const maxImpact  = 12; // rough scale max for bar width

  return (
    <div className="flex items-center gap-3 px-5 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-700 truncate">{c.parameter}</span>
          <span className="text-xs text-gray-400">{c.family}</span>
          {c.direction === -1 && (
            <span className="text-xs text-gray-400">(inverse)</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400">
            {c.value.toFixed(3)} × {c.weight} × {c.direction}
          </span>
        </div>
      </div>
      {/* Impact bar */}
      <div className="flex items-center gap-2 w-28">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isPositive ? "bg-emerald-400" : "bg-red-400"}`}
            style={{ width: `${Math.min(100, (Math.abs(c.impact) / maxImpact) * 100)}%` }}
          />
        </div>
        <span className={`text-xs font-mono tabular-nums w-14 text-right
                         ${isPositive ? "text-emerald-700" : "text-red-700"}`}>
          {isPositive ? "+" : ""}{c.impact.toFixed(3)}
        </span>
      </div>
    </div>
  );
}
