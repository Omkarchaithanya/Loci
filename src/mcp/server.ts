import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getGraphStore } from "../lib/graph/store.ts";
import { candidatePlans } from "../lib/graph/queries.ts";

const server = new Server(
  {
    name: "loci-planner",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_facts_at_time",
        description: "Time-travel facts for a tenant/scenario at timestamp T",
        inputSchema: {
          type: "object",
          properties: {
            timestamp: {
              type: "string",
              description: "ISO 8601 timestamp (e.g. 2026-10-15T14:00:00Z)",
            },
          },
          required: ["timestamp"],
        },
      },
      {
        name: "get_failed_attempts",
        description: "Prior rejected or failed plans and why",
        inputSchema: {
          type: "object",
          properties: {
            shelter_id: {
              type: "string",
              description: "ID of the shelter to check",
            },
          },
          required: ["shelter_id"],
        },
      },
      {
        name: "plan_shelter_transfer",
        description: "Runs the constraint layer; returns a plan plus the evidence path. Must refuse a route whose edges are closed.",
        inputSchema: {
          type: "object",
          properties: {
            hazard_id: {
              type: "string",
              description: "ID of the hazard",
            },
            timestamp: {
              type: "string",
              description: "ISO 8601 timestamp",
            },
          },
          required: ["hazard_id", "timestamp"],
        },
      },
      {
        name: "approve_decision",
        description: "Persists APPROVED/REJECTED only when confirm: true plus officer id. Default is dry-run.",
        inputSchema: {
          type: "object",
          properties: {
            plan_id: {
              type: "string",
            },
            status: {
              type: "string",
              enum: ["APPROVED", "REJECTED"],
            },
            confirm: {
              type: "boolean",
              description: "Set to true to actually persist",
            },
            officer_id: {
              type: "string",
              description: "ID of the approving officer",
            },
          },
          required: ["plan_id", "status"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "approve_decision") {
    const { plan_id, status, confirm, officer_id } = request.params.arguments as {
      plan_id: string;
      status: string;
      confirm?: boolean;
      officer_id?: string;
    };
    if (!confirm || !officer_id) {
      return {
        content: [{ type: "text", text: `Dry-run: Would set ${plan_id} to ${status}. Provide confirm: true and officer_id to persist.` }],
      };
    }

    const store = await getGraphStore();
    const cypher = `
      MATCH (d:Decision {id: $plan_id})
      SET d.status = $status, d.approved_by = $officer_id, d.approved_at = timestamp()
      RETURN d
    `;
    const res = await store.query(cypher, { plan_id, status, officer_id });
    return {
      content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
    };
  }

  const store = await getGraphStore();

  if (request.params.name === "get_facts_at_time") {
    const { timestamp } = request.params.arguments as { timestamp: string };
    const cypher = `
      MATCH (f:Fact)-[:ABOUT]->(subject)
      WHERE f.valid_from <= $reference_time
        AND (f.valid_to IS NULL OR f.valid_to > $reference_time)
        AND f.status IN ['VALID', 'SUPERSEDED']
      RETURN subject.id as subjectId, labels(subject) as labels, f.predicate as predicate, f.object_value as objectValue, f.valid_from as validFrom, f.valid_to as validTo, f.status as status
    `;
    const res = await store.roQuery(cypher, { reference_time: timestamp });
    return {
      content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
    };
  }

  if (request.params.name === "get_failed_attempts") {
    const { shelter_id } = request.params.arguments as { shelter_id: string };
    const cypher = `
      MATCH (a:Attempt)-[:TARGETED]->(s:Shelter {id: $shelter_id})
      WHERE a.status = 'FAILED'
      OPTIONAL MATCH (a)-[:BLOCKED_BY]->(reason)
      RETURN a.id as attemptId, a.timestamp as timestamp, collect(reason.id) as blockingReasons
    `;
    const res = await store.roQuery(cypher, { shelter_id });
    return {
      content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
    };
  }

  if (request.params.name === "plan_shelter_transfer") {
    const { hazard_id, timestamp } = request.params.arguments as { hazard_id: string; timestamp: string };
    try {
      const plans = await candidatePlans(store, hazard_id, timestamp);
      return {
        content: [{ type: "text", text: JSON.stringify(plans, null, 2) }],
      };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.message}` }],
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Loci Planner MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
