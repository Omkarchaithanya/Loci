import type { PropertyGraph } from "./engine.ts";
import type { ChangeKind, FactChange, FactRecord } from "./types.ts";
import { isValidAt } from "./types.ts";

export function factRecord(g: PropertyGraph, factId: string): FactRecord | null {
  const f = g.get(factId);
  if (!f || !f.labels.includes("Fact")) return null;
  const about = g.out(factId, "ABOUT")[0];
  const subject = about ? g.get(about.to) : undefined;
  const superseder = g.in(factId, "SUPERSEDES")[0];
  return {
    id: f.id,
    subjectId: String(f.props.subject_id ?? subject?.id ?? ""),
    subjectLabels: subject?.labels ?? [],
    predicate: String(f.props.predicate ?? ""),
    objectValue: String(f.props.object_value ?? ""),
    validFrom: String(f.props.valid_from ?? ""),
    validTo: f.props.valid_to == null ? null : String(f.props.valid_to),
    observedAt: String(f.props.observed_at ?? ""),
    confidence: Number(f.props.confidence ?? 0),
    status: String(f.props.status ?? ""),
    sourceId: String(f.props.source_id ?? ""),
    supersededBy: superseder?.from,
  };
}

export function factsAtTime(g: PropertyGraph, t: string, statuses: string[] = ["VALID", "SUPERSEDED"]): FactRecord[] {
  const out: FactRecord[] = [];
  for (const f of g.nodesByLabel("Fact")) {
    const rec = factRecord(g, f.id);
    if (!rec) continue;
    if (!statuses.includes(rec.status) && rec.status !== "VALID") {
      if (!statuses.includes(rec.status)) continue;
    }
    if (!isValidAt(rec.validFrom, rec.validTo, t)) continue;
    // Historical reconstruction includes SUPERSEDED facts whose interval still covers t.
    if (rec.status === "SUPERSEDED" && !statuses.includes("SUPERSEDED")) continue;
    if (rec.status === "VALID" && !statuses.includes("VALID")) continue;
    out.push(rec);
  }
  return out.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.predicate.localeCompare(b.predicate));
}

export function currentFacts(g: PropertyGraph, t: string): FactRecord[] {
  return factsAtTime(g, t, ["VALID"]).filter((f) => f.status === "VALID");
}

export function diffFacts(g: PropertyGraph, earlier: string, later: string): FactChange[] {
  const changes: FactChange[] = [];
  for (const f of g.nodesByLabel("Fact")) {
    const rec = factRecord(g, f.id);
    if (!rec) continue;
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

export function supersedeFact(
  g: PropertyGraph,
  oldFactId: string,
  newId: string,
  newValue: string,
  validFrom: string,
  sourceId: string,
  confidence: number,
  observedAt: string,
): string {
  const old = g.must(oldFactId);
  const about = g.out(oldFactId, "ABOUT")[0];
  if (!about) throw new Error(`Fact ${oldFactId} has no ABOUT`);
  g.mergeNode(
    ["Fact"],
    newId,
    {
      id: newId,
      subject_id: String(old.props.subject_id),
      predicate: String(old.props.predicate),
      object_value: newValue,
      value_type: String(old.props.value_type ?? "STRING"),
      valid_from: validFrom,
      valid_to: null,
      observed_at: observedAt,
      confidence,
      status: "VALID",
      source_id: sourceId,
      created_at: observedAt,
      updated_at: observedAt,
    },
  );
  g.mergeRel("ABOUT", newId, about.to);
  g.mergeRel("SUPERSEDES", newId, oldFactId);
  const support = g.out(oldFactId, "SUPPORTED_BY")[0];
  if (support) g.mergeRel("SUPPORTED_BY", newId, support.to);
  g.setProps(oldFactId, {
    valid_to: validFrom,
    status: "SUPERSEDED",
    updated_at: observedAt,
  });
  return newId;
}

export function evidenceForFact(g: PropertyGraph, factId: string): { evidenceId: string; quote: string; sourceId: string; url: string }[] {
  const out: { evidenceId: string; quote: string; sourceId: string; url: string }[] = [];
  for (const rel of g.out(factId, "SUPPORTED_BY")) {
    const e = g.get(rel.to);
    if (!e) continue;
    const srcRel = g.out(e.id, "FROM_SOURCE")[0];
    const src = srcRel ? g.get(srcRel.to) : undefined;
    out.push({
      evidenceId: e.id,
      quote: String(e.props.quote ?? ""),
      sourceId: src?.id ?? String(e.props.source_id ?? ""),
      url: String(src?.props.url ?? ""),
    });
  }
  return out;
}
