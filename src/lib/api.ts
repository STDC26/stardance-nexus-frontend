// NEXUS API Client
// All calls go through the gateway. Never calls CORTEX services directly.
// trace_id generated once per pipeline run, forwarded on every call.

import type {
  AssetInput,
  CISResponse,
  PLAResponse,
  ObserveResponse,
  ObservabilityRecord,
} from "@/types/api";
import type { CISResponseS5, PLAResponseS5 } from "@/types/explanation";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "";

if (!GATEWAY_URL && typeof window !== "undefined") {
  console.warn("NEXT_PUBLIC_GATEWAY_URL is not set");
}

// ---------------------------------------------------------------------------
// Trace ID generation
// ---------------------------------------------------------------------------

export function generateTraceId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `nexus-${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID
  return `nexus-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Base fetch — injects trace_id, handles errors uniformly
// ---------------------------------------------------------------------------

async function gatewayFetch<T>(
  path: string,
  options: RequestInit & { traceId?: string } = {}
): Promise<T> {
  const { traceId, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string> ?? {}),
  };

  if (traceId) {
    headers["X-Trace-ID"] = traceId;
  }

  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail ?? JSON.stringify(body);
    } catch {
      // ignore parse error
    }
    throw new Error(`Gateway error on ${path}: ${detail}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Pipeline calls — one function per endpoint
// ---------------------------------------------------------------------------

export async function scoreCIS(
  input: AssetInput,
  traceId: string
): Promise<CISResponseS5> {
  return gatewayFetch<CISResponseS5>("/nexus/score", {
    method: "POST",
    body: JSON.stringify(input),
    traceId,
  });
}

export async function scorePLA(
  payload: {
    asset_id: string;
    trait_scores: CISResponseS5["trait_scores"];
    scoring_model_version: string;
    schema_version: string;
    canon_version: string;
    audience_context?: AssetInput["audience_context"];
  },
  traceId: string
): Promise<PLAResponseS5> {
  return gatewayFetch<PLAResponseS5>("/nexus/pla", {
    method: "POST",
    body: JSON.stringify(payload),
    traceId,
  });
}

export async function persistObservation(
  payload: {
    asset_id: string;
    asset_type: string;
    schema_version: string;
    canon_version: string;
    modifier_parameters: AssetInput["modifier_parameters"];
    audience_context?: AssetInput["audience_context"];
    content_context?: Record<string, unknown>;
    trait_scores: CISResponse["trait_scores"];
    cis_model_version: string;
    scored_at: string;
    pla_output: {
      pla_value: number;
      pla_band: string;
      launch_eligible: boolean;
    };
    cide_model_version: string;
    decided_at: string;
    raw_input_payload: unknown;
    cis_response_payload: unknown;
    cide_response_payload: unknown;
    parent_trace_id?: string | null;
  },
  traceId: string
): Promise<ObserveResponse> {
  return gatewayFetch<ObserveResponse>("/nexus/observe", {
    method: "POST",
    body: JSON.stringify(payload),
    traceId,
  });
}

export async function fetchRecord(
  recordId: string,
  traceId?: string
): Promise<ObservabilityRecord> {
  return gatewayFetch<ObservabilityRecord>(`/nexus/observe/${recordId}`, {
    method: "GET",
    traceId,
  });
}

export async function compareDelta(
  recordIdA: string,
  recordIdB: string,
  traceId?: string
): Promise<import("@/types/delta").DeltaCompareResponse> {
  return gatewayFetch("/nexus/delta", {
    method: "POST",
    body: JSON.stringify({ record_id_a: recordIdA, record_id_b: recordIdB }),
    traceId,
  });
}
