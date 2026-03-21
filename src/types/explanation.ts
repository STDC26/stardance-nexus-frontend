// Sprint 5 — Explanation Payload Types
// Mirror of stardance_shared/explanation_models.py
// No client-side computation — render what the backend returns exactly.

export interface WeightedContribution {
  parameter:  string;
  family:     string;
  value:      number;
  weight:     number;
  direction:  1 | -1;
  impact:     number;
}

export interface InteractionAdjustment {
  rule_id:     string;
  param_a:     string;
  param_b:     string;
  threshold_a: number;
  threshold_b: number;
  impact:      number;
}

export interface ConflictPenalty {
  rule_id: string;
  param_a: string;
  param_b: string;
  impact:  number;
}

export interface TraitBreakdown {
  trait:                   string;
  final_score:             number;
  base_score:              number;
  pre_clamp_total:         number;
  rounded_pre_clamp_total: number;
  weighted_contributions:  WeightedContribution[];
  interaction_adjustments: InteractionAdjustment[];
  conflict_penalties:      ConflictPenalty[];
  scoring_model_version:   string;
  weight_table_version:    string;
}

export type DriverSourceType =
  | "weighted_contribution"
  | "interaction_adjustment"
  | "conflict_penalty";

export interface DriverRankingEntry {
  trait:       string;
  source_type: DriverSourceType;
  source_key:  string;
  family:      string | null;
  description: string;
  impact:      number;
  abs_impact:  number;
}

export interface DriverRanking {
  positive: DriverRankingEntry[];
  negative: DriverRankingEntry[];
}

export type ThresholdStatus = "pass" | "fail" | "not_applicable";

export interface ThresholdSummaryItem {
  rule:   string;
  status: ThresholdStatus;
  detail: string;
}

export interface GatingTraitImpact {
  trait:           string;
  score:           number;
  minimum:         number;
  weight:          number;
  weighted_impact: number;
  status:          "pass" | "fail";
  detail:          string;
}

export interface WeightedTraitImpact {
  trait:           string;
  score:           number;
  weight:          number;
  weighted_impact: number;
}

export interface DecisionExplanation {
  pla_score:              number;
  pla_band:               string;
  launch_eligible:        boolean;
  threshold_summary:      ThresholdSummaryItem[];
  gating_traits:          GatingTraitImpact[];
  weighted_trait_impacts: WeightedTraitImpact[];
  primary_reasons:        string[];
  pla_model_version:      string;
  pla_weight_table_version: string;
}

// Extended CIS response — Sprint 5 additions
export interface CISResponseS5 {
  asset_id:              string;
  asset_type:            string;
  schema_version:        string;
  canon_version:         string;
  trait_scores:          Record<string, number>;
  scoring_model_version: string;
  weight_table_version:  string;
  scored_at:             string;
  trace_id:              string;
  trait_breakdowns:      Record<string, TraitBreakdown>;
  driver_ranking:        DriverRanking;
}

// Extended CIDE PLA response — Sprint 5 additions
export interface PLAResponseS5 {
  asset_id:                  string;
  pla_value:                 number;
  pla_band:                  string;
  safeguard_flags:           string[];
  launch_eligible:           boolean;
  scoring_model_version:     string;
  pla_engine_version:        string;
  pla_weight_table_version:  string;
  decided_at:                string;
  trace_id:                  string;
  decision_explanation:      DecisionExplanation;
}
