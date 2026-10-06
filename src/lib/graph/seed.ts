import { PropertyGraph } from "./engine.ts";
import { supersedeFact } from "./temporal.ts";
import { GRAPH_NAME, T14, T1630, T_HANDOFF } from "./types.ts";

const NOW = T14;

function n(g: PropertyGraph, labels: string[], id: string, props: Record<string, string | number | boolean | null | string[]>) {
  g.mergeNode(labels, id, { id, ...props });
}

function r(g: PropertyGraph, type: string, from: string, to: string, props: Record<string, string | number | boolean | null | string[]> = {}) {
  g.mergeRel(type, from, to, props);
}

function fact(
  g: PropertyGraph,
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

export function seedBaseline(): PropertyGraph {
  const g = new PropertyGraph(GRAPH_NAME);

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

  function link(from: string, to: string, roadId: string) {
    const road = g.must(roadId);
    r(g, "CONNECTED_BY", from, to, {
      road_id: roadId,
      distance_km: Number(road.props.distance_km),
      travel_minutes: Number(road.props.travel_minutes),
      status: String(road.props.status),
      valid_from: T14,
      valid_to: null,
      source_id: "src_dot_1400",
    });
    r(g, "CONNECTS_TO", roadId, from);
    r(g, "CONNECTS_TO", roadId, to);
  }
  link("site_west_neighborhoods", "site_riverside_high", "road_west_connector");
  link("site_west_neighborhoods", "site_civic_arena", "road_north_civic");
  link("site_west_neighborhoods", "site_north_school", "road_ridge");
  link("site_civic_arena", "site_east_gym", "road_civic_loop");

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

  return g;
}

export function injectChange1630(g: PropertyGraph): void {
  g.setProps("road_west_connector", {
    status: "CLOSED",
    closed_at: T1630,
    closed_reason: "Water over both lanes at mile 1.4",
    updated_at: T1630,
  });
  for (const rel of [...g.out("site_west_neighborhoods", "CONNECTED_BY")]) {
    if (rel.props.road_id === "road_west_connector") {
      Object.assign(rel.props, { status: "CLOSED", closed_at: T1630, closed_reason: "Water over both lanes" });
    }
  }

  g.setProps("shelter_riverside", { occupied: 52, updated_at: T1630 });

  supersedeFact(g, "fact_road_west_1400", "fact_road_west_1630", "CLOSED", T1630, "src_dot_1630", 0.94, T1630);
  n(g, ["Evidence"], "ev_road_west_1630", {
    quote: "DOT: West Connector closed. Standing water both lanes. Do not send buses.",
    source_span: "road-board",
    observed_at: T1630,
    confidence: 0.94,
    created_at: T1630,
  });
  r(g, "SUPPORTED_BY", "fact_road_west_1630", "ev_road_west_1630");
  r(g, "FROM_SOURCE", "ev_road_west_1630", "src_dot_1630");
  r(g, "ABOUT", "ev_road_west_1630", "road_west_connector");

  supersedeFact(g, "fact_shelter_a_cots_1400", "fact_shelter_a_cots_1630", "8", T1630, "src_shelter_radio_1630", 0.93, T1630);
  n(g, ["Evidence"], "ev_cots_1630", {
    quote: "Riverside High: gym taking on seepage. 8 dry cots remain. Do not send additional overflow.",
    source_span: "radio-log",
    observed_at: T1630,
    confidence: 0.93,
    created_at: T1630,
  });
  r(g, "SUPPORTED_BY", "fact_shelter_a_cots_1630", "ev_cots_1630");
  r(g, "FROM_SOURCE", "ev_cots_1630", "src_shelter_radio_1630");
  r(g, "ABOUT", "ev_cots_1630", "shelter_riverside");

  n(g, ["Episode"], "ep_change_1630", {
    kind: "ROAD_CLOSURE",
    text: "16:30: West Connector closed. Riverside High capacity superseded 42 → 8. Prior Shelter A plan is no longer valid.",
    occurred_at: T1630,
    recorded_at: T1630,
    author_agent_id: "agent_ingestor",
    session_id: "session_outgoing",
    source_id: "src_dot_1630",
    importance: 0.97,
    synthetic: true,
    created_at: T1630,
  });
  r(g, "RECORDED", "session_outgoing", "ep_change_1630");
  r(g, "RECORDED", "agent_ingestor", "ep_change_1630");
  r(g, "MENTIONS", "ep_change_1630", "fact_road_west_1630");
  r(g, "MENTIONS", "ep_change_1630", "fact_shelter_a_cots_1630");
  r(g, "OBSERVED", "ep_change_1630", "ev_road_west_1630");
}

export function confirmParksAuthority(g: PropertyGraph, at: string): void {
  r(g, "HAS_AUTHORITY", "agency_parks", "zone_civic", { valid_from: at, valid_to: null, confidence: 0.97, source_id: "human_approver" });
  n(g, ["Episode"], "ep_authority_confirm", {
    kind: "AUTHORITY_CONFIRMED",
    text: "Duty officer confirmed Parks & Arena Ops authority for Civic District sheltering.",
    occurred_at: at,
    recorded_at: at,
    author_agent_id: "agent_coordinator",
    importance: 0.88,
    synthetic: true,
    created_at: at,
  });
  r(g, "RECORDED", "agent_coordinator", "ep_authority_confirm");
}

export function acceptHandoff(g: PropertyGraph, at: string): void {
  g.setProps("handoff_1755", { status: "ACCEPTED", accepted_at: at, accepted_by: "agent_incoming_watch" });
  n(g, ["Session"], "session_incoming", {
    agent_id: "agent_incoming_watch",
    watch_id: "watch_flood_ops",
    started_at: at,
    status: "ACTIVE",
    last_reference_time: at,
    created_at: at,
  });
  r(g, "HAS_SESSION", "watch_flood_ops", "session_incoming");
  r(g, "RUN_BY", "session_incoming", "agent_incoming_watch");
}

export function killOutgoing(g: PropertyGraph, at: string): void {
  g.setProps("agent_outgoing_watch", { status: "OFFLINE" });
  g.setProps("session_outgoing", { status: "INTERRUPTED", ended_at: at });
}

export function assignOpenLoop(g: PropertyGraph, agentId: string, at: string): void {
  for (const rel of g.in("ol_west_overflow", "OWNS")) g.deleteRel(rel.id);
  r(g, "OWNS", agentId, "ol_west_overflow", { assigned_at: at, assigned_by: "agent_coordinator" });
  g.setProps("ol_west_overflow", { status: "ASSIGNED", updated_at: at });
}

export function writeProposal(
  g: PropertyGraph,
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
  },
): void {
  n(g, ["DecisionTrace"], "trace_1800", {
    question: "Which accessible shelter can receive West Basin households now?",
    reference_time: input.referenceTime,
    started_at: input.referenceTime,
    status: "RUNNING",
    planner_agent_id: "agent_planner",
    assumptions_json: "[]",
    created_at: input.referenceTime,
  });
  n(g, ["Decision"], input.decisionId, {
    action_kind: "TRANSFER_TO_SHELTER",
    status: "PROPOSED",
    rationale: input.rationale,
    reference_time: input.referenceTime,
    proposed_at: input.referenceTime,
    confidence: input.confidence,
    created_by: "agent_planner",
    created_at: input.referenceTime,
    updated_at: input.referenceTime,
    action: input.action,
    shelter_id: input.shelterId,
  });
  r(g, "PROPOSED", "trace_1800", input.decisionId);
  r(g, "FOR_INCIDENT", input.decisionId, "inc_cedar_flood");
  r(g, "FOR_ZONE", input.decisionId, input.zoneId);
  r(g, "MADE", "agent_planner", input.decisionId);
  r(g, "REQUIRES_APPROVAL_FROM", input.decisionId, "human_approver");
  for (const fid of input.factIds) {
    if (g.get(fid)) r(g, "USES_FACT", input.decisionId, fid);
  }
  for (const eid of input.evidenceIds) {
    if (g.get(eid)) r(g, "SUPPORTED_BY", input.decisionId, eid);
  }
}

export function setDecisionStatus(
  g: PropertyGraph,
  decisionId: string,
  status: string,
  at: string,
  extra: Record<string, string | number | boolean | null> = {},
): void {
  g.setProps(decisionId, { status, updated_at: at, ...extra });
}

export function recordOutcome(g: PropertyGraph, decisionId: string, at: string, notes: string): void {
  n(g, ["Outcome"], "out_civic_sim", {
    status: "EXECUTED_IN_SIMULATION",
    metric_name: "households_assigned",
    metric_value: 6,
    observed_at: at,
    notes,
    created_at: at,
  });
  r(g, "LED_TO", decisionId, "out_civic_sim");
  g.setProps("ol_west_overflow", { status: "CLOSED", updated_at: at });
  n(g, ["Episode"], "ep_outcome", {
    kind: "OPEN_LOOP_CLOSED",
    text: notes,
    occurred_at: at,
    recorded_at: at,
    author_agent_id: "agent_coordinator",
    importance: 0.8,
    synthetic: true,
    created_at: at,
  });
  r(g, "RECORDED_OUTCOME", "ep_outcome", "out_civic_sim");
  r(g, "RECORDED", "agent_coordinator", "ep_outcome");
}
