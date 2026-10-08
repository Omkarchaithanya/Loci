import { candidatePlans, evidencePacket } from "../graph/queries.ts";
import type { GraphStore } from "../graph/store.ts";
import type { AgentProposal, GraphPathNode } from "./contract.ts";

async function node(store: GraphStore, id: string, role: string): Promise<GraphPathNode | null> {
  const res = await store.query("MATCH (n {id: $id}) RETURN n", { id });
  if (!res.data.length) return null;
  const n = res.data[0].n;
  const name = String(n.properties.name ?? n.properties.kind ?? n.properties.predicate ?? n.properties.id);
  return { id: n.properties.id, labels: n.labels, name, role };
}

export async function planShelterTransfer(
  store: GraphStore,
  opts: { hazardId: string; referenceTime: string; decisionId?: string },
): Promise<AgentProposal> {
  const ranked = await candidatePlans(store, opts.hazardId, opts.referenceTime);
  const feasible = ranked.filter((c: any) => c.blockingReasons.length === 0);
  const pick = feasible[0] ?? ranked[0];
  const decisionId = opts.decisionId ?? "d_incoming_plan";

  if (!pick) {
    return {
      status: "ABSTAINED",
      action: "No shelter candidate in the graph",
      reference_time: opts.referenceTime,
      confidence: 0,
      assumptions: [],
      evidence_ids: [],
      fact_ids: [],
      graph_path: [],
      blocking_reasons: ["Candidate plan traversal returned no shelters"],
      requires_human_approval: true,
      shelter_id: null,
      shelter_name: null,
      route_road_ids: [],
      decision_id: decisionId,
      planner_notes: "Abstain — the graph has no OPEN shelter nodes.",
    };
  }

  const blocked = pick.blockingReasons.length > 0;
  const path: GraphPathNode[] = [];
  const push = async (id: string, role: string) => {
    const n = await node(store, id, role);
    if (n && !path.some((p) => p.id === n.id)) path.push(n);
  };

  await push(opts.hazardId, "hazard");
  const hRes = await store.query("MATCH ({id: $id})-[:AFFECTS]->(z) RETURN z", { id: opts.hazardId });
  if (hRes.data[0]) await push(hRes.data[0].z.properties.id, "affected-zone");
  const hhRes = await store.query("MATCH (h:Household)-[:HAS_NEED]->(n:Need) RETURN h, n LIMIT 1");
  if (hhRes.data[0]) {
    await push(hhRes.data[0].h.properties.id, "household");
    await push(hhRes.data[0].n.properties.id, "need");
  }
  await push(pick.shelterId, "shelter");
  await push(pick.zoneId, "shelter-zone");
  for (const site of pick.routeSiteIds) await push(site, "site");
  for (const road of pick.routeRoadIds) await push(road, "road");
  if (pick.authorityAgencyId) await push(pick.authorityAgencyId, "agency");
  if (pick.assetId) await push(pick.assetId, "asset");

  const factIds: string[] = [];
  const fRes = await store.query("MATCH (f:Fact)-[:ABOUT]->(about) WHERE f.status = 'VALID' AND about.id IN $ids RETURN f", { ids: [pick.shelterId, ...pick.routeRoadIds, 'road_west_connector', 'road_north_civic'] });
  for (const row of fRes.data) {
    factIds.push(row.f.properties.id);
  }
  const evidence = await evidencePacket(store, factIds);

  const assumptions = [
    `${pick.shelterName} remains OPEN at ${opts.referenceTime}`,
    pick.routeOpen ? "Selected route edges are OPEN" : "Route must be restored before dispatch",
    pick.authorityAgencyId ? "Destination authority is present in the graph" : "Destination authority still unconfirmed",
  ];

  let routeStr = "open route";
  if (pick.routeRoadIds.length > 0) {
    const names = [];
    for (const id of pick.routeRoadIds) {
      const res = await store.query("MATCH (n {id: $id}) RETURN n.name as name", { id });
      names.push(res.data[0]?.name ?? id);
    }
    routeStr = names.join(" → ");
  }

  const action = blocked
    ? `Do not send West Basin households to ${pick.shelterName} until blockers clear`
    : `Transfer West Basin households to ${pick.shelterName} via ${routeStr}`;

  const confidence = blocked
    ? Math.max(0.2, 0.45 - pick.blockingReasons.length * 0.05)
    : Math.min(0.94, 0.7 + (pick.score ?? 0) * 0.2);

  return {
    status: blocked ? "BLOCKED" : "PROPOSED",
    action,
    reference_time: opts.referenceTime,
    confidence: Number(confidence.toFixed(2)),
    assumptions,
    evidence_ids: evidence.map((e: any) => e.evidenceId),
    fact_ids: factIds,
    graph_path: path,
    blocking_reasons: pick.blockingReasons,
    requires_human_approval: true,
    shelter_id: pick.shelterId,
    shelter_name: pick.shelterName,
    route_road_ids: pick.routeRoadIds,
    decision_id: decisionId,
    planner_notes: blocked
      ? `Top-ranked graph candidate is ${pick.shelterName} (score ${pick.score}) but the reviewer must see blockers.`
      : `Graph ranking selected ${pick.shelterName} (score ${pick.score}). Available capacity ${pick.availableCapacity}, route ${pick.routeMinutes} min.`,
  };
}

export async function rankTable(store: GraphStore, hazardId: string, t: string) {
  return await candidatePlans(store, hazardId, t);
}
