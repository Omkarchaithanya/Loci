import type { GraphStore } from "./store.ts";
import type { ChangeKind, FactChange, FactRecord } from "./types.ts";
import { isValidAt } from "./types.ts";

export async function factRecord(store: GraphStore, factId: string): Promise<FactRecord | null> {
  const res = await store.query("MATCH (f:Fact {id: $factId}) OPTIONAL MATCH (f)-[:ABOUT]->(subj) OPTIONAL MATCH (f)<-[:SUPERSEDES]-(sup) RETURN f, subj, sup", { factId });
  if (!res.data.length) return null;
  const { f, subj, sup } = res.data[0];
  return {
    id: f.properties.id,
    subjectId: String(f.properties.subject_id ?? subj?.properties?.id ?? ""),
    subjectLabels: subj?.labels ?? [],
    predicate: String(f.properties.predicate ?? ""),
    objectValue: String(f.properties.object_value ?? ""),
    validFrom: String(f.properties.valid_from ?? ""),
    validTo: f.properties.valid_to == null ? null : String(f.properties.valid_to),
    observedAt: String(f.properties.observed_at ?? ""),
    confidence: Number(f.properties.confidence ?? 0),
    status: String(f.properties.status ?? ""),
    sourceId: String(f.properties.source_id ?? ""),
    supersededBy: sup?.properties?.id,
  };
}

export async function factsAtTime(store: GraphStore, t: string, statuses: string[] = ["VALID", "SUPERSEDED"]): Promise<FactRecord[]> {
  const res = await store.query("MATCH (f:Fact) OPTIONAL MATCH (f)-[:ABOUT]->(subj) OPTIONAL MATCH (f)<-[:SUPERSEDES]-(sup) RETURN f, subj, sup");
  const out: FactRecord[] = [];
  for (const row of res.data) {
    const { f, subj, sup } = row;
    const rec = {
      id: f.properties.id,
      subjectId: String(f.properties.subject_id ?? subj?.properties?.id ?? ""),
      subjectLabels: subj?.labels ?? [],
      predicate: String(f.properties.predicate ?? ""),
      objectValue: String(f.properties.object_value ?? ""),
      validFrom: String(f.properties.valid_from ?? ""),
      validTo: f.properties.valid_to == null ? null : String(f.properties.valid_to),
      observedAt: String(f.properties.observed_at ?? ""),
      confidence: Number(f.properties.confidence ?? 0),
      status: String(f.properties.status ?? ""),
      sourceId: String(f.properties.source_id ?? ""),
      supersededBy: sup?.properties?.id,
    };
    if (!statuses.includes(rec.status) && rec.status !== "VALID") {
      if (!statuses.includes(rec.status)) continue;
    }
    if (!isValidAt(rec.validFrom, rec.validTo, t)) continue;
    if (rec.status === "SUPERSEDED" && !statuses.includes("SUPERSEDED")) continue;
    if (rec.status === "VALID" && !statuses.includes("VALID")) continue;
    out.push(rec);
  }
  return out.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.predicate.localeCompare(b.predicate));
}

export async function currentFacts(store: GraphStore, t: string): Promise<FactRecord[]> {
  return (await factsAtTime(store, t, ["VALID"])).filter((f) => f.status === "VALID");
}

export async function diffFacts(store: GraphStore, earlier: string, later: string): Promise<FactChange[]> {
  const res = await store.query("MATCH (f:Fact) OPTIONAL MATCH (f)-[:ABOUT]->(subj) OPTIONAL MATCH (f)<-[:SUPERSEDES]-(sup) RETURN f, subj, sup");
  const changes: FactChange[] = [];
  for (const row of res.data) {
    const { f, subj, sup } = row;
    const rec = {
      id: f.properties.id,
      subjectId: String(f.properties.subject_id ?? subj?.properties?.id ?? ""),
      subjectLabels: subj?.labels ?? [],
      predicate: String(f.properties.predicate ?? ""),
      objectValue: String(f.properties.object_value ?? ""),
      validFrom: String(f.properties.valid_from ?? ""),
      validTo: f.properties.valid_to == null ? null : String(f.properties.valid_to),
      observedAt: String(f.properties.observed_at ?? ""),
      confidence: Number(f.properties.confidence ?? 0),
      status: String(f.properties.status ?? ""),
      sourceId: String(f.properties.source_id ?? ""),
      supersededBy: sup?.properties?.id,
    };
    const coversLater = isValidAt(rec.validFrom, rec.validTo, later) || rec.validFrom <= later;
    const overlapsWindow = rec.validFrom <= later && (rec.validTo == null || rec.validTo > earlier);
    if (!overlapsWindow && !coversLater) continue;
    let changeKind: ChangeKind = "PERSISTED";
    if (rec.validFrom > earlier && rec.validFrom <= later) changeKind = "NEW_AFTER_EARLIER_TIME";
    else if (rec.validTo && rec.validTo <= later && rec.validTo > earlier) changeKind = "EXPIRED_BY_LATER_TIME";
    if (rec.status === "SUPERSEDED" && rec.validTo && rec.validTo <= later && rec.validTo > earlier) {
      changeKind = "SUPERSEDED";
    }
    if (changeKind === "PERSISTED" && !(isValidAt(rec.validFrom, rec.validTo, earlier) && isValidAt(rec.validFrom, rec.validTo, later))) {
      continue;
    }
    changes.push({ ...rec, changeKind });
  }
  return changes.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.predicate.localeCompare(b.predicate));
}

export async function supersedeFact(
  store: GraphStore,
  oldFactId: string,
  newId: string,
  newValue: string,
  validFrom: string,
  sourceId: string,
  confidence: number,
  observedAt: string,
): Promise<string> {
  const oldRes = await store.query("MATCH (f:Fact {id: $oldFactId})-[:ABOUT]->(subj) OPTIONAL MATCH (f)-[:SUPPORTED_BY]->(sup) RETURN f, subj, sup LIMIT 1", { oldFactId });
  if (!oldRes.data.length) throw new Error(`Fact ${oldFactId} has no ABOUT`);
  const { f: old, subj: about, sup: support } = oldRes.data[0];
  
  await store.query(`MERGE (new:Fact {id: $newId}) SET new += {subject_id: $subjectId, predicate: $predicate, object_value: $newValue, value_type: $valueType, valid_from: $validFrom, valid_to: null, observed_at: $observedAt, confidence: $confidence, status: 'VALID', source_id: $sourceId, created_at: $observedAt, updated_at: $observedAt}`, {
    newId, subjectId: String(old.properties.subject_id), predicate: String(old.properties.predicate), newValue, valueType: String(old.properties.value_type ?? "STRING"), validFrom, observedAt, confidence, sourceId
  });
  await store.query("MATCH (new:Fact {id: $newId}), (subj {id: $aboutId}) MERGE (new)-[:ABOUT]->(subj)", { newId, aboutId: about.properties.id });
  await store.query("MATCH (new:Fact {id: $newId}), (old:Fact {id: $oldFactId}) MERGE (new)-[:SUPERSEDES]->(old)", { newId, oldFactId });
  if (support) {
    await store.query("MATCH (new:Fact {id: $newId}), (sup {id: $supId}) MERGE (new)-[:SUPPORTED_BY]->(sup)", { newId, supId: support.properties.id });
  }
  await store.query("MATCH (old:Fact {id: $oldFactId}) SET old.valid_to = $validFrom, old.status = 'SUPERSEDED', old.updated_at = $observedAt", { oldFactId, validFrom, observedAt });
  return newId;
}

export async function evidenceForFact(store: GraphStore, factId: string): Promise<{ evidenceId: string; quote: string; sourceId: string; url: string }[]> {
  const res = await store.query("MATCH (f:Fact {id: $factId})-[:SUPPORTED_BY]->(e:Evidence) OPTIONAL MATCH (e)-[:FROM_SOURCE]->(src:Source) RETURN e, src", { factId });
  const out = [];
  for (const row of res.data) {
    const { e, src } = row;
    out.push({
      evidenceId: e.properties.id,
      quote: String(e.properties.quote ?? ""),
      sourceId: src?.properties?.id ?? String(e.properties.source_id ?? ""),
      url: String(src?.properties?.url ?? ""),
    });
  }
  return out;
}
