"use server";
import { getGraphStore } from "../graph/store.ts";
import { candidatePlans, unownedOpenLoops } from "../graph/queries.ts";
import { factsAtTime } from "../graph/temporal.ts";
import { T14 } from "./world.ts";

export async function getPanelData(args: { data: any }) {
  const store = await getGraphStore();
  const t = args.data.referenceTime || T14;
  
  const start = performance.now();
  const countRes = await store.roQuery("MATCH (n) RETURN count(n) as count");
  const latencyMs = Math.round(performance.now() - start);
  const health = {
    graph: process.env.FALKORDB_GRAPH || "watchchange_flood_demo",
    nodes: Number(countRes.data[0].count),
    latencyMs
  };
  
  const ranked = await candidatePlans(store, "inc_cedar_flood", t);
  const facts1400 = await factsAtTime(store, T14);
  const factsCurrent = await factsAtTime(store, t);
  const unownedLoops = await unownedOpenLoops(store);
  
  const faRes = await store.roQuery(`
    MATCH (a:FailedAttempt)-[:TARGETS]->(s:Shelter)
    RETURN a.id as id, a.reason as reason, s.id as shelterId
  `);
  
  const failedAttempts = faRes.data.map((row: any) => ({
    id: String(row.id),
    reason: String(row.reason),
    shelterId: String(row.shelterId)
  }));
  
  return {
    health,
    ranked,
    facts1400,
    factsCurrent,
    unownedLoops,
    failedAttempts
  };
}
