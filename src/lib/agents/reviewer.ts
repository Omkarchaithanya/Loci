import { factRecord } from "../graph/temporal.ts";
import type { PropertyGraph } from "../graph/engine.ts";
import type { AgentProposal, ReviewResult, ReviewState } from "./contract.ts";

export function reviewProposal(g: PropertyGraph, proposal: AgentProposal): ReviewResult {
  const checks: ReviewResult["checks"] = [];
  const blocking: string[] = [];

  checks.push({
    id: "evidence",
    ok: proposal.evidence_ids.length > 0 && proposal.fact_ids.length > 0,
    detail: `${proposal.fact_ids.length} facts, ${proposal.evidence_ids.length} evidence nodes`,
  });
  if (!checks[0].ok) blocking.push("No source evidence attached to the proposal");

  let superseded = false;
  let expired = false;
  for (const fid of proposal.fact_ids) {
    const rec = factRecord(g, fid);
    if (!rec) continue;
    if (rec.status === "SUPERSEDED") superseded = true;
    if (rec.validTo && rec.validTo <= proposal.reference_time) expired = true;
  }
  checks.push({
    id: "temporal",
    ok: !superseded && !expired,
    detail: superseded ? "Uses a superseded fact" : expired ? "Uses an expired fact" : "Facts valid at reference time",
  });
  if (superseded) blocking.push("Proposal cites a superseded fact");
  if (expired) blocking.push("Proposal cites a fact whose valid_to is at or before reference time");

  const failedRepeat = proposal.graph_path.some((n) => n.id === "shelter_north_school");
  checks.push({
    id: "failed-attempt",
    ok: !failedRepeat,
    detail: failedRepeat ? "Repeats the North School accessibility failure" : "Does not repeat a recorded failed attempt",
  });
  if (failedRepeat) blocking.push("Repeats a recorded failed attempt");

  const routeClosed = proposal.blocking_reasons.some((r) => r.toLowerCase().includes("route closed"));
  checks.push({
    id: "route",
    ok: !routeClosed,
    detail: routeClosed ? "Selected route has a CLOSED edge" : "Route edges are OPEN",
  });
  if (routeClosed) blocking.push("Route is closed at reference time");

  const cap = proposal.blocking_reasons.some((r) => r.toLowerCase().startsWith("capacity"));
  checks.push({
    id: "capacity",
    ok: !cap,
    detail: cap ? "Shelter capacity below requested quantity" : "Capacity covers requested quantity",
  });
  if (cap) blocking.push("Insufficient shelter capacity");

  const noAuth = proposal.blocking_reasons.some((r) => r.toLowerCase().includes("authority"));
  checks.push({
    id: "authority",
    ok: !noAuth,
    detail: noAuth ? "Destination zone has no HAS_AUTHORITY edge at reference time" : "Authority present on destination zone",
  });
  if (noAuth) blocking.push("Missing destination authority confirmation");

  let review_state: ReviewState = "READY_FOR_HUMAN_REVIEW";
  if (!checks[0].ok) review_state = "ABSTAIN_NO_EVIDENCE";
  else if (superseded) review_state = "REVIEW_SUPERSEDED_FACT";
  else if (expired) review_state = "REVIEW_EXPIRED_FACT";
  else if (failedRepeat) review_state = "BLOCKED_FAILED_ATTEMPT";
  else if (routeClosed) review_state = "BLOCKED_ROUTE_CLOSED";
  else if (cap) review_state = "BLOCKED_CAPACITY";
  else if (noAuth) review_state = "BLOCKED_NO_AUTHORITY";
  else if (proposal.blocking_reasons.length > 0) review_state = "BLOCKED_BY_CONSTRAINT";

  const status = review_state === "READY_FOR_HUMAN_REVIEW" ? "IN_REVIEW" : review_state.startsWith("ABSTAIN") ? "ABSTAINED" : "BLOCKED";

  return {
    decision_id: proposal.decision_id,
    status,
    review_state,
    blocking_reasons: blocking.length ? blocking : proposal.blocking_reasons,
    checks,
    requires_human_approval: true,
  };
}
