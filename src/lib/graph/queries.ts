import type { PropertyGraph } from "./engine.ts";
import { evidenceForFact, factRecord, factsAtTime } from "./temporal.ts";
import { isValidAt, type FactRecord, type ShelterCandidate } from "./types.ts";

export type QuerySpec = {
  id: string;
  title: string;
  cypher: string;
};

export const CYPHER = {
  factsAtTime: `MATCH (f:Fact)-[:ABOUT]->(subject)
WHERE f.valid_from <= $reference_time
  AND (f.valid_to IS NULL OR f.valid_to > $reference_time)
  AND f.status IN ['VALID', 'SUPERSEDED']
RETURN subject.id, labels(subject), f.predicate, f.object_value, f.valid_from, f.valid_to, f.status`,

  candidatePlan: `MATCH (h:Hazard {id: $hazard_id})-[:AFFECTS]->(z:Zone)
MATCH (hh:Household)-[:LOCATED_IN]->(z)
MATCH (hh)-[:HAS_NEED]->(need:Need)
MATCH (s:Shelter)
MATCH (s)-[:LOCATED_IN]->(sz:Zone)
MATCH (s)-[:STAGED_AT]->(dest:Site)
MATCH (origin:Site)<-[:CONTAINS]-(z)
OPTIONAL MATCH (fa:FailedAttempt)-[:TARGETS]->(s)
OPTIONAL MATCH (a:Agency)-[auth:HAS_AUTHORITY]->(z)
OPTIONAL MATCH (destAgency:Agency)-[dauth:HAS_AUTHORITY]->(sz)
OPTIONAL MATCH (a)-[:CONTROLS]->(asset:Asset)
WHERE h.status = 'ACTIVE' AND s.status = 'OPEN' AND need.status = 'OPEN'
RETURN z, s, dest, origin, fa, a, destAgency, asset, need`,

  supersession: `MATCH (newer:Fact)-[:SUPERSEDES]->(older:Fact)
MATCH (newer)-[:ABOUT]->(subject)
RETURN subject.id, newer.predicate, newer.object_value, older.object_value, older.valid_from, older.valid_to`,

  unownedLoops: `MATCH (o:OpenLoop)
WHERE o.status IN ['OPEN', 'BLOCKED', 'ESCALATED']
  AND NOT (o)<-[:OWNS]-(:Agent)
RETURN o.id, o.title, o.priority, o.due_at`,

  failedAttempts: `MATCH (fa:FailedAttempt)-[:ABOUT]->(o:OpenLoop)
OPTIONAL MATCH (fa)-[:TARGETS]->(target)
RETURN fa.id, fa.action_kind, fa.reason, target.id, o.title`,

  handoff: `MATCH (h:Handoff {id: $handoff_id})-[:TRANSFERS]->(o:OpenLoop)
OPTIONAL MATCH (owner:Agent)-[:OWNS]->(o)
OPTIONAL MATCH (fa:FailedAttempt)-[:ABOUT]->(o)
RETURN h.summary, o, owner, fa`,
} as const;

export function activeHazards(g: PropertyGraph, t: string) {
  return g.nodesByLabel("Hazard").filter((h) => {
    if (h.props.status !== "ACTIVE") return false;
    return isValidAt(String(h.props.valid_from ?? ""), h.props.valid_to == null ? null : String(h.props.valid_to), t);
  }).map((h) => ({
    id: h.id,
    kind: String(h.props.kind),
    severity: Number(h.props.severity),
    description: String(h.props.description),
    observedAt: String(h.props.observed_at),
    zones: g.out(h.id, "AFFECTS").map((rel) => {
      const z = g.must(rel.to);
      return { id: z.id, name: String(z.props.name) };
    }),
  }));
}

export function needsByZone(g: PropertyGraph, t: string) {
  const rows = [];
  for (const z of g.nodesByLabel("Zone")) {
    const households = g.in(z.id, "LOCATED_IN").map((rel) => g.get(rel.from)).filter((n) => n?.labels.includes("Household"));
    let openNeeds = 0;
    let qty = 0;
    const kinds = new Set<string>();
    for (const hh of households) {
      if (!hh) continue;
      for (const rel of g.out(hh.id, "HAS_NEED")) {
        const need = g.get(rel.to);
        if (!need || need.props.status !== "OPEN") continue;
        if (!isValidAt(String(need.props.valid_from ?? ""), need.props.valid_to == null ? null : String(need.props.valid_to), t)) continue;
        openNeeds += 1;
        qty += Number(need.props.quantity ?? 0);
        kinds.add(String(need.props.kind));
      }
    }
    if (households.length === 0) continue;
    rows.push({
      zoneId: z.id,
      zoneName: String(z.props.name),
      households: households.length,
      openNeeds,
      needTypes: [...kinds],
      totalQuantity: qty,
    });
  }
  return rows.sort((a, b) => b.openNeeds - a.openNeeds);
}

function shelterSite(g: PropertyGraph, shelterId: string): string | null {
  const staged = g.out(shelterId, "STAGED_AT")[0];
  return staged?.to ?? null;
}

function originSiteForZone(g: PropertyGraph, zoneId: string): string | null {
  const sites = g.out(zoneId, "CONTAINS");
  return sites[0]?.to ?? null;
}

export function failedAttemptsFor(g: PropertyGraph, targetId?: string) {
  return g.nodesByLabel("FailedAttempt")
    .filter((fa) => (targetId ? fa.props.target_id === targetId : true))
    .map((fa) => ({
      id: fa.id,
      actionKind: String(fa.props.action_kind),
      targetId: String(fa.props.target_id),
      reason: String(fa.props.reason),
      attemptedAt: String(fa.props.attempted_at),
      openLoopId: g.out(fa.id, "ABOUT")[0]?.to ?? null,
    }));
}

export function unownedOpenLoops(g: PropertyGraph) {
  return g.nodesByLabel("OpenLoop")
    .filter((o) => ["OPEN", "BLOCKED", "ESCALATED"].includes(String(o.props.status)))
    .filter((o) => g.in(o.id, "OWNS").length === 0)
    .map((o) => ({
      id: o.id,
      title: String(o.props.title),
      description: String(o.props.description),
      priority: Number(o.props.priority),
      status: String(o.props.status),
      dueAt: String(o.props.due_at ?? ""),
    }));
}

export function openLoops(g: PropertyGraph) {
  return g.nodesByLabel("OpenLoop").map((o) => {
    const ownerRel = g.in(o.id, "OWNS")[0];
    const owner = ownerRel ? g.get(ownerRel.from) : undefined;
    return {
      id: o.id,
      title: String(o.props.title),
      description: String(o.props.description),
      priority: Number(o.props.priority),
      status: String(o.props.status),
      dueAt: String(o.props.due_at ?? ""),
      ownerId: owner?.id ?? null,
      ownerName: owner ? String(owner.props.name) : null,
    };
  });
}

export function handoffContext(g: PropertyGraph, handoffId: string) {
  const h = g.get(handoffId);
  if (!h) return null;
  const from = g.out(h.id, "FROM_AGENT")[0];
  const to = g.out(h.id, "TO_AGENT")[0];
  const loops = g.out(h.id, "TRANSFERS").map((rel) => {
    const o = g.must(rel.to);
    const ownerRel = g.in(o.id, "OWNS")[0];
    return {
      id: o.id,
      title: String(o.props.title),
      status: String(o.props.status),
      ownerId: ownerRel?.from ?? null,
    };
  });
  return {
    id: h.id,
    summary: String(h.props.summary),
    status: String(h.props.status),
    referenceTime: String(h.props.reference_time),
    fromAgentId: from?.to ?? String(h.props.from_agent_id),
    toAgentId: to?.to ?? String(h.props.to_agent_id),
    loops,
    failedAttempts: failedAttemptsFor(g),
  };
}

export function supersessionChain(g: PropertyGraph, t: string) {
  const rows = [];
  for (const rel of [...g.nodesByLabel("Fact")].flatMap((f) => g.out(f.id, "SUPERSEDES").map((r) => ({ newer: f, rel: r })))) {
    const older = g.get(rel.rel.to);
    if (!older) continue;
    const newerRec = factRecord(g, rel.newer.id);
    const olderRec = factRecord(g, older.id);
    if (!newerRec || !olderRec) continue;
    if (!isValidAt(newerRec.validFrom, newerRec.validTo, t) && newerRec.validFrom > t) continue;
    rows.push({
      subjectId: newerRec.subjectId,
      predicate: newerRec.predicate,
      currentValue: newerRec.objectValue,
      currentValidFrom: newerRec.validFrom,
      previousValue: olderRec.objectValue,
      previousValidFrom: olderRec.validFrom,
      previousValidTo: olderRec.validTo,
      previousFactId: olderRec.id,
      currentFactId: newerRec.id,
    });
  }
  return rows;
}

export function sheltersAt(g: PropertyGraph, _t: string) {
  return g.nodesByLabel("Shelter").map((s) => {
    const zone = g.out(s.id, "LOCATED_IN")[0];
    const z = zone ? g.get(zone.to) : undefined;
    return {
      id: s.id,
      name: String(s.props.name),
      capacity: Number(s.props.capacity),
      occupied: Number(s.props.occupied),
      available: Number(s.props.capacity) - Number(s.props.occupied),
      accessible: Boolean(s.props.accessible),
      status: String(s.props.status),
      services: Array.isArray(s.props.services) ? s.props.services : [],
      zoneId: z?.id ?? "",
      zoneName: z ? String(z.props.name) : "",
    };
  });
}

export function candidatePlans(g: PropertyGraph, hazardId: string, t: string): ShelterCandidate[] {
  const hazard = g.get(hazardId);
  if (!hazard) return [];
  const zones = g.out(hazardId, "AFFECTS").map((rel) => g.must(rel.to));
  const candidates: ShelterCandidate[] = [];

  for (const z of zones) {
    const origin = originSiteForZone(g, z.id);
    const households = g.in(z.id, "LOCATED_IN").map((rel) => g.get(rel.from)).filter((n) => n?.labels.includes("Household"));
    const needs = households.flatMap((hh) => (hh ? g.out(hh.id, "HAS_NEED").map((r) => g.get(r.to)).filter(Boolean) : []));
    const requested = needs.reduce((sum, n) => sum + (n && n.props.kind === "SHELTER" ? Number(n.props.quantity ?? 0) : 0), 0);
    const needKinds = new Set(needs.filter(Boolean).map((n) => String(n!.props.kind)));
    const mobilityLimited = households.some((hh) => hh && hh.props.mobility === "LIMITED");

    const originAgencies = g.in(z.id, "HAS_AUTHORITY")
      .filter((rel) => isValidAt(rel.props.valid_from ? String(rel.props.valid_from) : null, rel.props.valid_to ? String(rel.props.valid_to) : null, t))
      .map((rel) => g.must(rel.from));

    for (const s of g.nodesByLabel("Shelter")) {
      if (s.props.status !== "OPEN") continue;
      const destZoneRel = g.out(s.id, "LOCATED_IN")[0];
      const destZone = destZoneRel ? g.must(destZoneRel.to) : z;
      const dest = shelterSite(g, s.id);
      const available = Number(s.props.capacity) - Number(s.props.occupied);
      const services = Array.isArray(s.props.services) ? s.props.services : [];
      const accessible = Boolean(s.props.accessible);

      const failed = failedAttemptsFor(g, s.id)[0] ?? null;

      let routeOpen = true;
      let routeMinutes = 0;
      let routeSiteIds: string[] = origin && dest ? [origin, dest] : [];
      let routeRoadIds: string[] = [];
      const blockedRoads: string[] = [];

      if (origin && dest && origin !== dest) {
        const openPath = g.shortestPath(origin, dest, "CONNECTED_BY", {
          edgeOk: (rel) => String(rel.props.status) === "OPEN",
        });
        const anyPath = g.shortestPath(origin, dest, "CONNECTED_BY", { edgeOk: () => true });
        if (!openPath) {
          routeOpen = false;
          if (anyPath) {
            routeSiteIds = anyPath.nodeIds;
            routeRoadIds = anyPath.relIds.map((rid) => {
              const rel = [...g.out(origin, "CONNECTED_BY"), ...g.nodesByLabel("Site").flatMap((site) => g.out(site.id, "CONNECTED_BY"))].find((x) => x.id === rid);
              return String(rel?.props.road_id ?? rid);
            });
            for (const rid of anyPath.relIds) {
              // resolve rel from graph
            }
            routeMinutes = anyPath.minutes;
            for (const site of anyPath.nodeIds.slice(0, -1)) {
              for (const rel of g.out(site, "CONNECTED_BY")) {
                if (anyPath.relIds.includes(rel.id) && String(rel.props.status) !== "OPEN") {
                  blockedRoads.push(String(rel.props.road_id));
                }
              }
            }
          }
        } else {
          routeSiteIds = openPath.nodeIds;
          routeMinutes = openPath.minutes;
          routeRoadIds = [];
          for (const site of openPath.nodeIds.slice(0, -1)) {
            for (const rel of g.out(site, "CONNECTED_BY")) {
              if (openPath.relIds.includes(rel.id)) routeRoadIds.push(String(rel.props.road_id));
            }
          }
        }
      }

      const destAgencies = g.in(destZone.id, "HAS_AUTHORITY")
        .filter((rel) => isValidAt(rel.props.valid_from ? String(rel.props.valid_from) : null, rel.props.valid_to ? String(rel.props.valid_to) : null, t))
        .map((rel) => g.must(rel.from));

      const destAuthority = destAgencies.length > 0;
      const agency = originAgencies[0] ?? destAgencies[0] ?? null;
      const assetRel = agency ? g.out(agency.id, "CONTROLS").find((rel) => {
        const a = g.get(rel.to);
        return a && a.props.status === "AVAILABLE";
      }) : undefined;
      const asset = assetRel ? g.get(assetRel.to) : undefined;

      const blockingReasons: string[] = [];
      if (!routeOpen) blockingReasons.push(`Route closed: ${blockedRoads.map((id) => g.get(id)?.props.name ?? id).join(", ") || "no open path"}`);
      if (available < requested) blockingReasons.push(`Capacity ${available} < requested ${requested}`);
      if (mobilityLimited && !accessible) blockingReasons.push("Shelter is not step-free; mobility-limited households present");
      if (failed) blockingReasons.push(`Previous failed attempt: ${failed.reason}`);
      if (!destAuthority) blockingReasons.push(`No confirmed authority on destination zone ${destZone.props.name}`);
      if (!agency) blockingReasons.push("No origin authority");

      const coverage = requested <= 0 ? 1 : Math.min(1, available / requested);
      let score = coverage * 0.55 + (accessible ? 0.2 : 0) + (routeOpen ? 0.15 : 0) + (destAuthority ? 0.1 : 0);
      if (failed) score -= 0.5;
      if (!routeOpen) score -= 0.4;
      if (needKinds.has("MEDICAL") && services.includes("MEDICAL")) score += 0.05;

      candidates.push({
        shelterId: s.id,
        shelterName: String(s.props.name),
        zoneId: destZone.id,
        zoneName: String(destZone.props.name),
        availableSpaces: available,
        accessible,
        services,
        routeOpen,
        routeMinutes,
        routeSiteIds,
        routeRoadIds,
        blockedRoads,
        authorityAgencyId: agency?.id ?? null,
        authorityAgencyName: agency ? String(agency.props.name) : null,
        destinationAuthority: destAuthority,
        assetId: asset?.id ?? null,
        assetKind: asset ? String(asset.props.kind) : null,
        failedAttempt: failed ? { id: failed.id, reason: failed.reason } : null,
        exposedHouseholds: households.length,
        requestedQuantity: requested,
        capacityCoverage: coverage,
        planScore: Number(score.toFixed(3)),
        blockingReasons,
      });
    }
  }

  return candidates.sort((a, b) => b.planScore - a.planScore);
}

export function evidencePacket(g: PropertyGraph, factIds: string[]) {
  return factIds.flatMap((id) => {
    const rec = factRecord(g, id);
    if (!rec) return [];
    const ev = evidenceForFact(g, id);
    return ev.map((e) => ({ ...e, factId: rec.id, predicate: rec.predicate, value: rec.objectValue, validFrom: rec.validFrom, validTo: rec.validTo }));
  });
}

export function graphHealth(g: PropertyGraph) {
  return {
    graph: g.name,
    nodes: g.nodeCount(),
    relationships: g.relCount(),
    labels: {
      Fact: g.nodesByLabel("Fact").length,
      Shelter: g.nodesByLabel("Shelter").length,
      Household: g.nodesByLabel("Household").length,
      Episode: g.nodesByLabel("Episode").length,
      Decision: g.nodesByLabel("Decision").length,
    },
    ready: g.nodeCount() > 0,
  };
}

export function episodesSince(g: PropertyGraph, since: string) {
  return g.nodesByLabel("Episode")
    .filter((e) => String(e.props.occurred_at) >= since)
    .sort((a, b) => String(b.props.occurred_at).localeCompare(String(a.props.occurred_at)))
    .map((e) => ({
      id: e.id,
      kind: String(e.props.kind),
      text: String(e.props.text),
      occurredAt: String(e.props.occurred_at),
      author: String(e.props.author_agent_id),
      importance: Number(e.props.importance ?? 0),
    }));
}

export function decisions(g: PropertyGraph) {
  return g.nodesByLabel("Decision")
    .map((d) => ({
      id: d.id,
      actionKind: String(d.props.action_kind),
      status: String(d.props.status),
      rationale: String(d.props.rationale),
      referenceTime: String(d.props.reference_time),
      confidence: Number(d.props.confidence ?? 0),
      createdBy: String(d.props.created_by ?? ""),
      approvedBy: d.props.approved_by ? String(d.props.approved_by) : null,
      shelterId: d.props.shelter_id ? String(d.props.shelter_id) : null,
      action: d.props.action ? String(d.props.action) : null,
      factIds: g.out(d.id, "USES_FACT").map((r) => r.to),
    }))
    .sort((a, b) => b.referenceTime.localeCompare(a.referenceTime));
}

export function reconstructFacts(g: PropertyGraph, t: string): FactRecord[] {
  return factsAtTime(g, t, ["VALID", "SUPERSEDED"]);
}
