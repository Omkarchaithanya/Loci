import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDot,
  Lock,
  Radio,
  ShieldCheck,
  Siren,
  Waypoints,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EvidencePath, PathCanvas } from "@/components/mission/graph-viz";
import { briefIncomingWatch } from "@/lib/ai/brief";
import type { DemoFlags } from "@/lib/demo/world.ts";
import { buildWorld, T14 } from "@/lib/demo/world.ts";
import {
  activeHazards,
  CYPHER,
  decisions,
  episodesSince,
  failedAttemptsFor,
  graphHealth,
  handoffContext,
  needsByZone,
  openLoops,
  reconstructFacts,
  sheltersAt,
  supersessionChain,
  unownedOpenLoops,
} from "@/lib/graph/queries.ts";
import { rankTable } from "@/lib/agents/planner.ts";
import { useDemo } from "@/lib/demo/store.ts";
import { cn } from "@/lib/utils";

function Panel({
  title,
  kicker,
  children,
  className,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:p-5", className)}>
      {kicker ? <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{kicker}</p> : null}
      <h2 className="mb-4 text-base font-medium tracking-tight text-fg">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "cyan" | "hazard" | "ok" | "amber" }) {
  const color =
    tone === "hazard" ? "text-hazard" : tone === "ok" ? "text-ok" : tone === "amber" ? "text-amber" : tone === "cyan" ? "text-cyan" : "text-fg";
  return (
    <div className="rounded-lg bg-inset px-3 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={cn("mt-1 font-mono text-xl tabular-nums", color)}>{value}</p>
    </div>
  );
}

export function OverviewPanel({ flags }: { flags: DemoFlags }) {
  const graph = useMemo(() => buildWorld(flags), [flags]);
  const hazards = activeHazards(graph, flags.referenceTime);
  const needs = needsByZone(graph, flags.referenceTime);
  const shelters = sheltersAt(graph, flags.referenceTime);
  const loops = openLoops(graph);
  const health = graphHealth(graph);
  const west = needs.find((n) => n.zoneId === "zone_west_basin");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel kicker="Incident" title="Cedar River rise — West Basin" className="lg:col-span-2">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Severity" value="4 / 5" tone="hazard" />
          <Metric label="Households" value={String(west?.households ?? 0)} tone="cyan" />
          <Metric label="Open needs" value={String(west?.totalQuantity ?? 0)} tone="amber" />
          <Metric label="Graph nodes" value={String(health.nodes)} />
        </div>
        {hazards.map((h) => (
          <div key={h.id} className="flex gap-3 rounded-lg bg-hazard-dim p-3">
            <Siren className="mt-0.5 size-4 shrink-0 text-hazard" />
            <div>
              <p className="text-sm text-fg">{h.description}</p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {h.id} · observed {h.observedAt} · zones {h.zones.map((z) => z.name).join(", ")}
              </p>
            </div>
          </div>
        ))}
      </Panel>

      <Panel kicker="Database" title="Graph readiness">
        <p className="font-mono text-sm text-cyan">{health.graph}</p>
        <p className="mt-2 text-sm text-muted">
          {health.relationships} relationships · {health.labels.Fact} facts · {health.labels.Episode} episodes
        </p>
        <Badge tone="ok" className="mt-4">
          Kernel ready
        </Badge>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Intelligence is a typed traversal over this graph. Removing the graph removes the recommendation.
        </p>
      </Panel>

      <Panel kicker="Capacity" title="Shelters at reference time" className="lg:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="pb-2 font-medium">Shelter</th>
                <th className="pb-2 font-medium">Zone</th>
                <th className="pb-2 font-medium">Open</th>
                <th className="pb-2 font-medium">Access</th>
                <th className="pb-2 font-medium">Services</th>
              </tr>
            </thead>
            <tbody>
              {shelters.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="py-2.5">
                    <p>{s.name}</p>
                    <p className="font-mono text-[11px] text-muted">{s.id}</p>
                  </td>
                  <td className="py-2.5 text-muted">{s.zoneName}</td>
                  <td className="py-2.5 font-mono tabular-nums">{s.available}</td>
                  <td className="py-2.5">{s.accessible ? <span className="text-ok">step-free</span> : <span className="text-hazard">stairs</span>}</td>
                  <td className="py-2.5 text-muted">{s.services.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel kicker="Unresolved work" title="Open loops">
        <ul className="space-y-3">
          {loops.map((o) => (
            <li key={o.id}>
              <p className="text-sm text-fg">{o.title}</p>
              <p className="font-mono text-[11px] text-muted">
                {o.id} · {o.status}
                {o.ownerName ? ` · owner ${o.ownerName}` : " · no owner"}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function TemporalPanel({ flags }: { flags: DemoFlags }) {
  const graph = useMemo(() => buildWorld(flags), [flags]);
  const thenFacts = reconstructFacts(graph, T14);
  const nowFacts = reconstructFacts(graph, flags.referenceTime);
  const chain = supersessionChain(graph, flags.referenceTime);
  const keyPreds = ["available_cots", "status", "accessible"];

  const pick = (list: typeof thenFacts, subject: string, pred: string) =>
    list.find((f) => f.subjectId === subject && f.predicate === pred);

  const rows = [
    { subject: "shelter_riverside", pred: "available_cots", label: "Riverside High cots" },
    { subject: "road_west_connector", pred: "status", label: "West Connector" },
    { subject: "shelter_civic", pred: "available_cots", label: "Civic Arena cots" },
    { subject: "road_north_civic", pred: "status", label: "North Civic" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel kicker="What changed since the last watch?" title="14:00 versus reference time">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="pb-2 font-medium">Fact</th>
                <th className="pb-2 font-medium">14:00</th>
                <th className="pb-2 font-medium">Now</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const a = pick(thenFacts, row.subject, row.pred);
                const b = pick(nowFacts, row.subject, row.pred);
                const changed = a?.objectValue !== b?.objectValue;
                return (
                  <tr key={row.subject + row.pred} className="border-t border-line">
                    <td className="py-3">
                      <p>{row.label}</p>
                      <p className="font-mono text-[11px] text-muted">{row.subject}</p>
                    </td>
                    <td className="py-3 font-mono tabular-nums text-muted">{a?.objectValue ?? "—"}</td>
                    <td className={cn("py-3 font-mono tabular-nums", changed ? "text-amber" : "text-fg")}>
                      {b?.objectValue ?? "—"}
                      {changed ? <Badge tone="amber" className="ml-2">changed</Badge> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel kicker="SUPERSEDES" title="History was not overwritten">
        {chain.length === 0 ? (
          <p className="text-sm text-muted">No supersession yet. Inject the 16:30 change to close the 14:00 facts and attach replacements.</p>
        ) : (
          <ul className="space-y-3">
            {chain.map((c) => (
              <li key={c.currentFactId} className="rounded-lg bg-inset p-3">
                <p className="text-sm text-fg">
                  {c.predicate} on <span className="font-mono text-cyan">{c.subjectId}</span>
                </p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {c.previousValue} ({c.previousFactId}) → {c.currentValue} ({c.currentFactId})
                </p>
                <Badge tone="amber" className="mt-2">
                  superseded
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel kicker="Point-in-time" title="Facts true at 14:00" className="lg:col-span-1">
        <ul className="max-h-72 space-y-2 overflow-auto pr-1">
          {thenFacts
            .filter((f) => keyPreds.includes(f.predicate))
            .map((f) => (
              <li key={f.id} className="font-mono text-xs text-muted">
                <span className="text-fg">{f.subjectId}</span> {f.predicate}={f.objectValue}
              </li>
            ))}
        </ul>
      </Panel>

      <Panel kicker="Point-in-time" title={`Facts true at ${flags.referenceTime.slice(11, 16)}Z`}>
        <ul className="max-h-72 space-y-2 overflow-auto pr-1">
          {nowFacts
            .filter((f) => keyPreds.includes(f.predicate))
            .map((f) => (
              <li key={f.id} className="font-mono text-xs text-muted">
                <span className="text-fg">{f.subjectId}</span> {f.predicate}={f.objectValue}{" "}
                <span className="text-subtle">{f.status}</span>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}

export function HandoffPanel({ flags }: { flags: DemoFlags }) {
  const graph = useMemo(() => buildWorld(flags), [flags]);
  const ctx = handoffContext(graph, "handoff_1755");
  const failed = failedAttemptsFor(graph);
  const unowned = unownedOpenLoops(graph);
  const thenFacts = reconstructFacts(graph, T14);
  const nowFacts = reconstructFacts(graph, flags.referenceTime);
  const acceptIncoming = useDemo((s) => s.acceptIncoming);
  const killOutgoingWatch = useDemo((s) => s.killOutgoingWatch);
  const assignLoopToIncoming = useDemo((s) => s.assignLoopToIncoming);
  const proposal = useDemo((s) => s.proposal);
  const [brief, setBrief] = useState<string | null>(null);
  const [briefing, setBriefing] = useState(false);

  async function runBrief() {
    setBriefing(true);
    try {
      const res = await briefIncomingWatch({
        data: {
          thenFacts: thenFacts.map((f) => `${f.subjectId} ${f.predicate}=${f.objectValue}`).join("; "),
          nowFacts: nowFacts.map((f) => `${f.subjectId} ${f.predicate}=${f.objectValue}`).join("; "),
          failed: failed.map((f) => `${f.targetId}: ${f.reason}`).join("; "),
          loops: unowned.map((l) => `${l.id} ${l.title} ${l.status}`).join("; "),
          plan: proposal ? `${proposal.status} ${proposal.action}` : "no proposal yet",
        },
      });
      setBrief(res.text);
    } catch {
      setBrief("Brief unavailable. Use the graph panels — they are authoritative.");
    } finally {
      setBriefing(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel kicker="Agent handoff" title="Outgoing → Incoming">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone={flags.outgoingKilled ? "hazard" : "cyan"}>{flags.outgoingKilled ? "outgoing offline" : "outgoing active"}</Badge>
          <Badge tone={flags.handoffAccepted ? "ok" : "amber"}>{ctx?.status ?? "pending"}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-fg">{ctx?.summary}</p>
        <p className="mt-2 font-mono text-[11px] text-muted">
          {ctx?.fromAgentId} → {ctx?.toAgentId} · {ctx?.referenceTime}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={acceptIncoming}>
            Accept handoff
          </Button>
          <Button size="sm" onClick={killOutgoingWatch}>
            Kill outgoing watch
          </Button>
          <Button size="sm" variant="amber" onClick={assignLoopToIncoming}>
            Assign unowned loop
          </Button>
        </div>
      </Panel>

      <Panel kicker="Memory Fortress" title="Stationed Soldiers: Failed Attempts">
        <ul className="space-y-3">
          {failed.map((f) => (
            <li key={f.id} className="flex gap-3">
              <Ban className="mt-0.5 size-4 shrink-0 text-hazard" />
              <div>
                <p className="text-sm text-fg">{f.reason}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {f.id} · {f.actionKind} · {f.targetId}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel kicker="Memory Fortress" title="Patrol for Forgotten Soldiers (Open Loops)">
        {unowned.length ? (
          <p className="mb-3 text-sm text-amber">At least one loop has no owner.</p>
        ) : (
          <p className="mb-3 text-sm text-ok">All transferred loops have an owner.</p>
        )}
        <ul className="space-y-2">
          {ctx?.loops.map((l) => (
            <li key={l.id} className="font-mono text-xs text-muted">
              <span className="text-fg">{l.title}</span> · {l.status} · {l.ownerId ?? "unowned"}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel kicker="Optional narrative" title="Incoming watch brief">
        <p className="mb-3 text-sm text-muted">
          Graph facts stay authoritative. This brief is a grounded summary of the packet, not a source of operational truth.
        </p>
        <Button size="sm" variant="secondary" onClick={runBrief} disabled={briefing}>
          {briefing ? "Briefing…" : "Brief incoming watch"}
        </Button>
        {brief ? <p className="mt-3 text-sm leading-relaxed text-fg">{brief}</p> : null}
      </Panel>
    </div>
  );
}

export function PlanPanel({ flags }: { flags: DemoFlags }) {
  const graph = useMemo(() => buildWorld(flags), [flags]);
  const ranked = rankTable(graph, "hazard_river_rise", flags.referenceTime);
  const proposal = useDemo((s) => s.proposal);
  const runPlanner = useDemo((s) => s.runPlanner);

  return (
    <div className="grid gap-4">
      <Panel kicker="Planner" title="Which shelter can receive West Basin households?">
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted">
          The planner does not generate a plan from a document. It ranks OPEN shelters by a multi-hop path: hazard → zone → need → shelter → CONNECTED_BY route → HAS_AUTHORITY → asset, then drops failed attempts.
        </p>
        <Button variant="primary" onClick={runPlanner}>
          Patrol the Fortress & Run Planner
        </Button>
        {proposal ? (
          <div className="mt-5 rounded-lg bg-inset p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone={proposal.status === "PROPOSED" ? "cyan" : proposal.status === "BLOCKED" ? "hazard" : "amber"}>
                {proposal.status}
              </Badge>
              <Badge tone="mute">confidence {proposal.confidence.toFixed(2)}</Badge>
              <Badge tone="amber">needs human approval</Badge>
            </div>
            <p className="text-base text-fg">{proposal.action}</p>
            <p className="mt-2 text-sm text-muted">{proposal.planner_notes}</p>
            {proposal.blocking_reasons.length ? (
              <ul className="mt-3 space-y-1">
                {proposal.blocking_reasons.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-amber">
                    <AlertTriangle className="size-4 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </Panel>

      <Panel kicker="Evidence path" title="Hazard to shelter to source">
        <EvidencePath nodes={proposal?.graph_path ?? []} />
      </Panel>

      <Panel kicker="Ranking" title="Candidates from the graph">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="pb-2 font-medium">Shelter</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2 font-medium">Open</th>
                <th className="pb-2 font-medium">Route</th>
                <th className="pb-2 font-medium">Authority</th>
                <th className="pb-2 font-medium">Blockers</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c) => (
                <tr key={c.shelterId} className="border-t border-line">
                  <td className="py-2.5">
                    <p>{c.shelterName}</p>
                    <p className="font-mono text-[11px] text-muted">{c.shelterId}</p>
                  </td>
                  <td className="py-2.5 font-mono tabular-nums text-cyan">{c.planScore.toFixed(2)}</td>
                  <td className="py-2.5 font-mono tabular-nums">{c.availableSpaces}</td>
                  <td className="py-2.5">{c.routeOpen ? <span className="text-ok">open {c.routeMinutes}m</span> : <span className="text-hazard">closed</span>}</td>
                  <td className="py-2.5">{c.destinationAuthority ? <span className="text-ok">yes</span> : <span className="text-amber">missing</span>}</td>
                  <td className="py-2.5 text-muted">{c.blockingReasons[0] ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

export function ReviewPanel({ flags }: { flags: DemoFlags }) {
  const review = useDemo((s) => s.review);
  const proposal = useDemo((s) => s.proposal);
  const status = useDemo((s) => s.decisionStatus);
  const confirmAuthority = useDemo((s) => s.confirmAuthority);
  const sendToHuman = useDemo((s) => s.sendToHuman);
  const approve = useDemo((s) => s.approve);
  const reject = useDemo((s) => s.reject);
  const closeOutcome = useDemo((s) => s.closeOutcome);
  const outcomeRecorded = useDemo((s) => s.outcomeRecorded);
  const parksAuthority = flags.parksAuthority;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ready = review?.review_state === "READY_FOR_HUMAN_REVIEW";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel kicker="Reviewer" title="Constraint checks">
        {!review ? (
          <p className="text-sm text-muted">Run the planner first. The reviewer only scores a graph-backed proposal.</p>
        ) : (
          <>
            <Badge tone={ready ? "ok" : "hazard"}>{review.review_state}</Badge>
            <ul className="mt-4 space-y-2">
              {review.checks.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="mt-0.5 size-4 text-ok" /> : <AlertTriangle className="mt-0.5 size-4 text-amber" />}
                  <span>
                    <span className="text-fg">{c.id}</span>
                    <span className="text-muted"> — {c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <Panel kicker="Human review" title="Duty officer controls">
        <p className="mb-4 text-sm text-muted">
          AI may propose. Only a human writes APPROVED. This product does not dispatch vehicles or issue evacuation orders.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="amber" onClick={confirmAuthority} disabled={parksAuthority}>
            {parksAuthority ? "Authority confirmed" : "Confirm Parks authority"}
          </Button>
          <Button size="sm" onClick={sendToHuman} disabled={!ready}>
            Send to human review
          </Button>
          <Button size="sm" variant="ok" onClick={() => setConfirmOpen(true)} disabled={!ready || status === "APPROVED"}>
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => reject("Duty officer rejected pending more evidence")} disabled={status === "APPROVED"}>
            Reject
          </Button>
        </div>
        {status !== "NONE" ? (
          <p className="mt-4 font-mono text-xs text-cyan">
            decision d_incoming_plan · {status}
            {status === "APPROVED" ? " · approved_by human_approver" : ""}
          </p>
        ) : null}
        {status === "APPROVED" && !outcomeRecorded ? (
          <Button className="mt-4" size="sm" onClick={closeOutcome}>
            Record simulation outcome
          </Button>
        ) : null}
        {outcomeRecorded ? (
          <p className="mt-4 text-sm text-ok">Outcome written. Open loop closed. Simulation only.</p>
        ) : null}

        {confirmOpen ? (
          <div className="mt-4 rounded-lg bg-inset p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="text-sm text-fg">Approve transferring West Basin households to {proposal?.shelter_name ?? "the proposed shelter"} in simulation?</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ok" onClick={() => { approve(); setConfirmOpen(false); }}>
                Confirm approval
              </Button>
              <Button size="sm" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel kicker="Assumptions" title="What the planner is betting on" className="lg:col-span-2">
        <ul className="grid gap-2 sm:grid-cols-2">
          {(proposal?.assumptions ?? []).map((a) => (
            <li key={a} className="rounded-md bg-inset px-3 py-2 text-sm text-muted">
              {a}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function GraphPanel({ flags }: { flags: DemoFlags }) {
  const graph = useMemo(() => buildWorld(flags), [flags]);
  const proposal = useDemo((s) => s.proposal);
  const health = graphHealth(graph);
  const episodes = episodesSince(graph, "2026-10-15T13:00:00Z");
  const ds = decisions(graph);

  return (
    <div className="grid gap-4">
      <Panel kicker="Graph explorer" title="Selected decision path">
        <PathCanvas nodes={proposal?.graph_path ?? []} />
        <p className="mt-3 font-mono text-[11px] text-muted">
          {health.graph} · {health.nodes} nodes · {health.relationships} edges
        </p>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel kicker="Episodes" title="Watch memory">
          <ul className="space-y-3">
            {episodes.map((e) => (
              <li key={e.id}>
                <p className="text-sm text-fg">{e.text}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {e.kind} · {e.occurredAt} · {e.author}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel kicker="Decisions" title="Audit trail">
          <ul className="space-y-3">
            {ds.map((d) => (
              <li key={d.id} className="rounded-md bg-inset p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={d.status === "APPROVED" ? "ok" : d.status === "REJECTED" ? "hazard" : "amber"}>{d.status}</Badge>
                  <span className="font-mono text-[11px] text-muted">{d.id}</span>
                </div>
                <p className="mt-2 text-sm text-fg">{d.rationale}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

export function QueryPanel() {
  const entries = [
    { id: "factsAtTime", title: "Facts true at a reference time", cypher: CYPHER.factsAtTime },
    { id: "candidatePlan", title: "Candidate plan traversal", cypher: CYPHER.candidatePlan },
    { id: "supersession", title: "Supersession chain", cypher: CYPHER.supersession },
    { id: "unownedLoops", title: "Unowned open loops", cypher: CYPHER.unownedLoops },
    { id: "failedAttempts", title: "Failed attempts", cypher: CYPHER.failedAttempts },
    { id: "handoff", title: "Handoff context", cypher: CYPHER.handoff },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {entries.map((e) => (
        <Panel key={e.id} kicker={e.id} title={e.title}>
          <pre className="overflow-x-auto rounded-lg bg-inset p-3 font-mono text-[11px] leading-relaxed text-cyan">
            {e.cypher}
          </pre>
        </Panel>
      ))}
    </div>
  );
}

export const VIEW_META = [
  { id: "overview" as const, label: "Overview", icon: Radio },
  { id: "temporal" as const, label: "What changed", icon: CircleDot },
  { id: "handoff" as const, label: "Handoff", icon: Waypoints },
  { id: "plan" as const, label: "Planner", icon: ShieldCheck },
  { id: "review" as const, label: "Human review", icon: Lock },
  { id: "graph" as const, label: "Graph", icon: Siren },
  { id: "queries" as const, label: "Cypher", icon: CheckCircle2 },
];
