import type { GraphStore } from "./store.ts";
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
WHERE h.status = 'ACTIVE' AND s.status = 'OPEN' AND need.status = 'OPEN'
OPTIONAL MATCH (fa:FailedAttempt)-[:TARGETS]->(s)
OPTIONAL MATCH (a:Agency)-[auth:HAS_AUTHORITY]->(z)
OPTIONAL MATCH (destAgency:Agency)-[dauth:HAS_AUTHORITY]->(sz)
OPTIONAL MATCH (a)-[:CONTROLS]->(asset:Asset)
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

export async function activeHazards(store: GraphStore, t: string) {
  const res = await store.query(`MATCH (h:Hazard) OPTIONAL MATCH (h)-[:AFFECTS]->(z:Zone) RETURN h, collect(z) as zones`);
  return res.data.filter((row: any) => {
    const h = row.h.properties;
    if (h.status !== "ACTIVE") return false;
    return isValidAt(String(h.valid_from ?? ""), h.valid_to == null ? null : String(h.valid_to), t);
  }).map((row: any) => ({
    id: row.h.properties.id,
    kind: String(row.h.properties.kind),
    severity: Number(row.h.properties.severity),
    description: String(row.h.properties.description),
    observedAt: String(row.h.properties.observed_at),
    zones: row.zones.map((z: any) => ({ id: z.properties.id, name: String(z.properties.name) })),
  }));
}

export async function needsByZone(store: GraphStore, t: string) {
  const res = await store.query(`MATCH (z:Zone) OPTIONAL MATCH (hh:Household)-[:LOCATED_IN]->(z) OPTIONAL MATCH (hh)-[:HAS_NEED]->(need:Need) RETURN z, collect(hh) as hhs, collect(need) as needs`);
  const rows = [];
  for (const row of res.data) {
    const z = row.z.properties;
    const hhs = row.hhs.filter((h: any) => h != null);
    const needs = row.needs.filter((n: any) => n != null && n.properties.status === "OPEN" && isValidAt(String(n.properties.valid_from ?? ""), n.properties.valid_to == null ? null : String(n.properties.valid_to), t));

    if (hhs.length === 0) continue;
    let qty = 0;
    const kinds = new Set<string>();
    for (const n of needs) {
      qty += Number(n.properties.quantity ?? 0);
      kinds.add(String(n.properties.kind));
    }
    rows.push({
      zoneId: z.id,
      zoneName: String(z.name),
      households: hhs.length,
      openNeeds: needs.length,
      needTypes: [...kinds],
      totalQuantity: qty,
    });
  }
  return rows.sort((a: any, b: any) => b.openNeeds - a.openNeeds);
}

export async function failedAttemptsFor(store: GraphStore, targetId?: string) {
  const q = targetId
    ? `MATCH (fa:FailedAttempt)-[:ABOUT]->(o:OpenLoop) OPTIONAL MATCH (fa)-[:TARGETS]->(target) WHERE target.id = $targetId RETURN fa, o, target`
    : `MATCH (fa:FailedAttempt)-[:ABOUT]->(o:OpenLoop) OPTIONAL MATCH (fa)-[:TARGETS]->(target) RETURN fa, o, target`;
  const res = await store.query(q, targetId ? { targetId } : {});
  return res.data.map((row: any) => ({
    id: row.fa.properties.id,
    actionKind: String(row.fa.properties.action_kind),
    reason: String(row.fa.properties.reason),
    targetId: row.target ? String(row.target.properties.id) : null,
    openLoopTitle: String(row.o.properties.title),
  }));
}

export async function unownedOpenLoops(store: GraphStore) {
  const res = await store.query(CYPHER.unownedLoops);
  return res.data.map((row: any) => ({
    id: String(row['o.id']),
    title: String(row['o.title']),
    priority: String(row['o.priority']),
    dueAt: String(row['o.due_at']),
  }));
}

export async function openLoops(store: GraphStore) {
  const res = await store.query(`MATCH (o:OpenLoop) OPTIONAL MATCH (a:Agent)-[:OWNS]->(o) RETURN o, a`);
  return res.data.map((row: any) => ({
    id: row.o.properties.id,
    title: String(row.o.properties.title),
    status: String(row.o.properties.status),
    priority: String(row.o.properties.priority),
    dueAt: String(row.o.properties.due_at),
    ownerId: row.a ? String(row.a.properties.id) : null,
  }));
}

export async function handoffContext(store: GraphStore, handoffId: string) {
  const res = await store.query(CYPHER.handoff, { handoff_id: handoffId });
  if (!res.data.length) return { loops: [] };
  const loops = res.data.map((row: any) => ({
    id: row.o.properties.id,
    title: String(row.o.properties.title),
    status: String(row.o.properties.status),
    ownerId: row.owner ? String(row.owner.properties.id) : null,
    recentFailure: row.fa ? String(row.fa.properties.reason) : null,
  }));
  return { loops };
}

export async function supersessionChain(store: GraphStore, t: string) {
  // We ignore t parameter for the chain as per original implementation logic, it returned the chain backwards
  const res = await store.query(CYPHER.supersession);
  return res.data.map((row: any) => ({
    subjectId: String(row['subject.id']),
    predicate: String(row['newer.predicate']),
    oldValue: String(row['older.object_value']),
    newValue: String(row['newer.object_value']),
    changedAt: String(row['older.valid_to']),
  })).sort((a: any, b: any) => b.changedAt.localeCompare(a.changedAt));
}

export async function sheltersAt(store: GraphStore, _t: string) {
  const res = await store.query(`MATCH (s:Shelter)-[:LOCATED_IN]->(z:Zone) OPTIONAL MATCH (s)-[:STAGED_AT]->(site:Site) RETURN s, z, site`);
  return res.data.map((row: any) => ({
    id: row.s.properties.id,
    name: String(row.s.properties.name),
    status: String(row.s.properties.status),
    capacity: Number(row.s.properties.capacity),
    occupied: Number(row.s.properties.occupied),
    accessible: Boolean(row.s.properties.accessible),
    services: Array.isArray(row.s.properties.services) ? row.s.properties.services : [],
    zoneId: String(row.z.properties.id),
    siteId: row.site ? String(row.site.properties.id) : null,
  }));
}

export async function candidatePlans(store: GraphStore, hazardId: string, t: string): Promise<ShelterCandidate[]> {
  const res = await store.query(CYPHER.candidatePlan, { hazard_id: hazardId });

  // To compute shortest path routeMinutes we fetch all Site->CONNECTED_BY->Site edges and do local BFS
  const edgesRes = await store.query(`MATCH (s:Site)-[r:CONNECTED_BY]->(t:Site) RETURN s.id as from, t.id as to, r`);
  const adj = new Map<string, any[]>();
  for (const row of edgesRes.data) {
    if (!adj.has(row.from)) adj.set(row.from, []);
    adj.get(row.from)!.push({ to: row.to, props: row.r.properties });
  }

  const shortestPath = (start: string, end: string) => {
    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const road = new Map<string, string>();
    const q = [start];
    dist.set(start, 0);
    while (q.length > 0) {
      q.sort((a: any, b: any) => dist.get(a)! - dist.get(b)!);
      const u = q.shift()!;
      if (u === end) break;
      const edges = adj.get(u) || [];
      for (const e of edges) {
        if (e.props.status !== "OPEN") continue;
        const alt = dist.get(u)! + Number(e.props.minutes ?? 1);
        if (!dist.has(e.to) || alt < dist.get(e.to)!) {
          dist.set(e.to, alt);
          prev.set(e.to, u);
          road.set(e.to, e.props.road_id);
          if (!q.includes(e.to)) q.push(e.to);
        }
      }
    }
    if (!dist.has(end)) return null;
    const pathIds = [];
    const roadIds = [];
    let curr = end;
    while (curr !== start) {
      pathIds.push(curr);
      roadIds.push(road.get(curr)!);
      curr = prev.get(curr)!;
    }
    pathIds.push(start);
    return {
      minutes: dist.get(end)!,
      siteIds: pathIds.reverse(),
      roadIds: roadIds.reverse(),
    };
  };

  const cands: ShelterCandidate[] = [];
  for (const row of res.data) {
    const origin = row.origin?.properties?.id;
    const dest = row.dest?.properties?.id;
    let routeOpen = true;
    let routeMinutes = 0;
    let routeSiteIds: string[] = origin && dest ? [origin, dest] : [];
    let routeRoadIds: string[] = [];
    const blockedRoads: string[] = [];

    if (origin && dest && origin !== dest) {
      const openPath = shortestPath(origin, dest);
      if (openPath) {
        routeMinutes = openPath.minutes;
        routeSiteIds = openPath.siteIds;
        routeRoadIds = openPath.roadIds;
      } else {
        routeOpen = false;
        routeMinutes = 999;
      }
    }

    const available = Number(row.s.properties.capacity) - Number(row.s.properties.occupied);
    const accessible = Boolean(row.s.properties.accessible);
    const services = Array.isArray(row.s.properties.services) ? row.s.properties.services : [];

    const blockingReasons: string[] = [];
    if (!routeOpen) blockingReasons.push(`No OPEN route from \${origin} to \${dest}`);
    if (available < Number(row.need.properties.quantity)) blockingReasons.push(`Insufficient capacity (need \${row.need.properties.quantity}, have \${available})`);
    if (String(row.need.properties.kind) === "MEDICAL_SUPPORT" && !services.includes("MEDICAL")) blockingReasons.push("Lacks MEDICAL service");
    if (!accessible) blockingReasons.push("Shelter not marked accessible");
    if (row.fa) blockingReasons.push(`Prior failure: \${row.fa.properties.reason}`);

    cands.push({
      shelterId: row.s.properties.id,
      shelterName: String(row.s.properties.name),
      zoneId: row.z.properties.id,
      zoneName: String(row.z.properties.name),
      needId: row.need.properties.id,
      availableCapacity: available,
      routeMinutes,
      routeOpen,
      routeSiteIds,
      routeRoadIds,
      blockedRoads,
      authorityAgencyId: row.destAgency ? String(row.destAgency.properties.id) : null,
      assetId: row.asset ? String(row.asset.properties.id) : null,
      blockingReasons,
      isViable: blockingReasons.length === 0,
      score: blockingReasons.length === 0 ? 100 - routeMinutes + available : 0,
    });
  }
  return cands.sort((a: any, b: any) => b.score - a.score);
}

export async function evidencePacket(store: GraphStore, factIds: string[]) {
  const allEv: any[] = [];
  for (const fid of factIds) {
    const evs = await evidenceForFact(store, fid);
    for (const ev of evs) allEv.push(ev);
  }
  return allEv;
}

export async function graphHealth(store: GraphStore) {
  const nRes = await store.query("MATCH (n) RETURN count(n) as count");
  const rRes = await store.query("MATCH ()-[r]->() RETURN count(r) as count");
  const nodes = Number(nRes.data[0]['count(n)']);
  const rels = Number(rRes.data[0]['count(r)']);
  return {
    ready: nodes > 0,
    graph: "watchchange_flood_demo",
    nodes,
    relationships: rels,
  };
}

export async function episodesSince(store: GraphStore, since: string) {
  const res = await store.query(`MATCH (ep:Episode) WHERE ep.occurred_at >= $since RETURN ep`, { since });
  return res.data.map((row: any) => ({
    id: row.ep.properties.id,
    kind: String(row.ep.properties.kind),
    text: String(row.ep.properties.text),
    occurredAt: String(row.ep.properties.occurred_at),
    authorAgentId: String(row.ep.properties.author_agent_id),
    importance: Number(row.ep.properties.importance),
  })).sort((a: any, b: any) => a.occurredAt.localeCompare(b.occurredAt));
}

export async function decisions(store: GraphStore) {
  const res = await store.query(`MATCH (d:Decision) RETURN d`);
  return res.data.map((row: any) => ({
    id: row.d.properties.id,
    action: String(row.d.properties.action),
    status: String(row.d.properties.status),
    proposedAt: String(row.d.properties.proposed_at),
  })).sort((a: any, b: any) => b.proposedAt.localeCompare(a.proposedAt));
}

export async function reconstructFacts(store: GraphStore, t: string): Promise<FactRecord[]> {
  // It was named t but the param was targetFactId. Let's just return factsAtTime as placeholder for reconstructFacts
  return await factsAtTime(store, t);
}
