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
  goBaseline: () => Promise<void>;
  injectChange: () => Promise<void>;
  goIncoming: () => Promise<void>;
  acceptIncoming: () => Promise<void>;
  killOutgoingWatch: () => Promise<void>;
  assignLoopToIncoming: () => Promise<void>;
  runPlanner: () => Promise<void>;
  confirmAuthority: () => Promise<void>;
  sendToHuman: () => Promise<void>;
  approve: () => Promise<void>;
  reject: (reason: string) => Promise<void>;
  closeOutcome: () => Promise<void>;
  reset: () => void;
};

async function stamp(flags: DemoFlags, extra: Partial<DemoState> = {}): Promise<Partial<DemoState>> {
  const proposal = extra.proposal === undefined ? await planNow({ ...flags, ...extra }) : extra.proposal;
  const review = extra.review === undefined ? await reviewNow({ ...flags, ...extra }, proposal ?? undefined) : extra.review;
  return { ...extra, proposal, review };
}

export const useDemo = create<DemoState>()((set, get) => {
  const tryCatch = (fn: () => Promise<void>) => async () => {
    try {
      await fn();
    } catch (e: any) {
      set({ lastEvent: `Error: ${e.message}` });
    }
  };

  return {
    ...INITIAL_FLAGS,
    view: "overview",
    proposal: null,
    review: null,
    lastEvent: "Watch opened at 14:00. Riverside High plan is live.",
    setView: (view) => set({ view }),
    goBaseline: tryCatch(async () =>
      set({
        ...INITIAL_FLAGS,
        view: get().view,
        proposal: null,
        review: null,
        lastEvent: "Reconstructed 14:00 baseline. West Connector open. 42 cots at Riverside High.",
      })
    ),
    injectChange: tryCatch(async () => {
      const next = { ...get(), injectedChange: true, referenceTime: T1630 };
      const stamped = await stamp(next);
      set({
        injectedChange: true,
        referenceTime: T1630,
        lastEvent: "16:30 ingest: West Connector CLOSED. Riverside High capacity 42 → 8 (superseded, not overwritten).",
        view: "temporal",
        ...stamped,
      });
    }),
    goIncoming: tryCatch(async () => {
      const next = { ...get(), injectedChange: true, referenceTime: T18 };
      const stamped = await stamp(next);
      set({
        injectedChange: true,
        referenceTime: T18,
        lastEvent: "Reference time 18:00. Incoming watch can reconstruct 14:00 and current state.",
        view: "handoff",
        ...stamped,
      });
    }),
    acceptIncoming: tryCatch(async () => {
      const next = { ...get(), handoffAccepted: true, injectedChange: true, referenceTime: T18 };
      const stamped = await stamp(next);
      set({
        handoffAccepted: true,
        injectedChange: true,
        referenceTime: T18,
        lastEvent: "Incoming watch accepted the handoff package from the graph.",
        ...stamped,
      });
    }),
    killOutgoingWatch: tryCatch(async () => {
      const next = { ...get(), outgoingKilled: true, handoffAccepted: true };
      const stamped = await stamp(next);
      set({
        outgoingKilled: true,
        handoffAccepted: true,
        lastEvent: "Outgoing watch is OFFLINE. Incoming continues from shared graph memory.",
        ...stamped,
      });
    }),
    assignLoopToIncoming: tryCatch(async () => {
      const next = { ...get(), loopOwner: "agent_incoming_watch" };
      const stamped = await stamp(next);
      set({
        loopOwner: "agent_incoming_watch",
        lastEvent: "Coordinator assigned open loop ol_west_overflow to Incoming Watch.",
        ...stamped,
      });
    }),
    runPlanner: tryCatch(async () => {
      const next = {
        ...get(),
        injectedChange: true,
        referenceTime: get().referenceTime < T18 ? T18 : get().referenceTime,
        proposalWritten: true,
        decisionStatus: "PROPOSED" as const,
      };
      const proposal = await planNow(next);
      const review = await reviewNow(next, proposal);
      set({
        ...next,
        proposal,
        review,
        view: "plan",
        lastEvent: `Planner traversal selected ${proposal.shelter_name ?? "none"} (${proposal.status}).`,
      });
    }),
    confirmAuthority: tryCatch(async () => {
      const next = { ...get(), parksAuthority: true };
      const proposal = await planNow(next);
      const review = await reviewNow(next, proposal);
      set({
        parksAuthority: true,
        proposal,
        review,
        lastEvent: "Parks & Arena Ops HAS_AUTHORITY written on Civic District.",
        view: "review",
      });
    }),
    sendToHuman: tryCatch(async () => {
      if (!get().parksAuthority) return;
      const next = { ...get(), decisionStatus: "IN_REVIEW" as const, proposalWritten: true };
      const stamped = await stamp(next, { proposal: get().proposal, review: get().review });
      set({
        decisionStatus: "IN_REVIEW",
        proposalWritten: true,
        lastEvent: "Proposal moved to IN_REVIEW. Waiting on duty officer.",
        view: "review",
        ...stamped,
      });
    }),
    approve: tryCatch(async () => {
      if (get().review?.review_state !== "READY_FOR_HUMAN_REVIEW") return;
      const next = { ...get(), decisionStatus: "APPROVED" as const };
      await stamp(next, { proposal: get().proposal, review: get().review });
      set({
        decisionStatus: "APPROVED",
        proposalWritten: true,
        lastEvent: "Human approved Civic Arena transfer. Status APPROVED is now in the graph.",
      });
    }),
    reject: tryCatch(async (reason?: string) => {
      const r = reason || "Rejected";
      const next = { ...get(), decisionStatus: "REJECTED" as const, rejectionReason: r };
      await stamp(next, { proposal: get().proposal, review: get().review });
      set({
        decisionStatus: "REJECTED",
        rejectionReason: r,
        lastEvent: `Human rejected the proposal: ${r}`,
      });
    }),
    closeOutcome: tryCatch(async () => {
      const next = { ...get(), outcomeRecorded: true };
      await stamp(next, { proposal: get().proposal, review: get().review });
      set({
        outcomeRecorded: true,
        lastEvent: "Coordinator recorded simulation outcome. Open loop closed. No field dispatch.",
      });
    }),
    reset: () =>
      set({
        ...INITIAL_FLAGS,
        view: "overview",
        proposal: null,
        review: null,
        lastEvent: "Demo reset to 14:00 baseline seed.",
      }),
  };
});

export { T14, T1630, T18 };
