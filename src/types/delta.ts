// Sprint 6 — Delta Engine Frontend Types
// Mirror of stardance_shared/delta_models.py
// No client-side computation. Render what the backend returns.

export interface NumericInputDeltaItem {
  parameter: string;
  family:    string;
  type:      "numeric";
  value_a:   number;
  value_b:   number;
  delta:     number;
  changed:   boolean;
}

export interface CategoricalInputDeltaItem {
  parameter: string;
  family:    string;
  type:      "categorical";
  value_a:   string | null;
  value_b:   string | null;
  delta:     null;
  changed:   boolean;
}

export type InputDeltaItem = NumericInputDeltaItem | CategoricalInputDeltaItem;

export interface OutputDeltaItem {
  trait:     string;
  score_a:   number;
  score_b:   number;
  delta:     number;
  direction: "improved" | "declined" | "unchanged";
}

export interface DecisionDelta {
  pla_score_a:         number;
  pla_score_b:         number;
  pla_score_delta:     number;
  pla_band_a:          string;
  pla_band_b:          string;
  band_changed:        boolean;
  launch_eligible_a:   boolean;
  launch_eligible_b:   boolean;
  eligibility_changed: boolean;
  safeguard_flags_a:   string[];
  safeguard_flags_b:   string[];
}

export interface DeltaCompareResponse {
  trace_id_a:           string;
  trace_id_b:           string;
  record_id_a:          string;
  record_id_b:          string;
  parent_trace_id_b:    string | null;
  asset_id_a:           string;
  asset_id_b:           string;
  input_delta:          InputDeltaItem[];
  output_delta:         OutputDeltaItem[];
  decision_delta:       DecisionDelta;
  schema_version:       string;
  delta_engine_version: string;
  computed_at:          string;
}
