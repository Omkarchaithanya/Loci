import type { GraphStore } from "./store.ts";
import { supersedeFact } from "./temporal.ts";
import { GRAPH_NAME, T14, T1630, T_HANDOFF } from "./types.ts";

const NOW = T14;

class BatchBuilder {
  public nodeLabels: Record<string, string> = {};
  public nodesByLabel: Record<string, any[]> = {};
  public relsByType: Record<string, any[]> = {};

  addNode(labels: string[], id: string, props: any) {
    const label = labels[0];
    this.nodeLabels[id] = label;
    if (!this.nodesByLabel[label]) this.nodesByLabel[label] = [];
    this.nodesByLabel[label].push({ id, ...props });
  }

  addRel(type: string, from: string, to: string, props: any) {
    if (!this.relsByType[type]) this.relsByType[type] = [];
    this.relsByType[type].push({ from, to, props });
  }
}

function n(g: BatchBuilder, labels: string[], id: string, props: Record<string, string | number | boolean | null | string[]>) {
  g.addNode(labels, id, props);
}

function r(g: BatchBuilder, type: string, from: string, to: string, props: Record<string, string | number | boolean | null | string[]> = {}) {
  g.addRel(type, from, to, props);
}

function fact(
  g: BatchBuilder,
  id: string,
  subject: string,
  predicate: string,
  value: string,
  sourceId: string,
  evidenceId: string,
  quote: string,
  validFrom = T14,
  confidence = 0.93,
) {
  n(g, ["Fact"], id, {
    subject_id: subject,
    predicate,
    object_value: value,
    value_type: "STRING",
    valid_from: validFrom,
    valid_to: null,
    observed_at: validFrom,
    confidence,
    status: "VALID",
    source_id: sourceId,
    created_at: validFrom,
    updated_at: validFrom,
  });
  r(g, "ABOUT", id, subject);
  n(g, ["Evidence"], evidenceId, {
    quote,
    source_span: "radio-log",
    observed_at: validFrom,
    confidence,
    created_at: validFrom,
  });
  r(g, "SUPPORTED_BY", id, evidenceId);
  r(g, "FROM_SOURCE", evidenceId, sourceId);
  r(g, "ABOUT", evidenceId, subject);
}

export async function seedBaseline(store: GraphStore): Promise<void> {
  const g = new BatchBuilder();
  
  

  n(g, ["Tenant"], "tenant_cedar", { name: "Cedar County OEM", created_at: NOW });
  n(g, ["Incident"], "inc_cedar_flood", {
    name: "Cedar River rise — West Basin",
    kind: "flood",
    status: "ACTIVE",
    severity: 4,
    start_at: "2026-10-15T09:40:00Z",
    synthetic: true,
    created_at: NOW,
    updated_at: NOW,
  });
  r(g, "OWNS_INCIDENT", "tenant_cedar", "inc_cedar_flood");

  n(g, ["Watch"], "watch_flood_ops", {
    name: "Flood operations watch",
    reference_time: T14,
    status: "ACTIVE",
    timezone: "UTC",
    created_at: NOW,
    updated_at: NOW,
  });
  r(g, "HAS_WATCH", "inc_cedar_flood", "watch_flood_ops");

  const agents: Array<[string, string, string]> = [
    ["agent_outgoing_watch", "Outgoing Watch", "OUTGOING_WATCH"],
    ["agent_incoming_watch", "Incoming Watch", "INCOMING_WATCH"],
    ["agent_planner", "Planner", "PLANNER"],
    ["agent_reviewer", "Reviewer", "REVIEWER"],
    ["agent_coordinator", "Coordinator", "COORDINATOR"],
    ["agent_ingestor", "Ingestor", "INGESTOR"],
  ];
  for (const [id, name, role] of agents) {
    n(g, ["Agent"], id, { name, role, status: "ACTIVE", model: "graph-native", created_at: NOW });
    r(g, "MEMBER_OF", id, "tenant_cedar");
  }

  n(g, ["Human"], "human_approver", {
    name: "Duty Officer Patel",
    role: "APPROVER",
    agency_id: "agency_oem",
    approval_scope: "SHELTER_TRANSFER",
    created_at: NOW,
  });
  r(g, "MEMBER_OF", "human_approver", "tenant_cedar");

  n(g, ["Session"], "session_outgoing", {
    agent_id: "agent_outgoing_watch",
    watch_id: "watch_flood_ops",
    started_at: "2026-10-15T13:00:00Z",
    status: "ACTIVE",
    last_reference_time: T14,
    created_at: NOW,
  });
  r(g, "HAS_SESSION", "watch_flood_ops", "session_outgoing");
  r(g, "RUN_BY", "session_outgoing", "agent_outgoing_watch");

  n(g, ["Zone"], "zone_west_basin", {
    name: "West Basin",
    zone_type: "floodplain",
    geometry_ref: "cedar:west-basin",
    population_estimate: 1840,
    created_at: NOW,
    updated_at: NOW,
  });
  n(g, ["Zone"], "zone_riverside", {
    name: "Riverside Campus",
    zone_type: "shelter-campus",
    geometry_ref: "cedar:riverside",
    population_estimate: 220,
    created_at: NOW,
    updated_at: NOW,
  });
  n(g, ["Zone"], "zone_civic", {
    name: "Civic District",
    zone_type: "urban",
    geometry_ref: "cedar:civic",
    population_estimate: 3100,
    created_at: NOW,
    updated_at: NOW,
  });
  n(g, ["Zone"], "zone_north_ridge", {
    name: "North Ridge",
    zone_type: "residential",
    geometry_ref: "cedar:north-ridge",
    population_estimate: 960,
    created_at: NOW,
    updated_at: NOW,
  });

  const sites: Array<[string, string, string, number, number]> = [
    ["site_west_neighborhoods", "West Basin neighborhoods", "zone_west_basin", 41.662, -91.598],
    ["site_riverside_high", "Riverside High campus", "zone_riverside", 41.668, -91.572],
    ["site_civic_arena", "Civic Arena loading dock", "zone_civic", 41.676, -91.534],
    ["site_north_school", "North School entrance", "zone_north_ridge", 41.689, -91.581],
    ["site_east_gym", "East Gym lot", "zone_civic", 41.671, -91.528],
  ];
  for (const [id, name, zone, lat, lon] of sites) {
    n(g, ["Site"], id, {
      name,
      site_type: "node",
      address: "Cedar County, IA (synthetic)",
      latitude: lat,
      longitude: lon,
      status: "OPEN",
      created_at: NOW,
      updated_at: NOW,
    });
    r(g, "CONTAINS", zone, id);
  }

  n(g, ["Road"], "road_west_connector", {
    name: "West Connector",
    road_type: "arterial",
    status: "OPEN",
    distance_km: 3.2,
    travel_minutes: 8,
    geometry_ref: "cedar:west-connector",
    created_at: NOW,
    updated_at: NOW,
  });
  n(g, ["Road"], "road_north_civic", {
    name: "North Civic",
    road_type: "arterial",
    status: "OPEN",
    distance_km: 5.4,
    travel_minutes: 14,
    geometry_ref: "cedar:north-civic",
    created_at: NOW,
    updated_at: NOW,
  });
  n(g, ["Road"], "road_ridge", {
    name: "Ridge Road",
    road_type: "collector",
    status: "OPEN",
    distance_km: 4.1,
    travel_minutes: 11,
    geometry_ref: "cedar:ridge",
    created_at: NOW,
    updated_at: NOW,
  });
  n(g, ["Road"], "road_civic_loop", {
    name: "Civic Loop",
    road_type: "local",
    status: "OPEN",
    distance_km: 1.6,
    travel_minutes: 5,
    geometry_ref: "cedar:civic-loop",
    created_at: NOW,
    updated_at: NOW,
  });

  function link(from: string, to: string, roadId: string, dist: number, mins: number) {
    r(g, "CONNECTED_BY", from, to, {
      road_id: roadId,
      distance_km: dist,
      travel_minutes: mins,
      status: "OPEN",
      valid_from: T14,
      valid_to: null,
      source_id: "src_dot_1400",
    });
    r(g, "CONNECTS_TO", roadId, from);
    r(g, "CONNECTS_TO", roadId, to);
  }
  link("site_west_neighborhoods", "site_riverside_high", "road_west_connector", 3.2, 8);
  link("site_west_neighborhoods", "site_civic_arena", "road_north_civic", 5.4, 14);
  link("site_west_neighborhoods", "site_north_school", "road_ridge", 4.1, 11);
  link("site_civic_arena", "site_east_gym", "road_civic_loop", 1.6, 5);

  n(g, ["Hazard"], "hazard_river_rise", {
    kind: "flood",
    severity: 4,
    status: "ACTIVE",
    description: "Cedar River overtopping West Basin levee toe. Water in streets west of Connector.",
    observed_at: "2026-10-15T13:20:00Z",
    valid_from: "2026-10-15T13:20:00Z",
    valid_to: null,
    source_id: "src_nws_river",
    confidence: 0.96,
    synthetic: true,
    created_at: NOW,
  });
  r(g, "HAS_HAZARD", "inc_cedar_flood", "hazard_river_rise");
  r(g, "AFFECTS", "hazard_river_rise", "zone_west_basin", {
    observed_at: "2026-10-15T13:20:00Z",
    source_id: "src_nws_river",
    confidence: 0.96,
  });

  n(g, ["Constraint"], "constraint_step_free", {
    kind: "ACCESSIBILITY",
    expression: "shelter.accessible = true",
    threshold: 1,
    blocking: true,
    valid_from: T14,
    valid_to: null,
    source_id: "src_oem_sop",
    created_at: NOW,
  });
  r(g, "HAS_CONSTRAINT", "zone_west_basin", "constraint_step_free");

  n(g, ["Source"], "src_nws_river", {
    provider: "NWS Advanced Hydrologic Prediction Service (fixture)",
    url: "https://water.noaa.gov/gauges/synthetic-cedar-river",
    source_type: "hydrology",
    retrieved_at: "2026-10-15T13:18:00Z",
    published_at: "2026-10-15T13:15:00Z",
    content_hash: "sha256:nws-cedar-1315",
    license: "US Government public domain (fixture)",
    reliability: 0.96,
    snapshot_path: "fixtures/nws-cedar-river.json",
    created_at: NOW,
  });
  n(g, ["Source"], "src_shelter_radio_1400", {
    provider: "Cedar OEM shelter radio net",
    url: "https://oem.cedar.example/radio/2026-10-15T14:00",
    source_type: "radio-log",
    retrieved_at: T14,
    published_at: T14,
    content_hash: "sha256:radio-1400",
    license: "synthetic demo",
    reliability: 0.92,
    snapshot_path: "fixtures/radio-1400.json",
    created_at: NOW,
  });
  n(g, ["Source"], "src_dot_1400", {
    provider: "County DOT road board",
    url: "https://dot.cedar.example/board/2026-10-15T14:00",
    source_type: "road-status",
    retrieved_at: T14,
    published_at: T14,
    content_hash: "sha256:dot-1400",
    license: "synthetic demo",
    reliability: 0.9,
    snapshot_path: "fixtures/dot-1400.json",
    created_at: NOW,
  });
  n(g, ["Source"], "src_dot_1630", {
    provider: "County DOT road board",
    url: "https://dot.cedar.example/board/2026-10-15T16:30",
    source_type: "road-status",
    retrieved_at: T1630,
    published_at: T1630,
    content_hash: "sha256:dot-1630",
    license: "synthetic demo",
    reliability: 0.94,
    snapshot_path: "fixtures/dot-1630.json",
    created_at: T1630,
  });
  n(g, ["Source"], "src_shelter_radio_1630", {
    provider: "Cedar OEM shelter radio net",
    url: "https://oem.cedar.example/radio/2026-10-15T16:30",
    source_type: "radio-log",
    retrieved_at: T1630,
    published_at: T1630,
    content_hash: "sha256:radio-1630",
    license: "synthetic demo",
    reliability: 0.93,
    snapshot_path: "fixtures/radio-1630.json",
    created_at: T1630,
  });
  n(g, ["Source"], "src_oem_sop", {
    provider: "Cedar OEM accessibility SOP",
    url: "https://oem.cedar.example/sop/accessibility",
    source_type: "procedure",
    retrieved_at: T14,
    published_at: "2025-04-01T00:00:00Z",
    content_hash: "sha256:sop-access",
    license: "synthetic demo",
    reliability: 0.99,
    snapshot_path: "fixtures/sop-access.json",
    created_at: NOW,
  });

  r(g, "SUPPORTS", "src_nws_river", "hazard_river_rise");

  const households: Array<{
    id: string;
    size: number;
    mobility: string;
    vulnerability: string;
    needs: Array<{ id: string; kind: string; qty: number }>;
  }> = [
    { id: "hh_w01", size: 4, mobility: "LIMITED", vulnerability: "MEDICAL", needs: [{ id: "need_w01_s", kind: "SHELTER", qty: 4 }, { id: "need_w01_m", kind: "MEDICAL", qty: 1 }] },
    { id: "hh_w02", size: 3, mobility: "FULL", vulnerability: "FOOD", needs: [{ id: "need_w02_s", kind: "SHELTER", qty: 3 }, { id: "need_w02_f", kind: "FOOD", qty: 3 }] },
    { id: "hh_w03", size: 5, mobility: "FULL", vulnerability: "NONE", needs: [{ id: "need_w03_s", kind: "SHELTER", qty: 5 }] },
    { id: "hh_w04", size: 2, mobility: "LIMITED", vulnerability: "MEDICAL", needs: [{ id: "need_w04_s", kind: "SHELTER", qty: 2 }, { id: "need_w04_m", kind: "MEDICAL", qty: 1 }] },
    { id: "hh_w05", size: 6, mobility: "FULL", vulnerability: "FOOD", needs: [{ id: "need_w05_s", kind: "SHELTER", qty: 6 }, { id: "need_w05_f", kind: "FOOD", qty: 6 }] },
    { id: "hh_w06", size: 4, mobility: "FULL", vulnerability: "NONE", needs: [{ id: "need_w06_s", kind: "SHELTER", qty: 4 }] },
  ];
  for (const h of households) {
    n(g, ["Household"], h.id, {
      size: h.size,
      language: "en",
      mobility: h.mobility,
      vulnerability_class: h.vulnerability,
      privacy_class: "SYNTHETIC",
      synthetic: true,
      created_at: NOW,
    });
    r(g, "LOCATED_IN", h.id, "zone_west_basin", { valid_from: T14 });
    n(g, ["Person"], `${h.id}_head`, {
      household_id: h.id,
      role: "HEAD",
      age_band: "ADULT",
      mobility: h.mobility,
      language: "en",
      vulnerability_class: h.vulnerability,
      privacy_class: "SYNTHETIC",
      synthetic: true,
      created_at: NOW,
    });
    r(g, "MEMBER_OF", `${h.id}_head`, h.id);
    r(g, "LOCATED_IN", `${h.id}_head`, "zone_west_basin");
    for (const need of h.needs) {
      n(g, ["Need"], need.id, {
        kind: need.kind,
        quantity: need.qty,
        priority: h.mobility === "LIMITED" ? 5 : 3,
        status: "OPEN",
        valid_from: T14,
        valid_to: null,
        created_at: NOW,
      });
      r(g, "HAS_NEED", h.id, need.id);
    }
  }

  n(g, ["Shelter"], "shelter_riverside", {
    name: "Riverside High / Shelter A",
    capacity: 60,
    occupied: 18,
    accessible: true,
    services: ["SHELTER", "FOOD"],
    status: "OPEN",
    latitude: 41.668,
    longitude: -91.572,
    created_at: NOW,
    updated_at: NOW,
  });
  r(g, "HAS_SHELTER", "zone_riverside", "shelter_riverside");
  r(g, "LOCATED_IN", "shelter_riverside", "zone_riverside");
  r(g, "STAGED_AT", "shelter_riverside", "site_riverside_high");

  n(g, ["Shelter"], "shelter_civic", {
    name: "Civic Arena",
    capacity: 140,
    occupied: 40,
    accessible: true,
    services: ["SHELTER", "FOOD", "MEDICAL"],
    status: "OPEN",
    latitude: 41.676,
    longitude: -91.534,
    created_at: NOW,
    updated_at: NOW,
  });
  r(g, "HAS_SHELTER", "zone_civic", "shelter_civic");
  r(g, "LOCATED_IN", "shelter_civic", "zone_civic");
  r(g, "STAGED_AT", "shelter_civic", "site_civic_arena");

  n(g, ["Shelter"], "shelter_north_school", {
    name: "North School",
    capacity: 80,
    occupied: 10,
    accessible: false,
    services: ["SHELTER", "FOOD"],
    status: "OPEN",
    latitude: 41.689,
    longitude: -91.581,
    created_at: NOW,
    updated_at: NOW,
  });
  r(g, "HAS_SHELTER", "zone_north_ridge", "shelter_north_school");
  r(g, "LOCATED_IN", "shelter_north_school", "zone_north_ridge");
  r(g, "STAGED_AT", "shelter_north_school", "site_north_school");

  n(g, ["Shelter"], "shelter_east_gym", {
    name: "East Gym",
    capacity: 30,
    occupied: 28,
    accessible: true,
    services: ["SHELTER"],
    status: "OPEN",
    latitude: 41.671,
    longitude: -91.528,
    created_at: NOW,
    updated_at: NOW,
  });
  r(g, "HAS_SHELTER", "zone_civic", "shelter_east_gym");
  r(g, "LOCATED_IN", "shelter_east_gym", "zone_civic");
  r(g, "STAGED_AT", "shelter_east_gym", "site_east_gym");

  n(g, ["Agency"], "agency_transit", {
    name: "County Transit",
    kind: "TRANSPORT",
    jurisdiction: "Cedar County",
    contact_channel: "radio-7",
    created_at: NOW,
  });
  n(g, ["Agency"], "agency_fire", {
    name: "Fire Rescue",
    kind: "FIRE",
    jurisdiction: "West Basin / Civic",
    contact_channel: "radio-3",
    created_at: NOW,
  });
  n(g, ["Agency"], "agency_parks", {
    name: "Parks & Arena Ops",
    kind: "FACILITY",
    jurisdiction: "Civic District",
    contact_channel: "radio-11",
    created_at: NOW,
  });
  n(g, ["Agency"], "agency_oem", {
    name: "Cedar OEM",
    kind: "COORDINATION",
    jurisdiction: "Cedar County",
    contact_channel: "watch-desk",
    created_at: NOW,
  });

  r(g, "HAS_AUTHORITY", "agency_transit", "zone_west_basin", { valid_from: T14, valid_to: null, confidence: 0.95 });
  r(g, "HAS_AUTHORITY", "agency_transit", "zone_riverside", { valid_from: T14, valid_to: null, confidence: 0.95 });
  r(g, "HAS_AUTHORITY", "agency_fire", "zone_west_basin", { valid_from: T14, valid_to: null, confidence: 0.9 });
  r(g, "OPERATES", "agency_parks", "shelter_civic");
  r(g, "OPERATES", "agency_oem", "shelter_riverside");
  r(g, "WORKS_FOR", "human_approver", "agency_oem");
  r(g, "REPRESENTS", "agent_coordinator", "agency_oem");

  n(g, ["Asset"], "asset_bus_01", {
    kind: "ACCESSIBLE_BUS",
    quantity: 1,
    status: "AVAILABLE",
    owner_id: "agency_transit",
    available_from: T14,
    available_to: null,
    created_at: NOW,
    updated_at: NOW,
  });
  r(g, "CONTROLS", "agency_transit", "asset_bus_01");
  r(g, "STAGED_AT", "asset_bus_01", "site_west_neighborhoods");
  r(g, "CAN_SERVE", "asset_bus_01", "need_w01_s");

  fact(g, "fact_shelter_a_cots_1400", "shelter_riverside", "available_cots", "42", "src_shelter_radio_1400", "ev_cots_1400", "Riverside High reports 42 cots open, ramps staffed.");
  fact(g, "fact_shelter_a_access_1400", "shelter_riverside", "accessible", "true", "src_shelter_radio_1400", "ev_access_1400", "West door and gym ramp clear.");
  fact(g, "fact_road_west_1400", "road_west_connector", "status", "OPEN", "src_dot_1400", "ev_road_west_1400", "West Connector open both directions, 8 min.");
  fact(g, "fact_road_civic_1400", "road_north_civic", "status", "OPEN", "src_dot_1400", "ev_road_civic_1400", "North Civic open, 14 min to Arena.");
  fact(g, "fact_shelter_b_cots_1400", "shelter_civic", "available_cots", "100", "src_shelter_radio_1400", "ev_cots_b_1400", "Civic Arena 100 cots, medical bay ready.");
  fact(g, "fact_north_inaccessible", "shelter_north_school", "accessible", "false", "src_oem_sop", "ev_north_access", "North School gym is stairs-only. No step-free access.");

  n(g, ["OpenLoop"], "ol_west_overflow", {
    title: "Resolve west-side overflow shelter",
    description: "Place West Basin households into an accessible shelter with a live route and confirmed authority.",
    priority: 5,
    status: "OPEN",
    due_at: "2026-10-15T19:00:00Z",
    created_at: NOW,
    updated_at: NOW,
  });
  r(g, "DEPENDS_ON", "ol_west_overflow", "shelter_riverside");

  n(g, ["FailedAttempt"], "fa_north_school", {
    action_kind: "TRANSFER_TO_SHELTER",
    target_id: "shelter_north_school",
    reason: "North School is not step-free. Mobility-limited households cannot enter the gym.",
    attempted_at: "2026-10-15T13:40:00Z",
    source_id: "src_oem_sop",
    created_at: NOW,
  });
  r(g, "ABOUT", "fa_north_school", "ol_west_overflow");
  r(g, "TARGETS", "fa_north_school", "shelter_north_school");

  n(g, ["Episode"], "ep_outgoing_1400", {
    kind: "WATCH_NOTE",
    text: "Outgoing watch: West Connector open. Riverside High recommended for West Basin overflow. North School already failed on accessibility.",
    occurred_at: T14,
    recorded_at: T14,
    author_agent_id: "agent_outgoing_watch",
    session_id: "session_outgoing",
    source_id: "src_shelter_radio_1400",
    importance: 0.9,
    synthetic: true,
    created_at: NOW,
  });
  r(g, "RECORDED", "session_outgoing", "ep_outgoing_1400");
  r(g, "RECORDED", "agent_outgoing_watch", "ep_outgoing_1400");
  r(g, "MENTIONS", "ep_outgoing_1400", "fact_shelter_a_cots_1400");
  r(g, "CREATED", "ep_outgoing_1400", "ol_west_overflow");
  r(g, "RECORDED_ATTEMPT", "ep_outgoing_1400", "fa_north_school");

  n(g, ["Decision"], "d_1400_shelter_a", {
    action_kind: "TRANSFER_TO_SHELTER",
    status: "APPROVED",
    rationale: "Riverside High has 42 cots, an open West Connector, and County Transit authority on origin and campus.",
    reference_time: T14,
    proposed_at: "2026-10-15T14:08:00Z",
    approved_at: "2026-10-15T14:12:00Z",
    approved_by: "human_approver",
    confidence: 0.91,
    created_by: "agent_planner",
    created_at: "2026-10-15T14:08:00Z",
    updated_at: "2026-10-15T14:12:00Z",
  });
  r(g, "FOR_INCIDENT", "d_1400_shelter_a", "inc_cedar_flood");
  r(g, "FOR_ZONE", "d_1400_shelter_a", "zone_west_basin");
  r(g, "USES_FACT", "d_1400_shelter_a", "fact_shelter_a_cots_1400");
  r(g, "USES_FACT", "d_1400_shelter_a", "fact_road_west_1400");
  r(g, "SUPPORTED_BY", "d_1400_shelter_a", "ev_cots_1400");
  r(g, "MADE", "agent_planner", "d_1400_shelter_a");
  r(g, "REQUIRES_APPROVAL_FROM", "d_1400_shelter_a", "human_approver");
  r(g, "RECORDED_DECISION", "ep_outgoing_1400", "d_1400_shelter_a");

  n(g, ["Handoff"], "handoff_1755", {
    from_agent_id: "agent_outgoing_watch",
    to_agent_id: "agent_incoming_watch",
    created_at: T_HANDOFF,
    reference_time: T_HANDOFF,
    status: "PENDING_REVIEW",
    summary: "West Basin overflow still open. Riverside High plan was valid at 14:00. Unowned loop remains. Do not retry North School.",
    checklist_json: JSON.stringify(["reconstruct 14:00", "diff current facts", "failed attempts", "unowned loops"]),
  });
  r(g, "HAS_HANDOFF", "watch_flood_ops", "handoff_1755");
  r(g, "FROM_AGENT", "handoff_1755", "agent_outgoing_watch");
  r(g, "TO_AGENT", "handoff_1755", "agent_incoming_watch");
  r(g, "TRANSFERS", "handoff_1755", "ol_west_overflow");
  r(g, "CREATED_HANDOFF", "ep_outgoing_1400", "handoff_1755");

    const ALLOWED_LABELS = new Set(["Tenant", "Incident", "Watch", "Agent", "Human", "Session", "Zone", "Site", "Road", "Hazard", "Constraint", "Source", "Household", "Person", "Need", "Shelter", "Agency", "Asset", "Fact", "Evidence", "OpenLoop", "FailedAttempt", "Episode", "Decision", "Handoff", "DecisionTrace", "Outcome"]);
  const ALLOWED_RELS = new Set(["OWNS_INCIDENT", "HAS_WATCH", "MEMBER_OF", "HAS_SESSION", "RUN_BY", "CONTAINS", "CONNECTED_BY", "CONNECTS_TO", "HAS_HAZARD", "AFFECTS", "HAS_CONSTRAINT", "SUPPORTS", "LOCATED_IN", "HAS_NEED", "HAS_SHELTER", "STAGED_AT", "HAS_AUTHORITY", "OPERATES", "WORKS_FOR", "REPRESENTS", "CONTROLS", "CAN_SERVE", "ABOUT", "SUPPORTED_BY", "FROM_SOURCE", "DEPENDS_ON", "TARGETS", "RECORDED", "MENTIONS", "CREATED", "RECORDED_ATTEMPT", "FOR_INCIDENT", "FOR_ZONE", "USES_FACT", "MADE", "REQUIRES_APPROVAL_FROM", "RECORDED_DECISION", "HAS_HANDOFF", "FROM_AGENT", "TO_AGENT", "TRANSFERS", "CREATED_HANDOFF", "SUPERSEDES", "OBSERVED", "LED_TO", "RECORDED_OUTCOME", "OWNS", "PROPOSED"]);

  for (const [label, nodes] of Object.entries(g.nodesByLabel)) {
    if (!ALLOWED_LABELS.has(label)) throw new Error(`Invalid label: ${label}`);
    await store.query(`
      UNWIND $nodes AS n
      MERGE (node:${label} {id: n.id})
      SET node += n
    `, { nodes });
  }

  const relGroups = {};
  for (const [type, rels] of Object.entries(g.relsByType)) {
    if (!ALLOWED_RELS.has(type)) throw new Error(`Invalid rel type: ${type}`);
    for (const r of rels) {
      const fromLabel = g.nodeLabels[r.from] || 'Node';
      const toLabel = g.nodeLabels[r.to] || 'Node';
      const key = `${fromLabel}|${toLabel}|${type}`;
      if (!relGroups[key]) relGroups[key] = [];
      relGroups[key].push({ from: r.from, to: r.to, props: r.props });
    }
  }

  for (const [key, rels] of Object.entries(relGroups)) {
    const [fromLabel, toLabel, type] = key.split('|');
    await store.query(`
      UNWIND $rels AS r
      MATCH (from:${fromLabel} {id: r.from})
      MATCH (to:${toLabel} {id: r.to})
      MERGE (from)-[rel:${type}]->(to)
      SET rel += r.props
    `, { rels });
  }
}

export async function injectChange1630(store: GraphStore): Promise<void> {
  await store.query(`MATCH (r:Road {id: 'road_west_connector'}) SET r.status = 'CLOSED', r.closed_at = $t, r.closed_reason = 'Water over both lanes at mile 1.4', r.updated_at = $t`, { t: T1630 });
  await store.query(`MATCH (:Site {id: 'site_west_neighborhoods'})-[rel:CONNECTED_BY {road_id: 'road_west_connector'}]->() SET rel.status = 'CLOSED', rel.closed_at = $t, rel.closed_reason = 'Water over both lanes'`, { t: T1630 });
  await store.query(`MATCH (s:Shelter {id: 'shelter_riverside'}) SET s.occupied = 52, s.updated_at = $t`, { t: T1630 });
  
  await store.query(`MATCH (f:Fact {id: 'fact_road_west_1400'}) SET f.status = 'SUPERSEDED', f.valid_to = $t`, { t: T1630 });
  await store.query(`MERGE (f:Fact {id: 'fact_road_west_1630'}) SET f += {subject_id: 'road_west_connector', predicate: 'status', object_value: 'CLOSED', value_type: 'STRING', valid_from: $t, valid_to: null, observed_at: $t, confidence: 0.94, status: 'VALID', source_id: 'src_dot_1630', created_at: $t, updated_at: $t}`, { t: T1630 });
  await store.query(`MATCH (old:Fact {id: 'fact_road_west_1400'}), (new:Fact {id: 'fact_road_west_1630'}) MERGE (new)-[:SUPERSEDES]->(old)`);
  await store.query(`MATCH (new:Fact {id: 'fact_road_west_1630'}), (subj {id: 'road_west_connector'}) MERGE (new)-[:ABOUT]->(subj)`);
  await store.query(`MERGE (ev:Evidence {id: 'ev_road_west_1630'}) SET ev += {quote: 'DOT: West Connector closed. Standing water both lanes. Do not send buses.', source_span: 'road-board', observed_at: $t, confidence: 0.94, created_at: $t}`, { t: T1630 });
  await store.query(`MATCH (f:Fact {id: 'fact_road_west_1630'}), (ev:Evidence {id: 'ev_road_west_1630'}) MERGE (f)-[:SUPPORTED_BY]->(ev)`);
  await store.query(`MATCH (ev:Evidence {id: 'ev_road_west_1630'}), (src:Source {id: 'src_dot_1630'}) MERGE (ev)-[:FROM_SOURCE]->(src)`);
  await store.query(`MATCH (ev:Evidence {id: 'ev_road_west_1630'}), (subj {id: 'road_west_connector'}) MERGE (ev)-[:ABOUT]->(subj)`);

  await store.query(`MATCH (f:Fact {id: 'fact_shelter_a_cots_1400'}) SET f.status = 'SUPERSEDED', f.valid_to = $t`, { t: T1630 });
  await store.query(`MERGE (f:Fact {id: 'fact_shelter_a_cots_1630'}) SET f += {subject_id: 'shelter_riverside', predicate: 'available_cots', object_value: '8', value_type: 'STRING', valid_from: $t, valid_to: null, observed_at: $t, confidence: 0.93, status: 'VALID', source_id: 'src_shelter_radio_1630', created_at: $t, updated_at: $t}`, { t: T1630 });
  await store.query(`MATCH (old:Fact {id: 'fact_shelter_a_cots_1400'}), (new:Fact {id: 'fact_shelter_a_cots_1630'}) MERGE (new)-[:SUPERSEDES]->(old)`);
  await store.query(`MATCH (new:Fact {id: 'fact_shelter_a_cots_1630'}), (subj {id: 'shelter_riverside'}) MERGE (new)-[:ABOUT]->(subj)`);
  await store.query(`MERGE (ev:Evidence {id: 'ev_cots_1630'}) SET ev += {quote: 'Riverside High: gym taking on seepage. 8 dry cots remain. Do not send additional overflow.', source_span: 'radio-log', observed_at: $t, confidence: 0.93, created_at: $t}`, { t: T1630 });
  await store.query(`MATCH (f:Fact {id: 'fact_shelter_a_cots_1630'}), (ev:Evidence {id: 'ev_cots_1630'}) MERGE (f)-[:SUPPORTED_BY]->(ev)`);
  await store.query(`MATCH (ev:Evidence {id: 'ev_cots_1630'}), (src:Source {id: 'src_shelter_radio_1630'}) MERGE (ev)-[:FROM_SOURCE]->(src)`);
  await store.query(`MATCH (ev:Evidence {id: 'ev_cots_1630'}), (subj {id: 'shelter_riverside'}) MERGE (ev)-[:ABOUT]->(subj)`);

  await store.query(`MERGE (ep:Episode {id: 'ep_change_1630'}) SET ep += {kind: 'ROAD_CLOSURE', text: '16:30: West Connector closed. Riverside High capacity superseded 42 → 8. Prior Shelter A plan is no longer valid.', occurred_at: $t, recorded_at: $t, author_agent_id: 'agent_ingestor', session_id: 'session_outgoing', source_id: 'src_dot_1630', importance: 0.97, synthetic: true, created_at: $t}`, { t: T1630 });
  await store.query(`MATCH (sess:Session {id: 'session_outgoing'}), (ep:Episode {id: 'ep_change_1630'}) MERGE (sess)-[:RECORDED]->(ep)`);
  await store.query(`MATCH (ag:Agent {id: 'agent_ingestor'}), (ep:Episode {id: 'ep_change_1630'}) MERGE (ag)-[:RECORDED]->(ep)`);
  await store.query(`MATCH (ep:Episode {id: 'ep_change_1630'}), (f:Fact {id: 'fact_road_west_1630'}) MERGE (ep)-[:MENTIONS]->(f)`);
  await store.query(`MATCH (ep:Episode {id: 'ep_change_1630'}), (f:Fact {id: 'fact_shelter_a_cots_1630'}) MERGE (ep)-[:MENTIONS]->(f)`);
  await store.query(`MATCH (ep:Episode {id: 'ep_change_1630'}), (ev:Evidence {id: 'ev_road_west_1630'}) MERGE (ep)-[:OBSERVED]->(ev)`);
}

export async function confirmParksAuthority(store: GraphStore, at: string): Promise<void> {
  await store.query(`MATCH (a:Agency {id: 'agency_parks'}), (z:Zone {id: 'zone_civic'}) MERGE (a)-[r:HAS_AUTHORITY]->(z) SET r += {valid_from: $at, valid_to: null, confidence: 0.97, source_id: 'human_approver'}`, { at });
  await store.query(`MERGE (ep:Episode {id: 'ep_authority_confirm'}) SET ep += {kind: 'AUTHORITY_CONFIRMED', text: 'Duty officer confirmed Parks & Arena Ops authority for Civic District sheltering.', occurred_at: $at, recorded_at: $at, author_agent_id: 'agent_coordinator', importance: 0.88, synthetic: true, created_at: $at}`, { at });
  await store.query(`MATCH (ag:Agent {id: 'agent_coordinator'}), (ep:Episode {id: 'ep_authority_confirm'}) MERGE (ag)-[:RECORDED]->(ep)`);
}

export async function acceptHandoff(store: GraphStore, at: string): Promise<void> {
  await store.query(`MATCH (h:Handoff {id: 'handoff_1755'}) SET h.status = 'ACCEPTED', h.accepted_at = $at, h.accepted_by = 'agent_incoming_watch'`, { at });
  await store.query(`MERGE (s:Session {id: 'session_incoming'}) SET s += {agent_id: 'agent_incoming_watch', watch_id: 'watch_flood_ops', started_at: $at, status: 'ACTIVE', last_reference_time: $at, created_at: $at}`, { at });
  await store.query(`MATCH (w:Watch {id: 'watch_flood_ops'}), (s:Session {id: 'session_incoming'}) MERGE (w)-[:HAS_SESSION]->(s)`);
  await store.query(`MATCH (s:Session {id: 'session_incoming'}), (ag:Agent {id: 'agent_incoming_watch'}) MERGE (s)-[:RUN_BY]->(ag)`);
}

export async function killOutgoing(store: GraphStore, at: string): Promise<void> {
  await store.query(`MATCH (a:Agent {id: 'agent_outgoing_watch'}) SET a.status = 'OFFLINE'`);
  await store.query(`MATCH (s:Session {id: 'session_outgoing'}) SET s.status = 'INTERRUPTED', s.ended_at = $at`, { at });
}

export async function assignOpenLoop(store: GraphStore, agentId: string, at: string): Promise<void> {
  await store.query(`MATCH ()-[r:OWNS]->(o:OpenLoop {id: 'ol_west_overflow'}) DELETE r`);
  await store.query(`MATCH (a:Agent {id: $agentId}), (o:OpenLoop {id: 'ol_west_overflow'}) MERGE (a)-[r:OWNS]->(o) SET r += {assigned_at: $at, assigned_by: 'agent_coordinator'}`, { agentId, at });
  await store.query(`MATCH (o:OpenLoop {id: 'ol_west_overflow'}) SET o.status = 'ASSIGNED', o.updated_at = $at`, { at });
}

export async function writeProposal(
  store: GraphStore,
  input: {
    decisionId: string;
    action: string;
    rationale: string;
    confidence: number;
    referenceTime: string;
    factIds: string[];
    evidenceIds: string[];
    shelterId: string;
    zoneId: string;
  }
): Promise<void> {
  await store.query(`MERGE (d:DecisionTrace {id: 'trace_1800'}) SET d += {question: 'Which accessible shelter can receive West Basin households now?', reference_time: $referenceTime, started_at: $referenceTime, status: 'RUNNING', planner_agent_id: 'agent_planner', assumptions_json: '[]', created_at: $referenceTime}`, { referenceTime: input.referenceTime });
  await store.query(`MERGE (d:Decision {id: $decisionId}) SET d += {action_kind: 'TRANSFER_TO_SHELTER', status: 'PROPOSED', rationale: $rationale, reference_time: $referenceTime, proposed_at: $referenceTime, confidence: $confidence, created_by: 'agent_planner', created_at: $referenceTime, updated_at: $referenceTime, action: $action, shelter_id: $shelterId}`, input);
  await store.query(`MATCH (t:DecisionTrace {id: 'trace_1800'}), (d:Decision {id: $decisionId}) MERGE (t)-[:PROPOSED]->(d)`, { decisionId: input.decisionId });
  await store.query(`MATCH (d:Decision {id: $decisionId}), (i:Incident {id: 'inc_cedar_flood'}) MERGE (d)-[:FOR_INCIDENT]->(i)`, { decisionId: input.decisionId });
  await store.query(`MATCH (d:Decision {id: $decisionId}), (z:Zone {id: $zoneId}) MERGE (d)-[:FOR_ZONE]->(z)`, { decisionId: input.decisionId, zoneId: input.zoneId });
  await store.query(`MATCH (a:Agent {id: 'agent_planner'}), (d:Decision {id: $decisionId}) MERGE (a)-[:MADE]->(d)`, { decisionId: input.decisionId });
  await store.query(`MATCH (d:Decision {id: $decisionId}), (h:Human {id: 'human_approver'}) MERGE (d)-[:REQUIRES_APPROVAL_FROM]->(h)`, { decisionId: input.decisionId });
  for (const fid of input.factIds) {
    await store.query(`MATCH (d:Decision {id: $decisionId}), (f:Fact {id: $fid}) MERGE (d)-[:USES_FACT]->(f)`, { decisionId: input.decisionId, fid });
  }
  for (const eid of input.evidenceIds) {
    await store.query(`MATCH (d:Decision {id: $decisionId}), (e:Evidence {id: $eid}) MERGE (d)-[:SUPPORTED_BY]->(e)`, { decisionId: input.decisionId, eid });
  }
}

export async function setDecisionStatus(
  store: GraphStore,
  decisionId: string,
  status: string,
  at: string,
  extra: Record<string, any> = {}
): Promise<void> {
  await store.query(`MATCH (d:Decision {id: $decisionId}) SET d.status = $status, d.updated_at = $at`, { decisionId, status, at });
  for (const [k, v] of Object.entries(extra)) {
    await store.query(`MATCH (d:Decision {id: $decisionId}) SET d.${k} = $v`, { decisionId, v });
  }
}

export async function recordOutcome(store: GraphStore, decisionId: string, at: string, notes: string): Promise<void> {
  await store.query(`MERGE (o:Outcome {id: 'out_civic_sim'}) SET o += {status: 'EXECUTED_IN_SIMULATION', metric_name: 'households_assigned', metric_value: 6, observed_at: $at, notes: $notes, created_at: $at}`, { at, notes });
  await store.query(`MATCH (d:Decision {id: $decisionId}), (o:Outcome {id: 'out_civic_sim'}) MERGE (d)-[:LED_TO]->(o)`, { decisionId });
  await store.query(`MATCH (o:OpenLoop {id: 'ol_west_overflow'}) SET o.status = 'CLOSED', o.updated_at = $at`, { at });
  await store.query(`MERGE (ep:Episode {id: 'ep_outcome'}) SET ep += {kind: 'OPEN_LOOP_CLOSED', text: $notes, occurred_at: $at, recorded_at: $at, author_agent_id: 'agent_coordinator', importance: 0.8, synthetic: true, created_at: $at}`, { at, notes });
  await store.query(`MATCH (ep:Episode {id: 'ep_outcome'}), (o:Outcome {id: 'out_civic_sim'}) MERGE (ep)-[:RECORDED_OUTCOME]->(o)`);
  await store.query(`MATCH (a:Agent {id: 'agent_coordinator'}), (ep:Episode {id: 'ep_outcome'}) MERGE (a)-[:RECORDED]->(ep)`);
}
