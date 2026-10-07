import { createFileRoute } from "@tanstack/react-router";
import { planShelterTransfer } from "@/lib/agents/planner.ts";
import { reviewProposal } from "@/lib/agents/reviewer.ts";
import { buildWorld, INITIAL_FLAGS, T18 } from "@/lib/demo/world.ts";

import type { GraphStore } from "@/lib/graph/store.ts";

class StoreTracker implements GraphStore {
  constructor(private store: GraphStore) {}
  public totalTimeMs = 0;
  public serverTimeMs = 0;
  get name() { return this.store.name; }
  async query(cypher: string, params?: Record<string, any>) {
    const res = await this.store.query(cypher, params);
    this.totalTimeMs += res.totalTimeMs || 0;
    this.serverTimeMs += res.serverTimeMs || 0;
    return res;
  }
  async roQuery(cypher: string, params?: Record<string, any>) {
    const res = await this.store.roQuery(cypher, params);
    this.totalTimeMs += res.totalTimeMs || 0;
    this.serverTimeMs += res.serverTimeMs || 0;
    return res;
  }
  async close() { return this.store.close(); }
}

export const Route = createFileRoute("/api/plan")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const t = url.searchParams.get("t") === "14" ? "2026-10-15T14:00:00Z" : T18;
        const injected = url.searchParams.get("change") !== "0";
        const parks = url.searchParams.get("auth") === "1";
        const flags = {
          ...INITIAL_FLAGS,
          referenceTime: t,
          injectedChange: t !== "2026-10-15T14:00:00Z" && injected,
          parksAuthority: parks,
        };
        const g = await buildWorld(flags);
        const tracker = new StoreTracker(g);
        const proposal = await planShelterTransfer(tracker, {
          hazardId: "hazard_river_rise",
          referenceTime: flags.referenceTime,
          decisionId: "d_incoming_plan",
        });
        const review = await reviewProposal(tracker, proposal);
        return Response.json({ 
          proposal, 
          review, 
          graph: tracker.name,
          totalTimeMs: tracker.totalTimeMs,
          serverTimeMs: tracker.serverTimeMs
        });
      },
    },
  },
});
