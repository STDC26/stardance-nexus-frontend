"use client";

import type { PLAResponse } from "@/types/api";
import { PLA_BAND_LABELS, PLA_BAND_COLOR } from "@/types/api";

export function PLAPanel({ response }: { response: PLAResponse }) {
  const bandLabel = PLA_BAND_LABELS[response.pla_band];
  const bandColor = PLA_BAND_COLOR[response.pla_band];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Decision header — always visible, no interaction required */}
      <div className={`px-6 py-5 border-b ${bandColor}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">
              PLA Decision
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              {bandLabel}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70 mb-1">PLA Score</p>
            <p className="text-4xl font-bold tabular-nums">{response.pla_value}</p>
          </div>
        </div>

        {/* Launch eligibility — always visible */}
        <div className="flex items-center gap-2 mt-3">
          <div className={`w-2 h-2 rounded-full ${
            response.launch_eligible ? "bg-current" : "bg-red-600"
          }`} />
          <span className="text-sm font-medium">
            {response.launch_eligible ? "Launch Eligible" : "Not Launch Eligible"}
          </span>
        </div>
      </div>

      {/* Safeguard flags */}
      <div className="px-6 py-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Safeguard Check
        </p>
        {response.safeguard_flags.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414
                   L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"/>
            </svg>
            All safeguards clear
          </div>
        ) : (
          <div className="space-y-1">
            {response.safeguard_flags.map(flag => (
              <div key={flag}
                className="flex items-center gap-2 text-sm text-red-700 bg-red-50
                           rounded px-3 py-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334
                       -.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z"
                    clipRule="evenodd"/>
                </svg>
                <code className="font-mono text-xs">{flag}</code>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version provenance */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            ["PLA Engine", response.pla_engine_version],
            ["Weight Table", response.pla_weight_table_version],
            ["Decided At", new Date(response.decided_at).toLocaleTimeString()],
            ["Asset", response.asset_id],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="text-xs text-gray-400">{label}: </span>
              <span className="text-xs font-mono text-gray-600">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
