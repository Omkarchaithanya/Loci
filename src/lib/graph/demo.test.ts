import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWorld, INITIAL_FLAGS, planNow, reviewNow, T14, T1630, T18 } from "../demo/world.ts";
import { reconstructFacts, unownedOpenLoops, failedAttemptsFor, supersessionChain, candidatePlans } from "./queries.ts";
import { seedBaseline } from "./seed.ts";

describe("WatchChange Mesh winning demo", () => {
  it("seeds a connected operational graph", () => {
    const g = seedBaseline();
    assert.ok(g.nodeCount() > 40);
    assert.ok(g.get("shelter_riverside"));
    assert.equal(g.get("road_west_connector")?.props.status, "OPEN");
  });

  it("selects Riverside High at 14:00 via multi-hop traversal", () => {
    const plan = planNow({ ...INITIAL_FLAGS, referenceTime: T14 });
    assert.equal(plan.shelter_id, "shelter_riverside");
    assert.equal(plan.status, "PROPOSED");
    assert.ok(plan.graph_path.some((n) => n.id === "hazard_river_rise"));
    assert.ok(plan.graph_path.some((n) => n.id === "shelter_riverside"));
    assert.ok(plan.evidence_ids.length > 0);
    assert.equal(plan.requires_human_approval, true);
  });

  it("does not treat North School as feasible because of the failed attempt", () => {
    const g = seedBaseline();
    const ranked = candidatePlans(g, "hazard_river_rise", T14);
    const north = ranked.find((c) => c.shelterId === "shelter_north_school");
    assert.ok(north);
    assert.ok(north.failedAttempt);
    assert.ok(north.blockingReasons.length > 0);
  });

  it("keeps 14:00 capacity queryable after the 16:30 supersession", () => {
    const g = buildWorld({ ...INITIAL_FLAGS, injectedChange: true, referenceTime: T18 });
    const at14 = reconstructFacts(g, T14);
    const cots14 = at14.find((f) => f.subjectId === "shelter_riverside" && f.predicate === "available_cots");
    assert.equal(cots14?.objectValue, "42");

    const at18 = reconstructFacts(g, T18);
    const cots18 = at18.find((f) => f.subjectId === "shelter_riverside" && f.predicate === "available_cots");
    assert.equal(cots18?.objectValue, "8");

    const chain = supersessionChain(g, T18);
    assert.ok(chain.some((c) => c.previousValue === "42" && c.currentValue === "8"));
    assert.ok(chain.some((c) => c.previousValue === "OPEN" && c.currentValue === "CLOSED"));
  });

  it("pivots to Civic Arena at 18:00 after the route closure", () => {
    const flags = { ...INITIAL_FLAGS, injectedChange: true, referenceTime: T18, parksAuthority: true };
    const plan = planNow(flags);
    assert.equal(plan.shelter_id, "shelter_civic");
    assert.equal(plan.status, "PROPOSED");
    assert.ok(plan.route_road_ids.includes("road_north_civic"));
    assert.ok(!plan.blocking_reasons.length);
  });

  it("blocks Civic Arena until Parks authority is confirmed", () => {
    const flags = { ...INITIAL_FLAGS, injectedChange: true, referenceTime: T18, parksAuthority: false };
    const plan = planNow(flags);
    assert.equal(plan.shelter_id, "shelter_civic");
    assert.equal(plan.status, "BLOCKED");
    const review = reviewNow(flags, plan);
    assert.equal(review.review_state, "BLOCKED_NO_AUTHORITY");
    assert.notEqual(review.status, "APPROVED");
  });

  it("detects the unowned overflow loop and the North School failure", () => {
    const g = seedBaseline();
    const loops = unownedOpenLoops(g);
    assert.ok(loops.some((l) => l.id === "ol_west_overflow"));
    const failed = failedAttemptsFor(g, "shelter_north_school");
    assert.ok(failed.length >= 1);
  });

  it("never auto-approves a planner proposal", () => {
    const plan = planNow({ ...INITIAL_FLAGS, injectedChange: true, parksAuthority: true, referenceTime: T18 });
    assert.notEqual(plan.status, "APPROVED");
    assert.equal(plan.requires_human_approval, true);
  });

  it("records human approval on the decision node", () => {
    const g = buildWorld({
      ...INITIAL_FLAGS,
      injectedChange: true,
      parksAuthority: true,
      referenceTime: T18,
      proposalWritten: true,
      decisionStatus: "APPROVED",
    });
    const d = g.get("d_incoming_plan");
    assert.equal(d?.props.status, "APPROVED");
    assert.equal(d?.props.approved_by, "human_approver");
  });
});

describe("clock labels", () => {
  it("uses the canonical demo timestamps", () => {
    assert.equal(T14, "2026-10-15T14:00:00Z");
    assert.equal(T1630, "2026-10-15T16:30:00Z");
    assert.equal(T18, "2026-10-15T18:00:00Z");
  });
});
