"use client";

import { useState } from "react";
import type { CISResponse, PLAResponse, ObserveResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// TracePanel — always visible, expandable JSON, copyable trace_id
// ---------------------------------------------------------------------------

export function TracePanel({
  traceId,
  recordId,
  cisResponse,
  plaResponse,
  observeResponse,
}: {
  traceId:          string;
  recordId:         string;
  cisResponse:      CISResponse | null;
  plaResponse:      PLAResponse | null;
  observeResponse:  ObserveResponse | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Trace Record
          </h3>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {expanded ? "Collapse" : "Expand"} JSON
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {/* trace_id — always visible, copyable */}
        <Field
          label="trace_id"
          value={traceId}
          onCopy={() => copy(traceId, "trace_id")}
          copied={copied === "trace_id"}
        />
        {/* record_id — always visible, copyable */}
        <Field
          label="record_id"
          value={recordId}
          onCopy={() => copy(recordId, "record_id")}
          copied={copied === "record_id"}
        />
        {cisResponse && (
          <Field label="scored_at" value={cisResponse.scored_at} />
        )}
        {plaResponse && (
          <Field label="decided_at" value={plaResponse.decided_at} />
        )}
        {observeResponse && (
          <Field label="persisted_at" value={observeResponse.persisted_at} />
        )}
      </div>

      {/* Expandable raw JSON */}
      {expanded && (
        <div className="border-t border-gray-100">
          {cisResponse && (
            <JsonBlock label="CIS Response" data={cisResponse} />
          )}
          {plaResponse && (
            <JsonBlock label="CIDE PLA Response" data={plaResponse} />
          )}
          {observeResponse && (
            <JsonBlock label="Observe Response" data={observeResponse} />
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
  copied,
}: {
  label:    string;
  value:    string;
  onCopy?:  () => void;
  copied?:  boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <code className="text-xs font-mono text-gray-700 break-all">{value}</code>
        {onCopy && (
          <button
            onClick={onCopy}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy"
          >
            {copied ? (
              <span className="text-xs text-emerald-600">✓</span>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-0">
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-48
                      bg-gray-50 rounded p-2 whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IntakePanel — asset submission form with canonical defaults
// ---------------------------------------------------------------------------

import type { AssetInput } from "@/types/api";

const GOLDEN_PATH_DEFAULTS: AssetInput = {
  asset_id:   "golden_path_asset_001",
  asset_type: "video",
  schema_version: "1.0.0",
  canon_version:  "HCTS_v1",
  modifier_parameters: {
    pacing:      { cuts_per_30s: 24, bpm_equivalent: 112, tempo_curve: "accelerating", frame_holds: 3 },
    color:       { saturation: 68, contrast: 54, palette: "neutral_premium", color_grade: "clean_natural" },
    composition: { framing: "tight_product_closeup", motion_style: "stable_handheld",
                   focal_point: "product_then_face", camera_angle: "eye_level", camera_movement: "minimal_push" },
    audio:       { voice_tone: "calm_confident", music_energy: 42, voiceover_style: "conversational" },
  },
  audience_context: {
    audience_segment: "premium_skincare_prospect",
    platform:         "paid_social",
    geography:        "US",
    campaign_context: "direct_response_test",
  },
};

export function IntakePanel({
  onSubmit,
  disabled,
}: {
  onSubmit:  (input: AssetInput) => void;
  disabled:  boolean;
}) {
  const [json, setJson] = useState(
    JSON.stringify(GOLDEN_PATH_DEFAULTS, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(json) as AssetInput;
      if (!parsed.asset_id || !parsed.modifier_parameters) {
        throw new Error("asset_id and modifier_parameters are required");
      }
      setParseError(null);
      onSubmit(parsed);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const loadGoldenPath = () => {
    setJson(JSON.stringify(GOLDEN_PATH_DEFAULTS, null, 2));
    setParseError(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Asset Input</h3>
        <button
          onClick={loadGoldenPath}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Load Golden Path
        </button>
      </div>

      <div className="p-4">
        <textarea
          value={json}
          onChange={e => { setJson(e.target.value); setParseError(null); }}
          rows={16}
          className="w-full font-mono text-xs border border-gray-200 rounded-md p-3
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none text-gray-800 bg-gray-50"
          placeholder="Paste asset JSON..."
          disabled={disabled}
        />

        {parseError && (
          <p className="mt-2 text-xs text-red-600 font-mono">{parseError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="mt-3 w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-medium
                     rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {disabled ? "Running pipeline…" : "Run Decision Pipeline"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LookupPanel — fetch existing observability record by record_id or trace_id
// ---------------------------------------------------------------------------

export function LookupPanel({ onLookup }: { onLookup: (id: string) => void }) {
  const [value, setValue] = useState("");

  const handleLookup = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onLookup(trimmed);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Load Existing Record</h3>
        <p className="text-xs text-gray-500 mt-0.5">Enter a record_id to fetch from Postgres</p>
      </div>
      <div className="p-4">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLookup()}
          placeholder="614b08e5-3531-444d-ab0b-d8754e2b6b4a"
          className="w-full font-mono text-xs border border-gray-200 rounded-md px-3 py-2.5
                     focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
        />
        <button
          onClick={handleLookup}
          disabled={!value.trim()}
          className="mt-3 w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-medium
                     rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          Load Record
        </button>
        <p className="mt-3 text-xs text-gray-400">
          The Golden Path record_id:{" "}
          <button
            className="font-mono text-blue-600 hover:underline break-all text-left"
            onClick={() => setValue("614b08e5-3531-444d-ab0b-d8754e2b6b4a")}
          >
            614b08e5-3531-444d-ab0b-d8754e2b6b4a
          </button>
        </p>
      </div>
    </div>
  );
}
