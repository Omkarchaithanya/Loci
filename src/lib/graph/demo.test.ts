process.env.FALKORDB_GRAPH = "watchchange_test";
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { buildWorld, INITIAL_FLAGS, planNow, reviewNow, T14, T1630, T18 } from "../demo/world.ts";
import { getGraphStore } from "./store.ts";
import { reconstructFacts, unownedOpenLoops, failedAttemptsFor, supersessionChain, candidatePlans } from "./queries.ts";
import { seedBaseline } from "./seed.ts";

describe("WatchChange Mesh winning demo", () => {
  beforeEach(async () => {
    const store = await getGraphStore();
    await store.query("MATCH (n) DETACH DELETE n");
  });
  it("seeds a connected operational graph", async () => {
    const store = await getGraphStore();
    await store.query("MATCH (n) DETACH DELETE n");
    await seedBaseline(store);
    const countRes = await store.query("MATCH (n) RETURN count(n) as count");
    assert.ok(Number(countRes.data[0]["count"]) > 40);
    const shelterRes = await store.query("MATCH (n {id: 'shelter_riverside'}) RETURN n");
    assert.ok(shelterRes.data.length > 0);
    const roadRes = await store.query("MATCH (n {id: 'road_west_connector'}) RETURN n");
    assert.equal(roadRes.data[0].n.properties.status, "OPEN");
  });

  it("selects Riverside High at 14:00 via multi-hop traversal", async () => {
    const plan = await planNow({ ...INITIAL_FLAGS, referenceTime: T14 });
    assert.equal(plan.shelter_id, "shelter_riverside");
    assert.equal(plan.status, "PROPOSED");
    assert.ok(plan.graph_path.some((n: any) => n.id === "hazard_river_rise"));
    assert.ok(plan.graph_path.some((n: any) => n.id === "shelter_riverside"));
    assert.ok(plan.evidence_ids.length > 0);
    assert.equal(plan.requires_human_approval, true);
  });

  it("does not treat North School as feasible because of the failed attempt", async () => {
    const store = await getGraphStore();
    await store.query("MATCH (n) DETACH DELETE n");
    await seedBaseline(store);
    const ranked = await candidatePlans(store, "hazard_river_rise", T14);
    const north = ranked.find((c: any) => c.shelterId === "shelter_north_school");
    assert.ok(north);
    assert.ok(north.blockingReasons.some((r: any) => String(r).includes("failure")));
    assert.ok(north.blockingReasons.length > 0);
  });

  it("keeps 14:00 capacity queryable after the 16:30 supersession", async () => {
    const store = await buildWorld({ ...INITIAL_FLAGS, injectedChange: true, referenceTime: T18 });
    const at14 = await reconstructFacts(store, T14);
    const cots14 = at14.find((f: any) => f.subjectId === "shelter_riverside" && f.predicate === "available_cots");
    assert.equal(cots14?.objectValue, "42");

    const at18 = await reconstructFacts(store, T18);
    const cots18 = at18.find((f: any) => f.subjectId === "shelter_riverside" && f.predicate === "available_cots");
    assert.equal(cots18?.objectValue, "8");

    const chain = await supersessionChain(store, T18);
    assert.ok(chain.some((c: any) => c.oldValue === "42" && c.newValue === "8"));
    assert.ok(chain.some((c: any) => c.oldValue === "OPEN" && c.newValue === "CLOSED"));
  });

  it("pivots to Civic Arena at 18:00 after the route closure", async () => {
    const flags = { ...INITIAL_FLAGS, injectedChange: true, referenceTime: T18, parksAuthority: true };
    const plan = await planNow(flags);
    assert.equal(plan.shelter_id, "shelter_civic");
    assert.equal(plan.status, "PROPOSED");
    assert.ok(plan.route_road_ids.includes("road_north_civic"));
    assert.ok(!plan.blocking_reasons.length);
  });

  it("blocks Civic Arena until Parks authority is confirmed", async () => {
    const flags = { ...INITIAL_FLAGS, injectedChange: true, referenceTime: T18, parksAuthority: false };
    const plan = await planNow(flags);
    assert.equal(plan.shelter_id, "shelter_civic");
    assert.equal(plan.status, "BLOCKED");
    const review = await reviewNow(flags, plan);
    assert.equal(review.review_state, "BLOCKED_NO_AUTHORITY");
    assert.notEqual(review.status, "APPROVED");
  });

  it("detects the unowned overflow loop and the North School failure", async () => {
    const store = await getGraphStore();
    await store.query("MATCH (n) DETACH DELETE n");
    await seedBaseline(store);
    const loops = await unownedOpenLoops(store);
    assert.ok(loops.some((l: any) => l.id === "ol_west_overflow"));
    const failed = await failedAttemptsFor(store, "shelter_north_school");
    assert.ok(failed.length >= 1);
  });

  it("never auto-approves a planner proposal", async () => {
    const plan = await planNow({ ...INITIAL_FLAGS, injectedChange: true, parksAuthority: true, referenceTime: T18 });
    assert.notEqual(plan.status, "APPROVED");
    assert.equal(plan.requires_human_approval, true);
  });

  it("records human approval on the decision node", async () => {
    const store = await buildWorld({
      ...INITIAL_FLAGS,
      injectedChange: true,
      parksAuthority: true,
      referenceTime: T18,
      proposalWritten: true,
      decisionStatus: "APPROVED",
    });
    const dRes = await store.query("MATCH (d {id: 'd_incoming_plan'}) RETURN d");
    const d = dRes.data[0]?.d;
    assert.equal(d?.properties.status, "APPROVED");
    assert.equal(d?.properties.approved_by, "human_approver");
  });
});

describe("clock labels", () => {
  it("uses the canonical demo timestamps", () => {
    assert.equal(T14, "2026-10-15T14:00:00Z");
    assert.equal(T1630, "2026-10-15T16:30:00Z");
    assert.equal(T18, "2026-10-15T18:00:00Z");
  });
});
