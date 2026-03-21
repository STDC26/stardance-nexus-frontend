"use client";

import { useState, useCallback } from "react";
import {
  generateTraceId,
  scoreCIS,
  scorePLA,
  persistObservation,
  fetchRecord,
  compareDelta,
} from "@/lib/api";
import type { PipelineState, AssetInput, ObservabilityRecord } from "@/types/api";
import type { TraitBreakdown, DriverRanking, DecisionExplanation } from "@/types/explanation";
import type { DeltaCompareResponse } from "@/types/delta";
import { TraitPanel }   from "./TraitPanel";
import { PLAPanel }     from "./PLAPanel";
import { DriverPanel }  from "./DriverPanel";
import { TracePanel }   from "./TracePanel";
import { IntakePanel }  from "./IntakePanel";
import { LookupPanel }  from "./LookupPanel";
import { TraitPanelS5 }             from "./TraitPanelS5";
import { DecisionExplanationPanel } from "./DecisionExplanationPanel";
import { DriverPanelS5 }            from "./DriverPanelS5";
import { ComparisonView }           from "./ComparisonView";
import { ReSubmitFlow }             from "./ReSubmitFlow";

const INITIAL_STATE: PipelineState = {
  traceId:         "",
  assetInput:      null,
  cisResponse:     null,
  plaResponse:     null,
  observeResponse: null,
  recordId:        null,
  status:          "idle",
  error:           null,
};

export function DecisionConsole() {
  const [pipeline, setPipeline] = useState<PipelineState>(INITIAL_STATE);
  const [loadedRecord, setLoadedRecord] = useState<ObservabilityRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"submit" | "lookup">("submit");
  const [traitBreakdowns, setTraitBreakdowns] = useState<Record<string, TraitBreakdown> | null>(null);
  const [driverRanking, setDriverRanking] = useState<DriverRanking | null>(null);
  const [decisionExplanation, setDecisionExplanation] = useState<DecisionExplanation | null>(null);
  const [comparison, setComparison] = useState<DeltaCompareResponse | null>(null);
  const [showReSubmit, setShowReSubmit] = useState(false);

  // ── Full pipeline run ────────────────────────────────────────────────────
  const runPipeline = useCallback(async (input: AssetInput, parentTraceId?: string) => {
    const traceId = generateTraceId();

    setPipeline({
      ...INITIAL_STATE,
      traceId,
      assetInput: input,
      status: "scoring",
    });

    try {
      // Step 1 — CIS
      const cisResponse = await scoreCIS(input, traceId);
      setTraitBreakdowns((cisResponse as any).trait_breakdowns ?? null);
      setDriverRanking((cisResponse as any).driver_ranking ?? null);
      setPipeline(prev => ({ ...prev, cisResponse, status: "deciding" }));

      // Step 2 — CIDE PLA
      const plaResponse = await scorePLA(
        {
          asset_id:              input.asset_id,
          trait_scores:          cisResponse.trait_scores,
          scoring_model_version: cisResponse.scoring_model_version,
          schema_version:        cisResponse.schema_version,
          canon_version:         cisResponse.canon_version,
          audience_context:      input.audience_context,
        },
        traceId
      );
      setDecisionExplanation((plaResponse as any).decision_explanation ?? null);
      setPipeline(prev => ({ ...prev, plaResponse, status: "persisting" }));

      // Step 3 — Persist observability record
      const observeResponse = await persistObservation(
        {
          asset_id:              input.asset_id,
          asset_type:            input.asset_type,
          schema_version:        cisResponse.schema_version,
          canon_version:         cisResponse.canon_version,
          modifier_parameters:   input.modifier_parameters,
          audience_context:      input.audience_context,
          content_context:       input.content_context ?? {},
          trait_scores:          cisResponse.trait_scores,
          cis_model_version:     cisResponse.scoring_model_version,
          scored_at:             cisResponse.scored_at,
          pla_output: {
            pla_value:      plaResponse.pla_value,
            pla_band:       plaResponse.pla_band,
            launch_eligible: plaResponse.launch_eligible,
          },
          cide_model_version:    plaResponse.pla_engine_version,
          decided_at:            plaResponse.decided_at,
          raw_input_payload:     input,
          cis_response_payload:  cisResponse,
          cide_response_payload: plaResponse,
          parent_trace_id:       parentTraceId ?? null,
        },
        traceId
      );

      setPipeline(prev => ({
        ...prev,
        observeResponse,
        recordId: observeResponse.record_id,
        status:   "complete",
      }));
    } catch (err) {
      setPipeline(prev => ({
        ...prev,
        status: "error",
        error:  err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  // ── Record lookup ────────────────────────────────────────────────────────
  const lookupRecord = useCallback(async (recordId: string) => {
    setLoadedRecord(null);
    try {
      const record = await fetchRecord(recordId);
      setLoadedRecord(record);
    } catch (err) {
      alert(`Lookup failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  // ── Re-submit (Sprint 6) ─────────────────────────────────────────────────
  const runReSubmit = useCallback(async (input: AssetInput & { parent_trace_id: string }) => {
    const { parent_trace_id, ...assetInput } = input;
    setShowReSubmit(false);
    await runPipeline(assetInput as AssetInput, parent_trace_id);
  }, [runPipeline]);

  // ── Delta comparison (Sprint 6) ──────────────────────────────────────────
  const runComparison = useCallback(async (recordIdA: string, recordIdB: string) => {
    setComparison(null);
    try {
      const result = await compareDelta(recordIdA, recordIdB, generateTraceId());
      setComparison(result);
    } catch (err) {
      alert(`Comparison failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const reset = () => {
    setPipeline(INITIAL_STATE);
    setLoadedRecord(null);
    setTraitBreakdowns(null);
    setDriverRanking(null);
    setDecisionExplanation(null);
    setComparison(null);
    setShowReSubmit(false);
  };

  const isRunning = ["scoring", "deciding", "persisting"].includes(pipeline.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              NEXUS Decision Console
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              CORTEX · HCTS · Sprint 4
            </p>
          </div>
          {pipeline.traceId && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">trace</span>
              <code
                className="text-xs font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer
                           hover:bg-gray-200 transition-colors"
                onClick={() => navigator.clipboard.writeText(pipeline.traceId)}
                title="Click to copy"
              >
                {pipeline.traceId.slice(0, 28)}…
              </code>
            </div>
          )}
          {pipeline.status !== "idle" && (
            <button
              onClick={reset}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Tab bar ───────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
          {(["submit", "lookup"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "submit" ? "Submit Asset" : "Load Record"}
            </button>
          ))}
        </div>

        {/* ── Submit flow ───────────────────────────────────────────── */}
        {activeTab === "submit" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — intake */}
            <div className="lg:col-span-1 space-y-4">
              <IntakePanel onSubmit={runPipeline} disabled={isRunning} />

              {/* Status indicator */}
              {pipeline.status !== "idle" && (
                <StatusCard status={pipeline.status} error={pipeline.error} />
              )}

              {/* Trace panel */}
              {pipeline.status === "complete" && pipeline.recordId && (
                <TracePanel
                  traceId={pipeline.traceId}
                  recordId={pipeline.recordId}
                  cisResponse={pipeline.cisResponse}
                  plaResponse={pipeline.plaResponse}
                  observeResponse={pipeline.observeResponse}
                />
              )}
            </div>

            {/* Right columns — results */}
            <div className="lg:col-span-2 space-y-6">
              {pipeline.plaResponse && (
                <PLAPanel response={pipeline.plaResponse} />
              )}
              {decisionExplanation && (
                <DecisionExplanationPanel explanation={decisionExplanation} />
              )}
              {pipeline.cisResponse && (
                <>
                  <TraitPanelS5
                    scores={pipeline.cisResponse.trait_scores}
                    breakdowns={traitBreakdowns ?? {}}
                  />
                  {driverRanking && (
                    <DriverPanelS5 ranking={driverRanking} />
                  )}
                </>
              )}

              {/* Sprint 6 — Re-submit flow */}
              {pipeline.status === "complete" && pipeline.recordId && pipeline.assetInput && (
                <>
                  {!showReSubmit ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowReSubmit(true)}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white
                                   rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Re-Submit Variant
                      </button>
                    </div>
                  ) : (
                    <ReSubmitFlow
                      parentTraceId={pipeline.traceId}
                      parentRecordId={pipeline.recordId}
                      baseInput={pipeline.assetInput}
                      onSubmit={runReSubmit}
                      disabled={isRunning}
                    />
                  )}
                </>
              )}

              {/* Sprint 6 — Comparison view */}
              {comparison && (
                <ComparisonView
                  comparison={comparison}
                  onClose={() => setComparison(null)}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Lookup flow ───────────────────────────────────────────── */}
        {activeTab === "lookup" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <LookupPanel onLookup={lookupRecord} />
            </div>
            {loadedRecord && (
              <div className="lg:col-span-2 space-y-6">
                <RecordHeader record={loadedRecord} />
                <PLAPanel
                  response={{
                    asset_id:                 loadedRecord.asset_id,
                    pla_value:                loadedRecord.pla_output.pla_value,
                    pla_band:                 loadedRecord.pla_output.pla_band,
                    safeguard_flags:          [],
                    launch_eligible:          loadedRecord.pla_output.launch_eligible,
                    scoring_model_version:    loadedRecord.cis_model_version,
                    pla_engine_version:       loadedRecord.cide_model_version,
                    pla_weight_table_version: "",
                    decided_at:               loadedRecord.decided_at ?? "",
                    trace_id:                 loadedRecord.trace_id,
                  }}
                />
                <TraitPanel scores={loadedRecord.trait_scores} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusCard({
  status,
  error,
}: {
  status: PipelineState["status"];
  error: string | null;
}) {
  const steps = [
    { key: "scoring",    label: "CIS Scoring",           done: false },
    { key: "deciding",   label: "CIDE PLA Decision",     done: false },
    { key: "persisting", label: "Observability Persist", done: false },
    { key: "complete",   label: "Complete",               done: false },
  ];

  const order = ["scoring", "deciding", "persisting", "complete"];
  const currentIdx = order.indexOf(status);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Pipeline Status
      </p>
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone    = idx < currentIdx;
          const isActive  = order[idx] === status && status !== "complete";
          const isComplete = status === "complete";

          return (
            <div key={step.key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDone || isComplete
                  ? "bg-emerald-500"
                  : isActive
                  ? "bg-blue-500 animate-pulse"
                  : "bg-gray-200"
              }`}>
                {(isDone || isComplete) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M3.5 6.5L5.5 8.5L8.5 4.5" stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" fill="none"/>
                  </svg>
                )}
              </div>
              <span className={`text-sm ${
                isDone || isComplete ? "text-gray-900" :
                isActive ? "text-blue-700 font-medium" : "text-gray-400"
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {status === "error" && error && (
        <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700 font-mono break-all">
          {error}
        </div>
      )}
    </div>
  );
}

function RecordHeader({ record }: { record: ObservabilityRecord }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Loaded Record
        </p>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          record.persistence_status === "edge_completed"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {record.persistence_status}
        </span>
      </div>
      <p className="text-sm font-mono text-gray-900">{record.asset_id}</p>
      <p className="text-xs text-gray-500 mt-1">
        trace: <span className="font-mono">{record.trace_id}</span>
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(record.created_at).toLocaleString()}
      </p>
    </div>
  );
}
