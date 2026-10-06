import { candidatePlans, evidencePacket } from "../graph/queries.ts";
import type { PropertyGraph } from "../graph/engine.ts";
import type { AgentProposal, GraphPathNode } from "./contract.ts";

function node(g: PropertyGraph, id: string, role: string): GraphPathNode | null {
  const n = g.get(id);
  if (!n) return null;
  const name = String(n.props.name ?? n.props.kind ?? n.props.predicate ?? n.id);
  return { id: n.id, labels: n.labels, name, role };
}

export function planShelterTransfer(
  g: PropertyGraph,
  opts: { hazardId: string; referenceTime: string; decisionId?: string },
): AgentProposal {
  const ranked = candidatePlans(g, opts.hazardId, opts.referenceTime);
  const feasible = ranked.filter((c) => c.blockingReasons.length === 0);
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
  const push = (id: string, role: string) => {
    const n = node(g, id, role);
    if (n && !path.some((p) => p.id === n.id)) path.push(n);
  };

  push(opts.hazardId, "hazard");
  const hazardZones = g.out(opts.hazardId, "AFFECTS");
  if (hazardZones[0]) push(hazardZones[0].to, "affected-zone");
  const hh = g.nodesByLabel("Household")[0];
  if (hh) {
    push(hh.id, "household");
    const need = g.out(hh.id, "HAS_NEED")[0];
    if (need) push(need.to, "need");
  }
  push(pick.shelterId, "shelter");
  push(pick.zoneId, "shelter-zone");
  for (const site of pick.routeSiteIds) push(site, "site");
  for (const road of pick.routeRoadIds) push(road, "road");
  if (pick.authorityAgencyId) push(pick.authorityAgencyId, "agency");
  if (pick.assetId) push(pick.assetId, "asset");

  const factIds: string[] = [];
  for (const f of g.nodesByLabel("Fact")) {
    const about = g.out(f.id, "ABOUT")[0];
    if (!about) continue;
    if (about.to === pick.shelterId || pick.routeRoadIds.includes(about.to) || about.to === "road_west_connector" || about.to === "road_north_civic") {
      if (f.props.status === "VALID") factIds.push(f.id);
    }
  }
  const evidence = evidencePacket(g, factIds);

  const assumptions = [
    `${pick.shelterName} remains OPEN at ${opts.referenceTime}`,
    pick.routeOpen ? "Selected route edges are OPEN" : "Route must be restored before dispatch",
    pick.destinationAuthority ? "Destination authority is present in the graph" : "Destination authority still unconfirmed",
  ];

  const action = blocked
    ? `Do not send West Basin households to ${pick.shelterName} until blockers clear`
    : `Transfer West Basin households to ${pick.shelterName} via ${pick.routeRoadIds.map((id) => g.get(id)?.props.name ?? id).join(" → ") || "open route"}`;

  const confidence = blocked
    ? Math.max(0.2, 0.45 - pick.blockingReasons.length * 0.05)
    : Math.min(0.94, 0.7 + pick.planScore * 0.2);

  return {
    status: blocked ? "BLOCKED" : "PROPOSED",
    action,
    reference_time: opts.referenceTime,
    confidence: Number(confidence.toFixed(2)),
    assumptions,
    evidence_ids: evidence.map((e) => e.evidenceId),
    fact_ids: factIds,
    graph_path: path,
    blocking_reasons: pick.blockingReasons,
    requires_human_approval: true,
    shelter_id: pick.shelterId,
    shelter_name: pick.shelterName,
    route_road_ids: pick.routeRoadIds,
    decision_id: decisionId,
    planner_notes: blocked
      ? `Top-ranked graph candidate is ${pick.shelterName} (score ${pick.planScore}) but the reviewer must see blockers. Ranked: ${ranked.map((c) => `${c.shelterName}:${c.planScore}`).join(" · ")}`
      : `Graph ranking selected ${pick.shelterName} (score ${pick.planScore}). Capacity coverage ${Math.round(pick.capacityCoverage * 100)}%, route ${pick.routeMinutes} min.`,
  };
}

export function rankTable(g: PropertyGraph, hazardId: string, t: string) {
  return candidatePlans(g, hazardId, t);
}
