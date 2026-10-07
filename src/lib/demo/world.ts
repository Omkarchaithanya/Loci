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
import type { GraphStore } from "../graph/store.ts";
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

import { getGraphStore } from "../graph/store.ts";

export async function buildWorld(flags: DemoFlags): Promise<GraphStore> {
  const store = await getGraphStore();
  await seedBaseline(store);
  if (flags.injectedChange) await injectChange1630(store);
  const t = flags.referenceTime;
  if (flags.handoffAccepted) await acceptHandoff(store, t);
  if (flags.outgoingKilled) await killOutgoing(store, t);
  if (flags.loopOwner) await assignOpenLoop(store, flags.loopOwner, t);
  if (flags.parksAuthority) await confirmParksAuthority(store, t);

  if (flags.proposalWritten || flags.decisionStatus !== "NONE") {
    const proposal = await planShelterTransfer(store, {
      hazardId: "hazard_river_rise",
      referenceTime: t,
      decisionId: "d_incoming_plan",
    });
    await writeProposal(store, {
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
      await setDecisionStatus(store, "d_incoming_plan", "IN_REVIEW", t);
    }
    if (flags.decisionStatus === "APPROVED") {
      await setDecisionStatus(store, "d_incoming_plan", "APPROVED", t, {
        approved_at: t,
        approved_by: "human_approver",
      });
    }
    if (flags.decisionStatus === "REJECTED") {
      await setDecisionStatus(store, "d_incoming_plan", "REJECTED", t, {
        rejected_at: t,
        rejected_by: "human_approver",
        rejection_reason: flags.rejectionReason || "Rejected by duty officer",
      });
    }
    if (flags.outcomeRecorded) {
      await recordOutcome(store, "d_incoming_plan", t, "Simulation: West Basin households staged to Civic Arena. No field dispatch.");
    }
  }
  return store;
}

export async function planNow(flags: DemoFlags): Promise<AgentProposal> {
  const store = await buildWorld(flags);
  return await planShelterTransfer(store, {
    hazardId: "hazard_river_rise",
    referenceTime: flags.referenceTime,
    decisionId: "d_incoming_plan",
  });
}

export async function reviewNow(flags: DemoFlags, proposal?: AgentProposal): Promise<ReviewResult> {
  const store = await buildWorld(flags);
  const p = proposal ?? await planNow(flags);
  return await reviewProposal(store, p);
}

export { T14, T1630, T18 };
