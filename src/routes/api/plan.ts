import { createFileRoute } from "@tanstack/react-router";
import { planShelterTransfer } from "@/lib/agents/planner.ts";
import { reviewProposal } from "@/lib/agents/reviewer.ts";
import { buildWorld, INITIAL_FLAGS, T18 } from "@/lib/demo/world.ts";

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
        const g = buildWorld(flags);
        const proposal = planShelterTransfer(g, {
          hazardId: "hazard_river_rise",
          referenceTime: flags.referenceTime,
          decisionId: "d_incoming_plan",
        });
        const review = reviewProposal(g, proposal);
        return Response.json({ proposal, review, graph: g.name });
      },
    },
  },
});
