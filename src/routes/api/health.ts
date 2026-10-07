import { createFileRoute } from "@tanstack/react-router";
import { graphHealth } from "@/lib/graph/queries.ts";
import { getGraphStore } from "@/lib/graph/store.ts";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const store = await getGraphStore();
        const health = await graphHealth(store);
        return Response.json({
          ok: health.ready,
          service: "watchchange-mesh",
          graph: health.graph,
          nodes: health.nodes,
          relationships: health.relationships,
          engine: "falkordb",
          falkordb_image: "falkordb/falkordb:v4.20.4",
        });
      },
    },
  },
});
