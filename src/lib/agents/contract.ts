export type AgentStatus =
  | "DRAFT"
  | "PROPOSED"
  | "IN_REVIEW"
  | "BLOCKED"
  | "ABSTAINED"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED_IN_SIMULATION"
  | "COMPLETED";

export type GraphPathNode = {
  id: string;
  labels: string[];
  name: string;
  role: string;
};

export type AgentProposal = {
  status: AgentStatus;
  action: string;
  reference_time: string;
  confidence: number;
  assumptions: string[];
  evidence_ids: string[];
  fact_ids: string[];
  graph_path: GraphPathNode[];
  blocking_reasons: string[];
  requires_human_approval: true;
  shelter_id: string | null;
  shelter_name: string | null;
  route_road_ids: string[];
  decision_id: string;
  planner_notes: string;
};

export type ReviewState =
  | "READY_FOR_HUMAN_REVIEW"
  | "ABSTAIN_NO_EVIDENCE"
  | "REVIEW_SUPERSEDED_FACT"
  | "REVIEW_EXPIRED_FACT"
  | "BLOCKED_BY_CONSTRAINT"
  | "BLOCKED_FAILED_ATTEMPT"
  | "BLOCKED_NO_AUTHORITY"
  | "BLOCKED_ROUTE_CLOSED"
  | "BLOCKED_CAPACITY";

export type ReviewResult = {
  decision_id: string;
  status: AgentStatus;
  review_state: ReviewState;
  blocking_reasons: string[];
  checks: Array<{ id: string; ok: boolean; detail: string }>;
  requires_human_approval: true;
};
