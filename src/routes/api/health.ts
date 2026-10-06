import { createFileRoute } from "@tanstack/react-router";
import { graphHealth } from "@/lib/graph/queries.ts";
import { seedBaseline } from "@/lib/graph/seed.ts";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const g = seedBaseline();
        const health = graphHealth(g);
        return Response.json({
          ok: health.ready,
          service: "watchchange-mesh",
          graph: health.graph,
          nodes: health.nodes,
          relationships: health.relationships,
          engine: "falkor-compatible-kernel",
          falkordb_image: "falkordb/falkordb:v4.20.4",
        });
      },
    },
  },
});
