import { useQuery } from "@tanstack/react-query";
import { useDemo } from "@/lib/demo/store";
import { getPanelData } from "@/lib/demo/server-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EvidencePath, PathCanvas } from "@/components/mission/graph-viz";

export function MissionApp() {
  const flags = useDemo((s) => ({
    referenceTime: s.referenceTime,
    injectedChange: s.injectedChange,
    handoffAccepted: s.handoffAccepted,
    outgoingKilled: s.outgoingKilled,
    loopOwner: s.loopOwner,
    parksAuthority: s.parksAuthority,
    proposalWritten: s.proposalWritten,
    decisionStatus: s.decisionStatus,
    rejectionReason: s.rejectionReason,
    outcomeRecorded: s.outcomeRecorded,
  }));

  const goBaseline = useDemo((s) => s.goBaseline);
  const injectChange = useDemo((s) => s.injectChange);
  const goIncoming = useDemo((s) => s.goIncoming);
  const runPlanner = useDemo((s) => s.runPlanner);
  const confirmAuthority = useDemo((s) => s.confirmAuthority);
  const approve = useDemo((s) => s.approve);
  const reject = useDemo((s) => s.reject);
  const proposal = useDemo((s) => s.proposal);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["panelData", flags],
    queryFn: () => getPanelData({ data: flags }),
  });

  const runAndRefetch = (fn: (arg?: any) => Promise<void>) => async (arg?: any) => {
    await fn(arg);
    refetch();
  };

  const currentShelter = data?.ranked[0];
  
  const getFact = (facts: any[] | undefined, subjectId: string, predicate: string) => {
    return facts?.find((f) => f.subjectId === subjectId && f.predicate === predicate)?.objectValue ?? "N/A";
  };
  
  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <header className="border-b border-border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">WatchChange Mesh</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">This helps a flood watch decide where people can go. It remembers what was true earlier, and it will not approve a move by itself.</p>
        </div>
        <div>
          {isLoading ? <Badge tone="mute">Querying FalkorDB...</Badge> : error ? <Badge tone="hazard">Not connected to the database</Badge> : data ? (
            <Badge tone="ok">{data.health.graph} · {data.health.nodes} nodes · {data.health.latencyMs}ms</Badge>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="p-8 text-center text-hazard text-lg font-medium">Not connected to the database</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          <aside className="lg:col-span-1 space-y-2">
            <StepButton active={!flags.injectedChange} onClick={runAndRefetch(goBaseline)} label="1. 2:00 PM — situation" desc="West Basin is flooding. Riverside High has room. The west road is open." />
            <StepButton active={flags.injectedChange && !flags.handoffAccepted} onClick={runAndRefetch(injectChange)} label="2. 4:30 PM — something changed" desc="The west road closed. Riverside High dropped from 42 beds to 8. The 2:00 PM facts are still stored." />
            <StepButton active={flags.handoffAccepted && !flags.proposalWritten} onClick={runAndRefetch(goIncoming)} label="3. 6:00 PM — shift change" desc="The first operator is offline. The next operator can still see the unfinished job and the shelter that already failed." />
            <StepButton active={flags.proposalWritten && !flags.parksAuthority} onClick={runAndRefetch(runPlanner)} label="4. Recommendation" desc="Send people to Civic Arena by the north road. Riverside High is unsafe. North School already failed." />
            <StepButton active={flags.parksAuthority && flags.decisionStatus !== "APPROVED" && flags.decisionStatus !== "REJECTED"} onClick={runAndRefetch(confirmAuthority)} label="5. Who is in charge" desc="Civic Arena stays blocked until someone confirms Parks is allowed to run it." />
            <StepButton active={flags.decisionStatus === "APPROVED" || flags.decisionStatus === "REJECTED"} onClick={() => {}} label="6. Human decision" desc="A person approves or rejects. The choice is saved in the database." />
          </aside>
          
          <main className="lg:col-span-2 space-y-6">
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Recommendation Card</h2>
              {!flags.proposalWritten ? (
                <p className="text-muted">No recommendation yet. Apply the 4:30 PM change, then ask for a recommendation.</p>
              ) : (
                <div className="space-y-6">
                  {currentShelter ? (
                    <div>
                      <div className="bg-inset rounded-lg p-4 border border-border">
                        <p className="text-sm text-cyan font-mono mb-1 uppercase tracking-wider">Action</p>
                        <p className="text-xl font-medium">{currentShelter.shelterName}</p>
                        <p className="text-sm mt-2 text-muted">Why: This shelter has open routes, sufficient capacity, and appropriate authority confirmed.</p>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">What was rejected:</h4>
                        <ul className="space-y-2">
                          {data?.ranked.slice(1).map(r => (
                            <li key={r.shelterId} className="flex gap-2 text-sm bg-surface p-2 rounded border border-border">
                              <span className="text-hazard line-through decoration-hazard/50">{r.shelterName}</span>
                              <span className="text-muted">— {r.blockingReasons.join(". ")}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mt-6 flex gap-4">
                        <Button 
                          onClick={runAndRefetch(() => approve())} 
                          disabled={flags.decisionStatus === "APPROVED"}
                          variant={flags.decisionStatus === "APPROVED" ? "primary" : "secondary"}
                          className={flags.decisionStatus === "APPROVED" ? "bg-ok text-bg hover:bg-ok/90" : ""}
                        >
                          Approve
                        </Button>
                        <Button 
                          onClick={runAndRefetch(() => reject("Not safe"))} 
                          disabled={flags.decisionStatus === "REJECTED"}
                          variant={flags.decisionStatus === "REJECTED" ? "danger" : "secondary"}
                        >
                          Reject
                        </Button>
                      </div>
                      {flags.decisionStatus === "APPROVED" && <p className="mt-4 text-ok font-semibold">Status: APPROVED</p>}
                      {flags.decisionStatus === "REJECTED" && <p className="mt-4 text-hazard font-semibold">Status: REJECTED</p>}
                    </div>
                  ) : (
                    <p className="text-muted">No valid shelters found.</p>
                  )}
                </div>
              )}
            </section>

            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Why this recommendation</h2>
              {proposal && proposal.graph_path ? (
                 <PathCanvas nodes={proposal.graph_path} />
              ) : (
                <p className="text-muted">Run the planner to materialize an evidence path.</p>
              )}
            </section>

            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Still unfinished</h2>
              {data?.unownedLoops && data.unownedLoops.length > 0 ? (
                <div className="space-y-2 text-sm">
                  <p>Open loop: <span className="font-mono text-cyan">{data.unownedLoops[0].id}</span> ({data.unownedLoops[0].description})</p>
                  <p>Owner: {flags.loopOwner || "Unassigned"}</p>
                  {data.failedAttempts.length > 0 && (
                    <p className="text-amber">North School failure: {data.failedAttempts[0].reason}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted">No unowned open loops.</p>
              )}
            </section>
          </main>

          <aside className="lg:col-span-1 space-y-6">
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Facts that matter</h2>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 text-muted font-mono text-[10px] uppercase tracking-widest border-b border-border pb-2">
                  <div>At 2:00 PM</div>
                  <div>Now</div>
                </div>
                
                <FactRow 
                  label="Riverside Beds" 
                  oldVal={getFact(data?.facts1400, "shelter_riverside", "available_cots")} 
                  newVal={getFact(data?.factsCurrent, "shelter_riverside", "available_cots")} 
                  changed={getFact(data?.facts1400, "shelter_riverside", "available_cots") !== getFact(data?.factsCurrent, "shelter_riverside", "available_cots")} 
                />
                <FactRow 
                  label="West Road" 
                  oldVal={getFact(data?.facts1400, "road_west_connector", "status")} 
                  newVal={getFact(data?.factsCurrent, "road_west_connector", "status")} 
                  changed={getFact(data?.facts1400, "road_west_connector", "status") !== getFact(data?.factsCurrent, "road_west_connector", "status")} 
                />
                <FactRow 
                  label="Civic Arena Beds" 
                  oldVal={getFact(data?.facts1400, "shelter_civic", "available_cots")} 
                  newVal={getFact(data?.factsCurrent, "shelter_civic", "available_cots")} 
                  changed={getFact(data?.facts1400, "shelter_civic", "available_cots") !== getFact(data?.factsCurrent, "shelter_civic", "available_cots")} 
                />
                <FactRow 
                  label="North Road" 
                  oldVal={getFact(data?.facts1400, "road_north_civic", "status")} 
                  newVal={getFact(data?.factsCurrent, "road_north_civic", "status")} 
                  changed={getFact(data?.facts1400, "road_north_civic", "status") !== getFact(data?.factsCurrent, "road_north_civic", "status")} 
                />
              </div>
            </section>

            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Map</h2>
              <svg viewBox="0 0 200 200" className="w-full h-auto bg-inset rounded border border-border">
                {/* Zones */}
                <circle cx="50" cy="150" r="30" fill="var(--color-hazard)" fillOpacity="0.2" stroke="var(--color-hazard)" />
                <text x="50" y="155" fontSize="10" textAnchor="middle" fill="var(--color-fg)">West Basin</text>

                {/* Shelters */}
                <rect x="25" y="40" width="50" height="30" rx="4" fill="var(--color-ok)" fillOpacity="0.2" stroke="var(--color-ok)" />
                <text x="50" y="58" fontSize="10" textAnchor="middle" fill="var(--color-fg)">Riverside High</text>

                <rect x="125" y="40" width="50" height="30" rx="4" fill="var(--color-ok)" fillOpacity="0.2" stroke="var(--color-ok)" />
                <text x="150" y="58" fontSize="10" textAnchor="middle" fill="var(--color-fg)">Civic Arena</text>

                {/* Roads */}
                {/* West Connector */}
                <line x1="50" y1="120" x2="50" y2="70" stroke={isWestClosed ? "var(--color-hazard)" : "var(--color-fg)"} strokeWidth="4" />
                <text x="40" y="95" fontSize="8" transform="rotate(-90 40,95)" fill="var(--color-muted)">West Connector</text>

                {/* North Road */}
                <line x1="80" y1="140" x2="150" y2="70" stroke={flags.proposalWritten && currentShelter?.shelterId === "shelter_civic" ? "var(--color-cyan)" : "var(--color-fg)"} strokeWidth="4" />
                <text x="125" y="115" fontSize="8" transform="rotate(-45 125,115)" fill="var(--color-muted)">North Road</text>
              </svg>
              <div className="mt-3 text-xs text-muted space-y-1">
                 <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-hazard/20 border border-hazard"></span> Flooded Zone</p>
                 <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-ok/20 border border-ok"></span> Shelter</p>
                 <p className="flex items-center gap-2"><span className="w-3 h-1 bg-hazard"></span> Closed Road</p>
                 <p className="flex items-center gap-2"><span className="w-3 h-1 bg-cyan"></span> Recommended Route</p>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function StepButton({ active, onClick, label, desc }: { active: boolean, onClick: () => void, label: string, desc: string }) {
  return (
    <div className={`p-4 rounded-lg border-l-4 cursor-pointer transition-colors ${active ? 'border-primary bg-primary/10 shadow-sm' : 'border-transparent hover:bg-surface/50'}`} onClick={onClick}>
      <h4 className={`font-semibold ${active ? 'text-primary' : 'text-fg'}`}>{label}</h4>
      {active && <p className="text-sm text-muted mt-2 leading-relaxed">{desc}</p>}
    </div>
  );
}

function FactRow({ label, oldVal, newVal, changed }: { label: string, oldVal: string, newVal: string, changed: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-2 py-2 items-center border-b border-border/50 last:border-0 ${changed ? 'bg-amber/5 rounded px-2 -mx-2' : ''}`}>
      <div className="flex flex-col">
        <span className="text-xs text-muted">{label}</span>
        <span className={`${changed ? 'line-through text-muted' : ''}`}>{oldVal}</span>
      </div>
      <div>
        <span className={`font-medium ${changed ? 'text-amber' : ''}`}>{newVal}</span>
        {changed && <span className="ml-2 text-[10px] uppercase text-amber border border-amber/30 px-1 rounded">Changed</span>}
      </div>
    </div>
  );
}
