import { createFileRoute } from "@tanstack/react-router";
import { graphHealth } from "@/lib/graph/queries.ts";
import { getGraphStore } from "@/lib/graph/store.ts";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const store = await getGraphStore();
          const health = await graphHealth(store);
          return Response.json({
            ok: health.ready,
            service: "watchchange-mesh",
            graph: health.graph,
            nodes: health.nodes,
            relationships: health.relationships,
            latencyMs: health.latencyMs,
            engine: "falkordb",
            falkordb_image: "falkordb/falkordb:v4.20.4",
          });
        } catch (e: any) {
          if (e.message === "NOT_CONNECTED") {
            return Response.json({
              ok: false,
              service: "watchchange-mesh",
              error: "NOT_CONNECTED",
              message: "Not connected to FalkorDB",
              engine: "falkordb"
            });
          }
          throw e;
        }
      },
    },
  },
});
