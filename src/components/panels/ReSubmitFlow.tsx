"use client";

import { useState } from "react";
import type { AssetInput } from "@/types/api";

interface Props {
  parentTraceId:  string;
  parentRecordId: string;
  baseInput:      AssetInput;
  onSubmit:       (input: AssetInput & { parent_trace_id: string }) => void;
  disabled:       boolean;
}

export function ReSubmitFlow({
  parentTraceId, parentRecordId, baseInput, onSubmit, disabled,
}: Props) {
  const [json, setJson] = useState(
    JSON.stringify({ ...baseInput, parent_trace_id: parentTraceId }, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.asset_id || !parsed.modifier_parameters) {
        throw new Error("asset_id and modifier_parameters are required");
      }
      if (!parsed.parent_trace_id) {
        throw new Error("parent_trace_id must be present for re-submit");
      }
      setParseError(null);
      onSubmit(parsed);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Re-Submit Variant</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Modify parameters and run a new linked decision
        </p>
      </div>

      {/* Lineage display — always visible, non-editable */}
      <div className="px-4 pt-3 pb-0">
        <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 mb-3">
          <p className="text-xs font-medium text-blue-700 mb-1">
            Linked to Run A
          </p>
          <p className="text-xs font-mono text-blue-600 truncate"
             data-testid="parent-trace-id-display">
            {parentTraceId}
          </p>
          <p className="text-xs text-blue-500 mt-0.5 truncate">
            record: {parentRecordId}
          </p>
        </div>
      </div>

      <div className="p-4">
        <textarea
          value={json}
          onChange={e => { setJson(e.target.value); setParseError(null); }}
          rows={14}
          disabled={disabled}
          className="w-full font-mono text-xs border border-gray-200 rounded-md p-3
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     resize-none text-gray-800 bg-gray-50 disabled:opacity-50"
        />
        {parseError && (
          <p className="mt-2 text-xs text-red-600 font-mono">{parseError}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={disabled}
          data-testid="run-pipeline-button"
          className="mt-3 w-full py-2.5 px-4 bg-blue-600 text-white text-sm
                     font-medium rounded-lg hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? "Running…" : "Run Variant Pipeline"}
        </button>
        <p className="mt-2 text-xs text-gray-400 text-center">
          parent_trace_id is locked and cannot be removed
        </p>
      </div>
    </div>
  );
}
