// NEXUS Frontend — API Type Contracts
// These types mirror the CORTEX API response schemas exactly.
// No client-side transformation permitted — display what the API returns.

export interface HCTSTraitScores {
  Presence:     number;
  Trust:        number;
  Authenticity: number;
  Momentum:     number;
  Taste:        number;
  Empathy:      number;
  Autonomy:     number;
  Resonance:    number;
  Ethics:       number;
}

export type PLABand =
  | "reject"
  | "conditional_test"
  | "approved_test"
  | "scale_candidate";

export interface CISResponse {
  asset_id:              string;
  asset_type:            string;
  schema_version:        string;
  canon_version:         string;
  trait_scores:          HCTSTraitScores;
  scoring_model_version: string;
  scored_at:             string;
  trace_id:              string;
}

export interface PLAResponse {
  asset_id:                  string;
  pla_value:                 number;
  pla_band:                  PLABand;
  safeguard_flags:           string[];
  launch_eligible:           boolean;
  scoring_model_version:     string;
  pla_engine_version:        string;
  pla_weight_table_version:  string;
  decided_at:                string;
  trace_id:                  string;
}

export interface ObserveResponse {
  record_id:          string;
  asset_id:           string;
  persistence_status: string;
  persisted_at:       string;
  trace_id:           string;
}

export interface ObservabilityRecord {
  id:                   string;
  asset_id:             string;
  trace_id:             string;
  schema_version:       string;
  canon_version:        string;
  cis_model_version:    string;
  cide_model_version:   string;
  edge_model_version:   string | null;
  trait_scores:         HCTSTraitScores;
  pla_output:           { pla_value: number; pla_band: PLABand; launch_eligible: boolean };
  ctr:                  number | null;
  conversion_rate:      number | null;
  watch_time:           number | null;
  engagement_rate:      number | null;
  scroll_stop_rate:     number | null;
  revenue_per_impression: number | null;
  learning_record_id:   string | null;
  persistence_status:   string;
  scored_at:            string | null;
  decided_at:           string | null;
  learned_at:           string | null;
  created_at:           string;
}

export interface ModifierParameters {
  pacing?: {
    cuts_per_30s?:   number;
    bpm_equivalent?: number;
    tempo_curve?:    string;
    frame_holds?:    number;
  };
  color?: {
    saturation?:  number;
    contrast?:    number;
    palette?:     string;
    color_grade?: string;
  };
  composition?: {
    framing?:          string;
    motion_style?:     string;
    focal_point?:      string;
    camera_angle?:     string;
    camera_movement?:  string;
  };
  audio?: {
    voice_tone?:       string;
    music_energy?:     number;
    voiceover_style?:  string;
  };
}

export interface AssetInput {
  asset_id:             string;
  asset_type:           string;
  version?:             string;
  schema_version?:      string;
  canon_version?:       string;
  modifier_parameters:  ModifierParameters;
  audience_context?: {
    audience_segment?:  string;
    platform?:          string;
    geography?:         string;
    campaign_context?:  string;
  };
  content_context?: Record<string, unknown>;
}

// Pipeline state — holds all responses for one full decision run
export interface PipelineState {
  traceId:        string;
  assetInput:     AssetInput | null;
  cisResponse:    CISResponse | null;
  plaResponse:    PLAResponse | null;
  observeResponse: ObserveResponse | null;
  recordId:       string | null;
  status:         "idle" | "scoring" | "deciding" | "persisting" | "complete" | "error";
  error:          string | null;
}

// Driver — top contributors to a trait score
export interface TraitDriver {
  parameter:  string;
  family:     string;
  direction:  "positive" | "negative";
  weight:     number;
}

export const TRAIT_ORDER: (keyof HCTSTraitScores)[] = [
  "Trust",
  "Authenticity",
  "Ethics",
  "Resonance",
  "Presence",
  "Empathy",
  "Momentum",
  "Taste",
  "Autonomy",
];

export const SAFEGUARD_TRAITS: (keyof HCTSTraitScores)[] = [
  "Trust",
  "Authenticity",
  "Ethics",
];

export const PLA_BAND_LABELS: Record<PLABand, string> = {
  reject:           "Reject",
  conditional_test: "Conditional Test",
  approved_test:    "Approved Test",
  scale_candidate:  "Scale Candidate",
};

export const PLA_BAND_COLOR: Record<PLABand, string> = {
  reject:           "text-red-600 bg-red-50 border-red-200",
  conditional_test: "text-amber-600 bg-amber-50 border-amber-200",
  approved_test:    "text-blue-600 bg-blue-50 border-blue-200",
  scale_candidate:  "text-emerald-600 bg-emerald-50 border-emerald-200",
};
