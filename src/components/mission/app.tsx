import { useMemo, useEffect, useState } from "react";
import { Mark } from "@/components/mission/logo";
import {
  GraphPanel,
  HandoffPanel,
  OverviewPanel,
  PlanPanel,
  QueryPanel,
  ReviewPanel,
  TemporalPanel,
  VIEW_META,
} from "@/components/mission/panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DemoFlags } from "@/lib/demo/world.ts";
import { T14, T1630, T18, useDemo } from "@/lib/demo/store.ts";
import { cn } from "@/lib/utils";

function clockLabel(iso: string) {
  return iso.slice(11, 16) + "Z";
}

function FalkorBadge({ onStatusChange }: { onStatusChange: (status: any) => void }) {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        if (mounted) {
          setHealth(data);
          onStatusChange(data);
        }
      } catch (e) {
        if (mounted) {
          setHealth({ ok: false, error: "NOT_CONNECTED" });
          onStatusChange({ ok: false, error: "NOT_CONNECTED" });
        }
      }
    };
    fetchHealth();
    const int = setInterval(fetchHealth, 5000);
    return () => { mounted = false; clearInterval(int); };
  }, [onStatusChange]);

  if (!health) return <Badge tone="mute">Connecting to FalkorDB...</Badge>;
  if (!health.ok) return <Badge tone="hazard">FalkorDB Disconnected</Badge>;
  
  const host = "FalkorDB Cloud"; // Hardcoded for this badge or we can deduce if it's localhost
  const latency = health.latencyMs ? health.latencyMs.toFixed(1) : "0.0";
  return <Badge tone="ok">Connected to {host} · graph: {health.graph} · {health.nodes.toLocaleString()} nodes · {latency}ms</Badge>;
}

export function MissionApp() {
  const view = useDemo((s) => s.view);
  const setView = useDemo((s) => s.setView);
  const referenceTime = useDemo((s) => s.referenceTime);
  const injectedChange = useDemo((s) => s.injectedChange);
  const handoffAccepted = useDemo((s) => s.handoffAccepted);
  const outgoingKilled = useDemo((s) => s.outgoingKilled);
  const loopOwner = useDemo((s) => s.loopOwner);
  const parksAuthority = useDemo((s) => s.parksAuthority);
  const proposalWritten = useDemo((s) => s.proposalWritten);
  const decisionStatus = useDemo((s) => s.decisionStatus);
  const rejectionReason = useDemo((s) => s.rejectionReason);
  const outcomeRecorded = useDemo((s) => s.outcomeRecorded);
  const lastEvent = useDemo((s) => s.lastEvent);
  const goBaseline = useDemo((s) => s.goBaseline);
  const injectChange = useDemo((s) => s.injectChange);
  const goIncoming = useDemo((s) => s.goIncoming);
  const runPlanner = useDemo((s) => s.runPlanner);
  const confirmAuthority = useDemo((s) => s.confirmAuthority);
  const reset = useDemo((s) => s.reset);

  const flags: DemoFlags = useMemo(
    () => ({
      referenceTime,
      injectedChange,
      handoffAccepted,
      outgoingKilled,
      loopOwner,
      parksAuthority,
      proposalWritten,
      decisionStatus,
      rejectionReason,
      outcomeRecorded,
    }),
    [
      referenceTime,
      injectedChange,
      handoffAccepted,
      outgoingKilled,
      loopOwner,
      parksAuthority,
      proposalWritten,
      decisionStatus,
      rejectionReason,
      outcomeRecorded,
    ],
  );

  const steps = [
    { id: "t14", label: "14:00 baseline", done: true, active: !injectedChange && referenceTime === T14, run: goBaseline },
    { id: "t1630", label: "Inject 16:30", done: injectedChange, active: injectedChange && referenceTime === T1630, run: injectChange },
    { id: "t18", label: "18:00 incoming", done: referenceTime >= T18, active: referenceTime >= T18 && !proposalWritten, run: goIncoming },
    { id: "plan", label: "Run planner", done: proposalWritten, active: proposalWritten && decisionStatus === "PROPOSED", run: runPlanner },
    { id: "auth", label: "Confirm authority", done: parksAuthority, active: proposalWritten && !parksAuthority, run: confirmAuthority },
    { id: "ok", label: "Human approval", done: decisionStatus === "APPROVED", active: parksAuthority && decisionStatus !== "APPROVED", run: () => setView("review") },
  ];

  const [healthStatus, setHealthStatus] = useState<any>(null);

  if (healthStatus && !healthStatus.ok && healthStatus.error === "NOT_CONNECTED") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg text-fg">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-xl max-w-md text-center">
          <Mark className="size-12 mx-auto mb-4" />
          <h2 className="mb-2 text-xl font-medium text-hazard">Not connected to FalkorDB</h2>
          <p className="text-sm text-muted">
            The demo server cannot reach the graph database. Please check your <code>FALKORDB_URL</code> environment variable or ensure the FalkorDB container is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-cyan focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <Mark className="size-10 shrink-0 rounded-lg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan">Loci</p>
              <h1 className="text-lg font-medium tracking-tight">Cedar County flood watch</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">Synthetic demo</Badge>
            <Badge tone="cyan">graph {clockLabel(referenceTime)}</Badge>
            <Badge tone={outgoingKilled ? "hazard" : "ok"}>{outgoingKilled ? "outgoing offline" : "watch live"}</Badge>
            <FalkorBadge onStatusChange={setHealthStatus} />
          </div>
        </div>
        <p className="mx-auto max-w-[1440px] px-4 pb-3 font-mono text-[11px] text-muted md:px-6">{lastEvent}</p>
      </header>

      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 py-3 md:px-6">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={s.run}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-left text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
                s.active ? "bg-cyan-dim text-cyan" : s.done ? "bg-ok-dim text-ok" : "bg-inset text-muted",
              )}
            >
              <span className="font-mono tabular-nums">{i + 1}</span>
              {s.label}
            </button>
          ))}
          <Button size="sm" className="ml-auto shrink-0" onClick={reset}>
            Reset demo
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
        <nav aria-label="Views" className="flex gap-1 overflow-x-auto border-b border-line p-3 lg:w-52 lg:flex-col lg:border-b-0 lg:border-r lg:py-5">
          {VIEW_META.map((v) => {
            const Icon = v.icon;
            const on = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm",
                  on ? "bg-elevated text-cyan" : "text-muted hover:bg-elevated hover:text-fg",
                )}
              >
                <Icon className="size-4" />
                {v.label}
              </button>
            );
          })}
        </nav>

        <main id="main" className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6">
          {view === "overview" ? <OverviewPanel flags={flags} /> : null}
          {view === "temporal" ? <TemporalPanel flags={flags} /> : null}
          {view === "handoff" ? <HandoffPanel flags={flags} /> : null}
          {view === "plan" ? <PlanPanel flags={flags} /> : null}
          {view === "review" ? <ReviewPanel flags={flags} /> : null}
          {view === "graph" ? <GraphPanel flags={flags} /> : null}
          {view === "queries" ? <QueryPanel /> : null}
        </main>
      </div>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-subtle md:px-6">
        Decision support only. Synthetic households. No live emergency dispatch.
      </footer>
    </div>
  );
}
