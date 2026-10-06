import {
  acceptHandoff,
  assignOpenLoop,
  confirmParksAuthority,
  injectChange1630,
  killOutgoing,
  recordOutcome,
  seedBaseline,
  setDecisionStatus,
  writeProposal,
} from "../graph/seed.ts";
import { planShelterTransfer } from "../agents/planner.ts";
import { reviewProposal } from "../agents/reviewer.ts";
import type { AgentProposal, ReviewResult } from "../agents/contract.ts";
import type { PropertyGraph } from "../graph/engine.ts";
import { T14, T1630, T18 } from "../graph/types.ts";

export type DemoFlags = {
  referenceTime: string;
  injectedChange: boolean;
  handoffAccepted: boolean;
  outgoingKilled: boolean;
  loopOwner: string | null;
  parksAuthority: boolean;
  proposalWritten: boolean;
  decisionStatus: "NONE" | "PROPOSED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason: string;
  outcomeRecorded: boolean;
};

export const INITIAL_FLAGS: DemoFlags = {
  referenceTime: T14,
  injectedChange: false,
  handoffAccepted: false,
  outgoingKilled: false,
  loopOwner: null,
  parksAuthority: false,
  proposalWritten: false,
  decisionStatus: "NONE",
  rejectionReason: "",
  outcomeRecorded: false,
};

export function buildWorld(flags: DemoFlags): PropertyGraph {
  const g = seedBaseline();
  if (flags.injectedChange) injectChange1630(g);
  const t = flags.referenceTime;
  if (flags.handoffAccepted) acceptHandoff(g, t);
  if (flags.outgoingKilled) killOutgoing(g, t);
  if (flags.loopOwner) assignOpenLoop(g, flags.loopOwner, t);
  if (flags.parksAuthority) confirmParksAuthority(g, t);

  if (flags.proposalWritten || flags.decisionStatus !== "NONE") {
    const proposal = planShelterTransfer(g, {
      hazardId: "hazard_river_rise",
      referenceTime: t,
      decisionId: "d_incoming_plan",
    });
    writeProposal(g, {
      decisionId: proposal.decision_id,
      action: proposal.action,
      rationale: proposal.planner_notes,
      confidence: proposal.confidence,
      referenceTime: t,
      factIds: proposal.fact_ids,
      evidenceIds: proposal.evidence_ids,
      shelterId: proposal.shelter_id ?? "shelter_civic",
      zoneId: "zone_west_basin",
    });
    if (flags.decisionStatus === "IN_REVIEW") {
      setDecisionStatus(g, "d_incoming_plan", "IN_REVIEW", t);
    }
    if (flags.decisionStatus === "APPROVED") {
      setDecisionStatus(g, "d_incoming_plan", "APPROVED", t, {
        approved_at: t,
        approved_by: "human_approver",
      });
    }
    if (flags.decisionStatus === "REJECTED") {
      setDecisionStatus(g, "d_incoming_plan", "REJECTED", t, {
        rejected_at: t,
        rejected_by: "human_approver",
        rejection_reason: flags.rejectionReason || "Rejected by duty officer",
      });
    }
    if (flags.outcomeRecorded) {
      recordOutcome(g, "d_incoming_plan", t, "Simulation: West Basin households staged to Civic Arena. No field dispatch.");
    }
  }
  return g;
}

export function planNow(flags: DemoFlags): AgentProposal {
  const g = buildWorld(flags);
  return planShelterTransfer(g, {
    hazardId: "hazard_river_rise",
    referenceTime: flags.referenceTime,
    decisionId: "d_incoming_plan",
  });
}

export function reviewNow(flags: DemoFlags, proposal?: AgentProposal): ReviewResult {
  const g = buildWorld(flags);
  const p = proposal ?? planNow(flags);
  return reviewProposal(g, p);
}

export { T14, T1630, T18 };
