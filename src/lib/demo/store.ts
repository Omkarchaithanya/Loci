import { create } from "zustand";
import { planNow, reviewNow, type DemoFlags, INITIAL_FLAGS, T14, T1630, T18 } from "./world.ts";
import type { AgentProposal, ReviewResult } from "../agents/contract.ts";

export type ViewId = "overview" | "temporal" | "handoff" | "plan" | "review" | "graph" | "queries";

export type DemoState = DemoFlags & {
  view: ViewId;
  proposal: AgentProposal | null;
  review: ReviewResult | null;
  lastEvent: string;
  setView: (view: ViewId) => void;
  goBaseline: () => void;
  injectChange: () => void;
  goIncoming: () => void;
  acceptIncoming: () => void;
  killOutgoingWatch: () => void;
  assignLoopToIncoming: () => void;
  runPlanner: () => void;
  confirmAuthority: () => void;
  sendToHuman: () => void;
  approve: () => void;
  reject: (reason: string) => void;
  closeOutcome: () => void;
  reset: () => void;
};

function stamp(flags: DemoFlags, extra: Partial<DemoState> = {}): Partial<DemoState> {
  const proposal = extra.proposal === undefined ? planNow({ ...flags, ...extra }) : extra.proposal;
  const review = extra.review === undefined ? reviewNow({ ...flags, ...extra }, proposal ?? undefined) : extra.review;
  return { ...extra, proposal, review };
}

export const useDemo = create<DemoState>()((set, get) => ({
  ...INITIAL_FLAGS,
  view: "overview",
  proposal: null,
  review: null,
  lastEvent: "Watch opened at 14:00. Riverside High plan is live.",
      setView: (view) => set({ view }),
      goBaseline: () =>
        set({
          ...INITIAL_FLAGS,
          view: get().view,
          proposal: null,
          review: null,
          lastEvent: "Reconstructed 14:00 baseline. West Connector open. 42 cots at Riverside High.",
        }),
      injectChange: () => {
        const next = { ...get(), injectedChange: true, referenceTime: T1630 };
        set({
          injectedChange: true,
          referenceTime: T1630,
          lastEvent: "16:30 ingest: West Connector CLOSED. Riverside High capacity 42 → 8 (superseded, not overwritten).",
          view: "temporal",
          ...stamp(next),
        });
      },
      goIncoming: () => {
        const next = { ...get(), injectedChange: true, referenceTime: T18 };
        set({
          injectedChange: true,
          referenceTime: T18,
          lastEvent: "Reference time 18:00. Incoming watch can reconstruct 14:00 and current state.",
          view: "handoff",
          ...stamp(next),
        });
      },
      acceptIncoming: () => {
        const next = { ...get(), handoffAccepted: true, injectedChange: true, referenceTime: T18 };
        set({
          handoffAccepted: true,
          injectedChange: true,
          referenceTime: T18,
          lastEvent: "Incoming watch accepted the handoff package from the graph.",
          ...stamp(next),
        });
      },
      killOutgoingWatch: () => {
        const next = { ...get(), outgoingKilled: true, handoffAccepted: true };
        set({
          outgoingKilled: true,
          handoffAccepted: true,
          lastEvent: "Outgoing watch is OFFLINE. Incoming continues from shared graph memory.",
          ...stamp(next),
        });
      },
      assignLoopToIncoming: () => {
        const next = { ...get(), loopOwner: "agent_incoming_watch" };
        set({
          loopOwner: "agent_incoming_watch",
          lastEvent: "Coordinator assigned open loop ol_west_overflow to Incoming Watch.",
          ...stamp(next),
        });
      },
      runPlanner: () => {
        const next = {
          ...get(),
          injectedChange: true,
          referenceTime: get().referenceTime < T18 ? T18 : get().referenceTime,
          proposalWritten: true,
          decisionStatus: "PROPOSED" as const,
        };
        const proposal = planNow(next);
        const review = reviewNow(next, proposal);
        set({
          ...next,
          proposal,
          review,
          view: "plan",
          lastEvent: `Planner traversal selected ${proposal.shelter_name ?? "none"} (${proposal.status}).`,
        });
      },
      confirmAuthority: () => {
        const next = { ...get(), parksAuthority: true };
        const proposal = planNow(next);
        const review = reviewNow(next, proposal);
        set({
          parksAuthority: true,
          proposal,
          review,
          lastEvent: "Parks & Arena Ops HAS_AUTHORITY written on Civic District.",
          view: "review",
        });
      },
      sendToHuman: () => {
        if (!get().parksAuthority) return;
        const next = { ...get(), decisionStatus: "IN_REVIEW" as const, proposalWritten: true };
        set({
          decisionStatus: "IN_REVIEW",
          proposalWritten: true,
          lastEvent: "Proposal moved to IN_REVIEW. Waiting on duty officer.",
          view: "review",
          ...stamp(next, { proposal: get().proposal, review: get().review }),
        });
      },
      approve: () => {
        if (get().review?.review_state !== "READY_FOR_HUMAN_REVIEW") return;
        set({
          decisionStatus: "APPROVED",
          proposalWritten: true,
          lastEvent: "Human approved Civic Arena transfer. Status APPROVED is now in the graph.",
        });
      },
      reject: (reason) =>
        set({
          decisionStatus: "REJECTED",
          rejectionReason: reason,
          lastEvent: `Human rejected the proposal: ${reason}`,
        }),
      closeOutcome: () =>
        set({
          outcomeRecorded: true,
          lastEvent: "Coordinator recorded simulation outcome. Open loop closed. No field dispatch.",
        }),
      reset: () =>
        set({
          ...INITIAL_FLAGS,
          view: "overview",
          proposal: null,
          review: null,
          lastEvent: "Demo reset to 14:00 baseline seed.",
        }),
    }),
);

export { T14, T1630, T18 };
