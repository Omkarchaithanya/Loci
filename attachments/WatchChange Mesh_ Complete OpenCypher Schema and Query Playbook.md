# WatchChange Mesh: Complete OpenCypher Schema and Query Playbook

## Combined hackathon idea

**WatchChange Mesh** combines **Crisis Mesh** with **WatchChange’s bi-temporal handoff memory**.

It is a human-approved disaster-coordination system for a bounded flood or wildfire scenario. The system maintains:

- the live operational graph: hazards, zones, households, needs, shelters, agencies, assets, roads, and constraints;
- the temporal memory graph: episodes, facts, decisions, procedures, failed attempts, open loops, handoffs, and outcomes;
- a multi-agent workflow: outgoing watch, incoming watch, specialist, coordinator, planner, reviewer, and human approver.

The central demo is:

> At 14:00, Shelter A had capacity and an accessible route. At 18:00, the route is closed and the old capacity fact is superseded. The incoming agent queries the point-in-time graph, sees what changed, finds unresolved work without an owner, and proposes a new plan with a cited evidence path.

**Primary track:** Track 2 — Agent Memory and Coordination  
**Secondary track:** Track 1 — Agents That Act on Connected Data

This document targets **FalkorDB core** using OpenCypher through `GRAPH.QUERY` / `GRAPH.RO_QUERY`. FalkorDB implements a subset of OpenCypher with proprietary extensions, so every query should be tested against the exact pinned FalkorDB image before submission. [1]

---

## 1. Implementation conventions

### 1.1 Graph names

Use one named graph per incident or tenant in the hackathon demo:

```text
watchchange_flood_demo
```

For a larger deployment, use a naming convention such as:

```text
watchchange_<tenant_id>_<incident_id>
```

Do not rely on a `tenant_id` property as the only isolation boundary. Separate graph names are easier to demonstrate and audit.

### 1.2 IDs and timestamps

Every node that is written by an agent receives an application-generated stable ID. Use ISO-8601 UTC strings for human-readable timestamps and Unix milliseconds for numeric range filtering if desired.

Recommended properties:

```text
id             stable application ID
created_at     when this graph record was created
updated_at     last update time
valid_from     when the fact became true in the modeled world
valid_to       when the fact stopped being true; NULL means still valid
source_id      source node ID, when applicable
confidence     0.0–1.0 application confidence
synthetic      true for fictional/demo data
```

FalkorDB supports range indexes over string and numeric properties, so this design uses range-friendly timestamp strings and numeric confidence values. [2]

### 1.3 Temporal semantics

WatchChange uses two distinct timelines:

- **Valid time:** when something was true in the disaster world. `valid_from` and `valid_to`.
- **Transaction/observation time:** when the agent learned or recorded it. `created_at` and `updated_at`.

Never overwrite an important operational fact in place. Instead:

1. create a replacement fact with a new ID;
2. set the old fact’s `valid_to` or `invalidated_at`;
3. connect the replacement with `[:SUPERSEDES]`;
4. retain the old fact for point-in-time reconstruction.

### 1.4 Write policy

FalkorDB permits parallel reads, serializes writes per graph, and makes each write query atomic. Batch related mutations into one query where possible. [4]

Recommended agent write policy:

- read-only planner and reviewer queries use `GRAPH.RO_QUERY`;
- state transitions use one atomic write query;
- append-only `Episode`, `Observation`, `DecisionTrace`, and `Handoff` records are preferred over destructive updates;
- only the coordinator or human approver may promote a proposal to `APPROVED`.

---

## 2. Complete graph schema

The schema is modeled as a property graph. Labels are intentionally explicit so that queries remain readable and the graph can be inspected during the demo.

### 2.1 Control-plane and identity nodes

```text
Tenant
  id, name, created_at

Incident
  id, name, kind, status, severity, start_at, end_at,
  created_at, updated_at, synthetic

Watch
  id, name, reference_time, status, timezone,
  created_at, updated_at

Agent
  id, name, role, status, model, created_at

Human
  id, name, role, agency_id, approval_scope, created_at

Session
  id, agent_id, watch_id, started_at, ended_at, status,
  last_reference_time, created_at

Tenant -[:OWNS_INCIDENT]-> Incident
Incident -[:HAS_WATCH]-> Watch
Watch -[:HAS_SESSION]-> Session
Session -[:RUN_BY]-> Agent
Human -[:MEMBER_OF]-> Tenant
Agent -[:MEMBER_OF]-> Tenant
```

### 2.2 Operational geography and hazard nodes

```text
Hazard
  id, kind, severity, status, description,
  observed_at, valid_from, valid_to, source_id,
  confidence, synthetic, created_at

Zone
  id, name, zone_type, geometry_ref, population_estimate,
  created_at, updated_at

Road
  id, name, road_type, status, distance_km,
  travel_minutes, geometry_ref, created_at, updated_at

Site
  id, name, site_type, address, latitude, longitude,
  status, created_at, updated_at

Constraint
  id, kind, expression, threshold, blocking,
  valid_from, valid_to, source_id, created_at

Incident -[:HAS_HAZARD]-> Hazard
Hazard -[:AFFECTS]-> Zone
Zone -[:CONNECTED_BY]-> Road
Road -[:CONNECTS_TO]-> Site
Zone -[:CONTAINS]-> Site
Zone -[:HAS_CONSTRAINT]-> Constraint
Hazard -[:HAS_CONSTRAINT]-> Constraint
```

### 2.3 People, needs, shelters, and resources

Use synthetic people and households for the hackathon. Do not ingest real protected or identifiable information.

```text
Household
  id, size, language, mobility, vulnerability_class,
  privacy_class, synthetic, created_at

Person
  id, household_id, role, age_band, mobility,
  language, vulnerability_class, privacy_class,
  synthetic, created_at

Need
  id, kind, quantity, priority, status,
  valid_from, valid_to, created_at

Shelter
  id, name, capacity, occupied, accessible,
  services, status, latitude, longitude,
  created_at, updated_at

Resource
  id, kind, quantity, unit, status,
  owner_id, created_at, updated_at

Asset
  id, kind, quantity, status, owner_id,
  available_from, available_to, created_at, updated_at

Household -[:LOCATED_IN]-> Zone
Person -[:MEMBER_OF]-> Household
Person -[:LOCATED_IN]-> Zone
Person -[:HAS_NEED]-> Need
Household -[:HAS_NEED]-> Need
Zone -[:HAS_SHELTER]-> Shelter
Shelter -[:LOCATED_IN]-> Zone
Shelter -[:HAS_RESOURCE]-> Resource
Agency -[:CONTROLS]-> Asset
Asset -[:STAGED_AT]-> Site
Asset -[:CAN_SERVE]-> Need
Resource -[:SERVES]-> Need
```

### 2.4 Agencies, authority, and coordination

```text
Agency
  id, name, kind, jurisdiction, contact_channel,
  created_at

Authority
  id, action_kind, scope, priority,
  valid_from, valid_to, created_at

Agency -[:HAS_AUTHORITY]-> Zone
Agency -[:HAS_AUTHORITY_RULE]-> Authority
Agent -[:REPRESENTS]-> Agency
Human -[:WORKS_FOR]-> Agency
Agency -[:CONTROLS]-> Asset
Agency -[:OPERATES]-> Shelter
```

### 2.5 Sources and evidence

Every external or synthetic fact should be traceable to a source node.

```text
Source
  id, provider, url, source_type, retrieved_at,
  published_at, content_hash, license, reliability,
  snapshot_path, created_at

Evidence
  id, quote, source_span, observed_at,
  confidence, created_at

Observation
  id, kind, text, observed_at, valid_from, valid_to,
  confidence, status, created_at

Source -[:SUPPORTS]-> Observation
Source -[:SUPPORTS]-> Evidence
Observation -[:EVIDENCED_BY]-> Source
Evidence -[:FROM_SOURCE]-> Source
Evidence -[:ABOUT]-> Hazard
Evidence -[:ABOUT]-> Shelter
Evidence -[:ABOUT]-> Road
Evidence -[:ABOUT]-> Decision
```

### 2.6 Bi-temporal memory and handoffs

These nodes implement the WatchChange layer.

```text
Episode
  id, kind, text, occurred_at, recorded_at,
  author_agent_id, session_id, source_id,
  importance, synthetic, created_at

Fact
  id, subject_id, predicate, object_value,
  object_id, value_type, valid_from, valid_to,
  observed_at, confidence, status, source_id,
  created_at, updated_at

Procedure
  id, name, trigger_kind, steps_json,
  version, status, valid_from, valid_to,
  owner_agent_id, created_at

OpenLoop
  id, title, description, priority, status,
  due_at, created_at, updated_at

FailedAttempt
  id, action_kind, target_id, reason,
  attempted_at, source_id, created_at

DecisionTrace
  id, question, reference_time, started_at,
  completed_at, status, planner_agent_id,
  reviewer_agent_id, assumptions_json, created_at

Decision
  id, action_kind, status, rationale,
  reference_time, proposed_at, approved_at,
  rejected_at, confidence, created_by, created_at,
  updated_at

Handoff
  id, from_agent_id, to_agent_id, created_at,
  reference_time, status, summary, checklist_json

Outcome
  id, status, metric_name, metric_value,
  observed_at, notes, created_at

Tenant -[:HAS_EPISODE]-> Episode
Session -[:RECORDED]-> Episode
Episode -[:MENTIONS]-> Fact
Episode -[:OBSERVED]-> Observation
Episode -[:CREATED]-> OpenLoop
Episode -[:RECORDED_DECISION]-> Decision
Episode -[:RECORDED_TRACE]-> DecisionTrace
Episode -[:RECORDED_ATTEMPT]-> FailedAttempt
Episode -[:CREATED_HANDOFF]-> Handoff
Episode -[:RECORDED_OUTCOME]-> Outcome

Fact -[:ABOUT]-> Hazard
Fact -[:ABOUT]-> Shelter
Fact -[:ABOUT]-> Road
Fact -[:ABOUT]-> Asset
Fact -[:ABOUT]-> OpenLoop
Fact -[:SUPERSEDES]-> Fact
Fact -[:INVALIDATES]-> Fact
Fact -[:SUPPORTED_BY]-> Evidence

Procedure -[:APPLIES_TO]-> Constraint
Agent -[:OWNS]-> OpenLoop
Agent -[:MADE]-> Decision
Agent -[:REVIEWED]-> Decision
Agent -[:RECORDED]-> Episode
Agent -[:HANDLED]-> Handoff
DecisionTrace -[:PROPOSED]-> Decision
Decision -[:FOR_INCIDENT]-> Incident
Decision -[:FOR_ZONE]-> Zone
Decision -[:USES_FACT]-> Fact
Decision -[:SUPPORTED_BY]-> Evidence
Decision -[:SUPERSEDES]-> Decision
Decision -[:LED_TO]-> Outcome
Decision -[:BLOCKED_BY]-> Constraint
Decision -[:REQUIRES_APPROVAL_FROM]-> Human
Handoff -[:FROM_AGENT]-> Agent
Handoff -[:TO_AGENT]-> Agent
Handoff -[:TRANSFERS]-> OpenLoop
FailedAttempt -[:ABOUT]-> OpenLoop
FailedAttempt -[:TARGETS]-> Shelter
FailedAttempt -[:TARGETS]-> Asset
OpenLoop -[:BLOCKED_BY]-> Constraint
OpenLoop -[:DEPENDS_ON]-> OpenLoop
```

### 2.7 Relationship properties

Put temporal and provenance properties on relationships when the relationship itself changes over time:

```text
valid_from, valid_to, observed_at, created_at,
confidence, source_id, reason, synthetic
```

Example:

```text
(:Shelter)-[:HAS_CAPACITY {
  available_cots: 42,
  valid_from: '2026-10-15T14:00:00Z',
  valid_to: '2026-10-15T16:30:00Z',
  source_id: 'src_shelter_radio_1400',
  confidence: 0.92
}]->(:Need)
```

For simpler queries, the MVP may store mutable operational values such as `shelter.occupied`, while preserving historical values as `Fact` nodes. The graph should show both the current state and the audit trail.

---

## 3. Schema and index setup queries

Run these queries against the graph named `watchchange_flood_demo`.

### 3.1 Create range indexes

FalkorDB’s current DDL syntax for a node range index is `CREATE INDEX FOR (n:Label) ON (n.property)`. [2]

```cypher
// Identity and incident lookup
CREATE INDEX FOR (n:Tenant) ON (n.id);
CREATE INDEX FOR (n:Incident) ON (n.id);
CREATE INDEX FOR (n:Hazard) ON (n.id);
CREATE INDEX FOR (n:Zone) ON (n.id);
CREATE INDEX FOR (n:Shelter) ON (n.id);
CREATE INDEX FOR (n:Road) ON (n.id);
CREATE INDEX FOR (n:Site) ON (n.id);
CREATE INDEX FOR (n:Agency) ON (n.id);
CREATE INDEX FOR (n:Asset) ON (n.id);
CREATE INDEX FOR (n:Household) ON (n.id);
CREATE INDEX FOR (n:Person) ON (n.id);

// Operational filters
CREATE INDEX FOR (n:Hazard) ON (n.status);
CREATE INDEX FOR (n:Hazard) ON (n.severity);
CREATE INDEX FOR (n:Hazard) ON (n.observed_at);
CREATE INDEX FOR (n:Hazard) ON (n.valid_from);
CREATE INDEX FOR (n:Hazard) ON (n.valid_to);
CREATE INDEX FOR (n:Shelter) ON (n.status);
CREATE INDEX FOR (n:Shelter) ON (n.capacity);
CREATE INDEX FOR (n:Shelter) ON (n.occupied);
CREATE INDEX FOR (n:Road) ON (n.status);
CREATE INDEX FOR (n:Asset) ON (n.status);
CREATE INDEX FOR (n:Constraint) ON (n.blocking);

// Temporal memory filters
CREATE INDEX FOR (n:Fact) ON (n.valid_from);
CREATE INDEX FOR (n:Fact) ON (n.valid_to);
CREATE INDEX FOR (n:Fact) ON (n.observed_at);
CREATE INDEX FOR (n:Fact) ON (n.confidence);
CREATE INDEX FOR (n:Episode) ON (n.occurred_at);
CREATE INDEX FOR (n:Episode) ON (n.recorded_at);
CREATE INDEX FOR (n:OpenLoop) ON (n.status);
CREATE INDEX FOR (n:OpenLoop) ON (n.priority);
CREATE INDEX FOR (n:OpenLoop) ON (n.due_at);
CREATE INDEX FOR (n:Decision) ON (n.status);
CREATE INDEX FOR (n:Decision) ON (n.reference_time);
CREATE INDEX FOR (n:DecisionTrace) ON (n.reference_time);
```

### 3.2 Optional relationship indexes

Use these only if relationship-property filtering becomes a bottleneck.

```cypher
CREATE INDEX FOR ()-[r:AFFECTS]-() ON (r.valid_from);
CREATE INDEX FOR ()-[r:CONNECTED_BY]-() ON (r.status);
CREATE INDEX FOR ()-[r:SUPPORTED_BY]-() ON (r.confidence);
CREATE INDEX FOR ()-[r:TRANSFERS]-() ON (r.status);
```

### 3.3 Full-text index for episodes and evidence

Full-text indexes use FalkorDB’s `db.idx.fulltext` procedures or DDL. [3]

```cypher
CREATE FULLTEXT INDEX FOR (n:Episode) ON (n.text);
CREATE FULLTEXT INDEX FOR (n:Observation) ON (n.text);
CREATE FULLTEXT INDEX FOR (n:Evidence) ON (n.quote);
CREATE FULLTEXT INDEX FOR (n:Procedure) ON (n.name);
CREATE FULLTEXT INDEX FOR (n:OpenLoop) ON (n.title, n.description);
```

Example full-text retrieval:

```cypher
CALL db.idx.fulltext.queryNodes('Episode', 'west-side overflow shelter')
YIELD node, score
RETURN node.id, node.kind, node.occurred_at, node.text, score
ORDER BY score DESC
LIMIT 10;
```

### 3.4 Optional vector index for semantic memory retrieval

Use vector retrieval only to find candidate episodes or evidence. The final answer must still be grounded by typed graph traversal.

The vector dimension must match the embedding model. This example uses `384`; change it to the actual embedding dimension. FalkorDB supports cosine or Euclidean similarity. [5]

```cypher
CREATE VECTOR INDEX FOR (n:Episode) ON (n.embedding)
OPTIONS {
  dimension: 384,
  similarityFunction: 'cosine',
  M: 16,
  efConstruction: 200,
  efRuntime: 10
};

CREATE VECTOR INDEX FOR (n:Evidence) ON (n.embedding)
OPTIONS {
  dimension: 384,
  similarityFunction: 'cosine',
  M: 16,
  efConstruction: 200,
  efRuntime: 10
};
```

Example vector retrieval:

```cypher
CALL db.idx.vector.queryNodes(
  'Episode',
  'embedding',
  10,
  vecf32($query_embedding)
)
YIELD node, score
RETURN node.id, node.kind, node.text, node.occurred_at, score
ORDER BY score ASC
LIMIT 10;
```

### 3.5 Inspect indexes

```cypher
CALL db.indexes()
YIELD *
RETURN *;
```

### 3.6 Explain a query

```cypher
EXPLAIN
MATCH (h:Hazard {id: $hazard_id})-[:AFFECTS]->(z:Zone)
RETURN h, z;
```

---

## 4. Seed data queries

The following queries create a small fictional flood scenario. Use one large seed query or several smaller atomic queries from the application.

### 4.1 Create tenant, incident, watch, and agents

```cypher
MERGE (t:Tenant {id: $tenant_id})
  ON CREATE SET
    t.name = $tenant_name,
    t.created_at = $now

MERGE (i:Incident {id: $incident_id})
  ON CREATE SET
    i.name = $incident_name,
    i.kind = 'flood',
    i.status = 'ACTIVE',
    i.severity = 4,
    i.start_at = $incident_start,
    i.synthetic = true,
    i.created_at = $now,
    i.updated_at = $now

MERGE (t)-[:OWNS_INCIDENT]->(i)

MERGE (w:Watch {id: $watch_id})
  ON CREATE SET
    w.name = 'Flood operations watch',
    w.reference_time = $reference_time,
    w.status = 'ACTIVE',
    w.timezone = 'UTC',
    w.created_at = $now,
    w.updated_at = $now

MERGE (i)-[:HAS_WATCH]->(w)

MERGE (out:Agent {id: 'agent_outgoing_watch'})
  ON CREATE SET out.name = 'Outgoing Watch', out.role = 'OUTGOING_WATCH', out.status = 'ACTIVE', out.created_at = $now
MERGE (inc:Agent {id: 'agent_incoming_watch'})
  ON CREATE SET inc.name = 'Incoming Watch', inc.role = 'INCOMING_WATCH', inc.status = 'ACTIVE', inc.created_at = $now
MERGE (planner:Agent {id: 'agent_planner'})
  ON CREATE SET planner.name = 'Planner', planner.role = 'PLANNER', planner.status = 'ACTIVE', planner.created_at = $now
MERGE (reviewer:Agent {id: 'agent_reviewer'})
  ON CREATE SET reviewer.name = 'Reviewer', reviewer.role = 'REVIEWER', reviewer.status = 'ACTIVE', reviewer.created_at = $now
MERGE (coord:Agent {id: 'agent_coordinator'})
  ON CREATE SET coord.name = 'Coordinator', coord.role = 'COORDINATOR', coord.status = 'ACTIVE', coord.created_at = $now

MERGE (out)-[:MEMBER_OF]->(t)
MERGE (inc)-[:MEMBER_OF]->(t)
MERGE (planner)-[:MEMBER_OF]->(t)
MERGE (reviewer)-[:MEMBER_OF]->(t)
MERGE (coord)-[:MEMBER_OF]->(t)
RETURN t, i, w;
```

### 4.2 Create zones and roads

```cypher
UNWIND $zones AS zdata
MERGE (z:Zone {id: zdata.id})
SET z.name = zdata.name,
    z.zone_type = zdata.zone_type,
    z.geometry_ref = zdata.geometry_ref,
    z.population_estimate = zdata.population_estimate,
    z.updated_at = $now

WITH collect(z) AS zones
UNWIND $roads AS rdata
MERGE (r:Road {id: rdata.id})
SET r.name = rdata.name,
    r.road_type = rdata.road_type,
    r.status = rdata.status,
    r.distance_km = rdata.distance_km,
    r.travel_minutes = rdata.travel_minutes,
    r.geometry_ref = rdata.geometry_ref,
    r.updated_at = $now
RETURN count(r) AS roads_created;
```

Connect roads and sites:

```cypher
UNWIND $road_links AS link
MATCH (a:Site {id: link.from_site_id})
MATCH (b:Site {id: link.to_site_id})
MATCH (r:Road {id: link.road_id})
MERGE (a)-[e:CONNECTED_BY]->(b)
SET e.road_id = r.id,
    e.distance_km = r.distance_km,
    e.travel_minutes = r.travel_minutes,
    e.status = r.status,
    e.valid_from = link.valid_from,
    e.valid_to = link.valid_to,
    e.source_id = link.source_id
RETURN count(e) AS road_links_created;
```

### 4.3 Create hazards and source provenance

```cypher
MERGE (src:Source {id: $source_id})
SET src.provider = $provider,
    src.url = $source_url,
    src.source_type = $source_type,
    src.retrieved_at = $retrieved_at,
    src.content_hash = $content_hash,
    src.license = $license,
    src.reliability = $reliability,
    src.created_at = $now

MERGE (h:Hazard {id: $hazard_id})
SET h.kind = $hazard_kind,
    h.severity = $severity,
    h.status = 'ACTIVE',
    h.description = $description,
    h.observed_at = $observed_at,
    h.valid_from = $valid_from,
    h.valid_to = $valid_to,
    h.source_id = src.id,
    h.confidence = $confidence,
    h.synthetic = $synthetic,
    h.created_at = coalesce(h.created_at, $now),
    h.updated_at = $now

MERGE (src)-[:SUPPORTS]->(h)

UNWIND $affected_zone_ids AS zone_id
MATCH (z:Zone {id: zone_id})
MERGE (h)-[:AFFECTS {observed_at: $observed_at, source_id: src.id, confidence: $confidence}]->(z)
RETURN h.id AS hazard, collect(zone_id) AS affected_zones;
```

### 4.4 Create synthetic households, people, and needs

```cypher
UNWIND $households AS hdata
MERGE (h:Household {id: hdata.id})
SET h.size = hdata.size,
    h.language = hdata.language,
    h.mobility = hdata.mobility,
    h.vulnerability_class = hdata.vulnerability_class,
    h.privacy_class = 'SYNTHETIC',
    h.synthetic = true,
    h.created_at = coalesce(h.created_at, $now)

WITH collect(h) AS households
UNWIND $households AS hdata
MATCH (h:Household {id: hdata.id})
MATCH (z:Zone {id: hdata.zone_id})
MERGE (h)-[:LOCATED_IN {valid_from: $reference_time}]->(z)

UNWIND hdata.people AS pdata
MERGE (p:Person {id: pdata.id})
SET p.household_id = h.id,
    p.role = pdata.role,
    p.age_band = pdata.age_band,
    p.mobility = pdata.mobility,
    p.language = h.language,
    p.vulnerability_class = h.vulnerability_class,
    p.privacy_class = 'SYNTHETIC',
    p.synthetic = true,
    p.created_at = coalesce(p.created_at, $now)
MERGE (p)-[:MEMBER_OF]->(h)

WITH h, hdata
UNWIND hdata.needs AS ndata
MERGE (n:Need {id: ndata.id})
SET n.kind = ndata.kind,
    n.quantity = ndata.quantity,
    n.priority = ndata.priority,
    n.status = 'OPEN',
    n.valid_from = $reference_time,
    n.created_at = coalesce(n.created_at, $now)
MERGE (h)-[:HAS_NEED]->(n)
RETURN count(*) AS household_records_written;
```

### 4.5 Create shelters, resources, and assets

```cypher
UNWIND $shelters AS sdata
MERGE (s:Shelter {id: sdata.id})
SET s.name = sdata.name,
    s.capacity = sdata.capacity,
    s.occupied = sdata.occupied,
    s.accessible = sdata.accessible,
    s.services = sdata.services,
    s.status = sdata.status,
    s.latitude = sdata.latitude,
    s.longitude = sdata.longitude,
    s.created_at = coalesce(s.created_at, $now),
    s.updated_at = $now

WITH s, sdata
MATCH (z:Zone {id: sdata.zone_id})
MERGE (z)-[:HAS_SHELTER]->(s)
MERGE (s)-[:LOCATED_IN]->(z)

WITH s, sdata
UNWIND sdata.resources AS rdata
MERGE (r:Resource {id: rdata.id})
SET r.kind = rdata.kind,
    r.quantity = rdata.quantity,
    r.unit = rdata.unit,
    r.status = rdata.status,
    r.owner_id = rdata.owner_id,
    r.created_at = coalesce(r.created_at, $now),
    r.updated_at = $now
MERGE (s)-[:HAS_RESOURCE]->(r)
RETURN count(*) AS shelter_records_written;
```

Create agencies and authority:

```cypher
UNWIND $agencies AS adata
MERGE (a:Agency {id: adata.id})
SET a.name = adata.name,
    a.kind = adata.kind,
    a.jurisdiction = adata.jurisdiction,
    a.contact_channel = adata.contact_channel,
    a.created_at = coalesce(a.created_at, $now)

WITH a, adata
UNWIND adata.zone_ids AS zone_id
MATCH (z:Zone {id: zone_id})
MERGE (a)-[:HAS_AUTHORITY {valid_from: $reference_time, confidence: adata.confidence}]->(z)
RETURN count(*) AS authority_links_written;
```

### 4.6 Create historical capacity facts

```cypher
MATCH (s:Shelter {id: $shelter_id})
MERGE (f:Fact {id: $fact_id})
SET f.subject_id = s.id,
    f.predicate = 'available_cots',
    f.object_value = toString($available_cots),
    f.value_type = 'INTEGER',
    f.valid_from = $valid_from,
    f.valid_to = $valid_to,
    f.observed_at = $observed_at,
    f.confidence = $confidence,
    f.status = 'VALID',
    f.source_id = $source_id,
    f.created_at = coalesce(f.created_at, $now),
    f.updated_at = $now
MERGE (f)-[:ABOUT]->(s)
MATCH (src:Source {id: $source_id})
MERGE (f)-[:SUPPORTED_BY]->(e:Evidence {id: $evidence_id})
SET e.quote = $quote,
    e.source_span = $source_span,
    e.observed_at = $observed_at,
    e.confidence = $confidence,
    e.created_at = $now
MERGE (e)-[:FROM_SOURCE]->(src)
RETURN f, e;
```

---

## 5. Core operational queries

### 5.1 Current active hazards

```cypher
MATCH (i:Incident {id: $incident_id})-[:HAS_HAZARD]->(h:Hazard)-[:AFFECTS]->(z:Zone)
WHERE h.status = 'ACTIVE'
  AND (h.valid_from IS NULL OR h.valid_from <= $reference_time)
  AND (h.valid_to IS NULL OR h.valid_to > $reference_time)
RETURN h.id AS hazard_id,
       h.kind AS kind,
       h.severity AS severity,
       h.description AS description,
       h.observed_at AS observed_at,
       collect({zone_id: z.id, zone_name: z.name}) AS affected_zones
ORDER BY h.severity DESC, h.observed_at DESC;
```

### 5.2 Count needs by affected zone

```cypher
MATCH (h:Hazard {id: $hazard_id})-[:AFFECTS]->(z:Zone)
MATCH (hh:Household)-[:LOCATED_IN]->(z)
MATCH (hh)-[:HAS_NEED]->(n:Need)
WHERE n.status = 'OPEN'
  AND (n.valid_from IS NULL OR n.valid_from <= $reference_time)
  AND (n.valid_to IS NULL OR n.valid_to > $reference_time)
RETURN z.id AS zone_id,
       z.name AS zone_name,
       count(DISTINCT hh) AS households,
       count(n) AS open_needs,
       collect(DISTINCT n.kind) AS need_types,
       sum(n.quantity) AS total_requested_quantity
ORDER BY open_needs DESC;
```

### 5.3 Find shelters with available capacity

```cypher
MATCH (z:Zone)-[:HAS_SHELTER]->(s:Shelter)
WHERE s.status = 'OPEN'
  AND s.capacity > s.occupied
  AND s.capacity - s.occupied >= $minimum_spaces
  AND s.accessible = $accessible_required
RETURN z.id AS zone_id,
       s.id AS shelter_id,
       s.name AS shelter_name,
       s.capacity,
       s.occupied,
       s.capacity - s.occupied AS available_spaces,
       s.services
ORDER BY available_spaces DESC;
```

### 5.4 Match needs to shelter services

```cypher
MATCH (h:Hazard {id: $hazard_id})-[:AFFECTS]->(z:Zone)
MATCH (hh:Household)-[:LOCATED_IN]->(z)-[:HAS_SHELTER]->(s:Shelter)
MATCH (hh)-[:HAS_NEED]->(n:Need)
WHERE n.status = 'OPEN'
  AND s.status = 'OPEN'
  AND s.capacity - s.occupied >= $minimum_spaces
  AND any(service IN s.services WHERE service = n.kind)
RETURN z.id AS zone_id,
       s.id AS shelter_id,
       s.name AS shelter,
       collect(DISTINCT n.kind) AS matched_needs,
       count(DISTINCT hh) AS households,
       s.capacity - s.occupied AS available_spaces
ORDER BY households DESC, available_spaces DESC;
```

### 5.5 Check authority and controlled assets

```cypher
MATCH (z:Zone {id: $zone_id})
MATCH (a:Agency)-[auth:HAS_AUTHORITY]->(z)
MATCH (a)-[:CONTROLS]->(asset:Asset)
WHERE asset.status = 'AVAILABLE'
  AND (auth.valid_from IS NULL OR auth.valid_from <= $reference_time)
  AND (auth.valid_to IS NULL OR auth.valid_to > $reference_time)
  AND (asset.available_from IS NULL OR asset.available_from <= $reference_time)
  AND (asset.available_to IS NULL OR asset.available_to > $reference_time)
RETURN a.id AS agency_id,
       a.name AS agency,
       asset.id AS asset_id,
       asset.kind,
       asset.quantity,
       asset.status;
```

### 5.6 Candidate plan query: hazard to needs, shelters, authority, assets, and decisions

This is the main graph-native query for the planner. It returns candidates; it does not dispatch anything.

```cypher
MATCH (h:Hazard {id: $hazard_id})-[:AFFECTS]->(z:Zone)
MATCH (hh:Household)-[:LOCATED_IN]->(z)-[:HAS_SHELTER]->(s:Shelter)
MATCH (hh)-[:HAS_NEED]->(need:Need)
MATCH (a:Agency)-[auth:HAS_AUTHORITY]->(z)
MATCH (a)-[:CONTROLS]->(asset:Asset)
OPTIONAL MATCH (d:Decision)-[:FOR_ZONE]->(z)
WHERE h.status = 'ACTIVE'
  AND s.status = 'OPEN'
  AND s.capacity - s.occupied >= $minimum_spaces
  AND asset.status = 'AVAILABLE'
  AND (auth.valid_from IS NULL OR auth.valid_from <= $reference_time)
  AND (auth.valid_to IS NULL OR auth.valid_to > $reference_time)
  AND (d IS NULL OR d.status = 'APPROVED')
  AND (d IS NULL OR d.reference_time <= $reference_time)
WITH z, s, a, asset, d,
     count(DISTINCT hh) AS households,
     collect(DISTINCT need.kind) AS needs
RETURN z.id AS zone_id,
       z.name AS zone,
       s.id AS shelter_id,
       s.name AS shelter,
       s.capacity - s.occupied AS available_spaces,
       a.id AS agency_id,
       a.name AS agency,
       asset.id AS asset_id,
       asset.kind AS asset_kind,
       households,
       needs,
       d.id AS prior_decision_id
ORDER BY households DESC, available_spaces DESC
LIMIT $limit;
```

### 5.7 Produce an explainable evidence subgraph for a candidate

```cypher
MATCH p=(h:Hazard {id: $hazard_id})-[:AFFECTS]->(z:Zone)
      <-[:LOCATED_IN]-(hh:Household)-[:HAS_NEED]->(need:Need)
MATCH (z)-[:HAS_SHELTER]->(s:Shelter)
MATCH (a:Agency)-[:HAS_AUTHORITY]->(z)
MATCH (a)-[:CONTROLS]->(asset:Asset)
OPTIONAL MATCH (d:Decision)-[:FOR_ZONE]->(z)
OPTIONAL MATCH (f:Fact)-[:ABOUT]->(s)
OPTIONAL MATCH (f)-[:SUPPORTED_BY]->(e:Evidence)-[:FROM_SOURCE]->(src:Source)
WHERE h.id = $hazard_id
  AND s.id = $shelter_id
  AND f.valid_from <= $reference_time
  AND (f.valid_to IS NULL OR f.valid_to > $reference_time)
RETURN [n IN nodes(p) | {
         id: coalesce(n.id, ''),
         labels: labels(n),
         name: coalesce(n.name, n.kind, n.predicate, '')
       }] AS path_nodes,
       [r IN relationships(p) | {
         type: type(r),
         source_id: coalesce(r.source_id, ''),
         confidence: coalesce(r.confidence, 1.0)
       }] AS path_edges,
       collect(DISTINCT {
         fact_id: f.id,
         predicate: f.predicate,
         value: f.object_value,
         valid_from: f.valid_from,
         valid_to: f.valid_to,
         source_url: src.url,
         quote: e.quote
       }) AS evidence,
       d.id AS prior_decision_id;
```

---

## 6. Bi-temporal memory queries

### 6.1 Facts true at a reference time

```cypher
MATCH (f:Fact)-[:ABOUT]->(subject)
WHERE f.valid_from <= $reference_time
  AND (f.valid_to IS NULL OR f.valid_to > $reference_time)
  AND f.status = 'VALID'
RETURN f.id AS fact_id,
       subject.id AS subject_id,
       labels(subject) AS subject_labels,
       f.predicate,
       f.object_value,
       f.object_id,
       f.valid_from,
       f.valid_to,
       f.observed_at,
       f.confidence,
       f.source_id
ORDER BY f.valid_from DESC;
```

### 6.2 Current facts only

```cypher
MATCH (f:Fact)-[:ABOUT]->(subject)
WHERE f.status = 'VALID'
  AND f.invalidated_at IS NULL
  AND (f.valid_to IS NULL OR f.valid_to > $now)
RETURN f, subject
ORDER BY f.observed_at DESC;
```

### 6.3 What changed between two watch times

```cypher
MATCH (f:Fact)-[:ABOUT]->(subject)
WHERE f.valid_from <= $later_time
  AND (f.valid_to IS NULL OR f.valid_to > $earlier_time)
WITH f, subject,
     CASE
       WHEN f.valid_from > $earlier_time THEN 'NEW_AFTER_EARLIER_TIME'
       WHEN f.valid_to IS NOT NULL AND f.valid_to <= $later_time THEN 'EXPIRED_BY_LATER_TIME'
       ELSE 'PERSISTED'
     END AS change_kind
RETURN subject.id AS subject_id,
       labels(subject) AS subject_labels,
       f.predicate,
       f.object_value,
       f.valid_from,
       f.valid_to,
       change_kind
ORDER BY subject_id, f.predicate, f.valid_from;
```

### 6.4 Supersession chain

```cypher
MATCH (newer:Fact)-[:SUPERSEDES]->(older:Fact)
MATCH (newer)-[:ABOUT]->(subject)
WHERE newer.valid_from <= $reference_time
  AND (newer.valid_to IS NULL OR newer.valid_to > $reference_time)
RETURN subject.id AS subject_id,
       newer.predicate,
       newer.object_value AS current_value,
       newer.valid_from AS current_valid_from,
       older.object_value AS previous_value,
       older.valid_from AS previous_valid_from,
       older.valid_to AS previous_valid_to,
       older.id AS previous_fact_id
ORDER BY newer.valid_from DESC;
```

### 6.5 Insert a corrected fact and supersede the old fact

```cypher
MATCH (old:Fact {id: $old_fact_id})-[:ABOUT]->(subject)
CREATE (new:Fact {
  id: $new_fact_id,
  subject_id: subject.id,
  predicate: old.predicate,
  object_value: $new_value,
  value_type: old.value_type,
  valid_from: $new_valid_from,
  valid_to: $new_valid_to,
  observed_at: $observed_at,
  confidence: $new_confidence,
  status: 'VALID',
  source_id: $new_source_id,
  created_at: $now,
  updated_at: $now
})
CREATE (new)-[:ABOUT]->(subject)
CREATE (new)-[:SUPERSEDES]->(old)
SET old.valid_to = $new_valid_from,
    old.status = 'SUPERSEDED',
    old.updated_at = $now
RETURN new.id AS replacement_fact_id,
       old.id AS superseded_fact_id,
       subject.id AS subject_id;
```

### 6.6 Reconstruct the world at 14:00

```cypher
MATCH (f:Fact)-[:ABOUT]->(subject)
WHERE f.valid_from <= $reference_time
  AND (f.valid_to IS NULL OR f.valid_to > $reference_time)
  AND f.status IN ['VALID', 'SUPERSEDED']
RETURN subject.id AS subject_id,
       labels(subject) AS subject_labels,
       f.predicate,
       f.object_value,
       f.object_id,
       f.valid_from,
       f.valid_to,
       f.observed_at,
       f.status,
       f.source_id
ORDER BY subject_id, f.predicate, f.valid_from DESC;
```

### 6.7 Reconstruct current world state

```cypher
MATCH (f:Fact)-[:ABOUT]->(subject)
WHERE f.valid_from <= $now
  AND (f.valid_to IS NULL OR f.valid_to > $now)
  AND f.status = 'VALID'
RETURN subject.id AS subject_id,
       labels(subject) AS subject_labels,
       f.predicate,
       f.object_value,
       f.valid_from,
       f.observed_at,
       f.confidence,
       f.source_id
ORDER BY subject_id, f.predicate;
```

### 6.8 What did we believe then versus now?

```cypher
MATCH (then_fact:Fact)-[:ABOUT]->(then_subject)
WHERE then_fact.valid_from <= $then_time
  AND (then_fact.valid_to IS NULL OR then_fact.valid_to > $then_time)
WITH collect({
  subject_id: then_subject.id,
  predicate: then_fact.predicate,
  value: then_fact.object_value,
  valid_from: then_fact.valid_from,
  valid_to: then_fact.valid_to,
  fact_id: then_fact.id
}) AS then_state

MATCH (now_fact:Fact)-[:ABOUT]->(now_subject)
WHERE now_fact.valid_from <= $now_time
  AND (now_fact.valid_to IS NULL OR now_fact.valid_to > $now_time)
WITH then_state,
     collect({
       subject_id: now_subject.id,
       predicate: now_fact.predicate,
       value: now_fact.object_value,
       valid_from: now_fact.valid_from,
       valid_to: now_fact.valid_to,
       fact_id: now_fact.id
     }) AS now_state
RETURN then_state, now_state;
```

---

## 7. Episodes, failed attempts, and open-loop queries

### 7.1 Record an episode

```cypher
MATCH (s:Session {id: $session_id})
MATCH (a:Agent {id: $agent_id})
CREATE (e:Episode {
  id: $episode_id,
  kind: $episode_kind,
  text: $text,
  occurred_at: $occurred_at,
  recorded_at: $now,
  author_agent_id: a.id,
  session_id: s.id,
  source_id: $source_id,
  importance: $importance,
  synthetic: $synthetic,
  created_at: $now
})
CREATE (s)-[:RECORDED]->(e)
CREATE (a)-[:RECORDED]->(e)
RETURN e.id AS episode_id;
```

### 7.2 Record a failed attempt so the next agent does not repeat it

```cypher
MATCH (e:Episode {id: $episode_id})
MATCH (o:OpenLoop {id: $open_loop_id})
CREATE (fa:FailedAttempt {
  id: $failed_attempt_id,
  action_kind: $action_kind,
  target_id: $target_id,
  reason: $reason,
  attempted_at: $attempted_at,
  source_id: $source_id,
  created_at: $now
})
CREATE (e)-[:RECORDED_ATTEMPT]->(fa)
CREATE (fa)-[:ABOUT]->(o)
RETURN fa, o;
```

### 7.3 Find open loops without an owner

```cypher
MATCH (o:OpenLoop)
WHERE o.status IN ['OPEN', 'BLOCKED', 'ESCALATED']
  AND NOT (o)<-[:OWNS]-(:Agent)
RETURN o.id AS open_loop_id,
       o.title,
       o.description,
       o.priority,
       o.status,
       o.due_at
ORDER BY o.priority DESC, o.due_at ASC;
```

### 7.4 Find overdue open loops

```cypher
MATCH (o:OpenLoop)
WHERE o.status IN ['OPEN', 'BLOCKED', 'ESCALATED']
  AND o.due_at IS NOT NULL
  AND o.due_at < $now
OPTIONAL MATCH (a:Agent)-[:OWNS]->(o)
RETURN o.id AS open_loop_id,
       o.title,
       o.status,
       o.due_at,
       collect(a.id) AS owners
ORDER BY o.due_at ASC;
```

### 7.5 Find open loops blocked by constraints

```cypher
MATCH (o:OpenLoop)-[:BLOCKED_BY]->(c:Constraint)
WHERE o.status IN ['OPEN', 'BLOCKED', 'ESCALATED']
  AND c.blocking = true
  AND c.valid_from <= $reference_time
  AND (c.valid_to IS NULL OR c.valid_to > $reference_time)
RETURN o.id AS open_loop_id,
       o.title,
       o.description,
       c.id AS constraint_id,
       c.kind,
       c.expression,
       c.threshold,
       c.valid_from,
       c.valid_to
ORDER BY o.priority DESC;
```

### 7.6 Find previously failed actions for a target

```cypher
MATCH (fa:FailedAttempt)-[:TARGETS]->(target)
WHERE target.id = $target_id
OPTIONAL MATCH (fa)-[:ABOUT]->(o:OpenLoop)
RETURN fa.id AS failed_attempt_id,
       fa.action_kind,
       fa.reason,
       fa.attempted_at,
       o.id AS open_loop_id,
       o.title
ORDER BY fa.attempted_at DESC;
```

### 7.7 Assign an open loop atomically

```cypher
MATCH (o:OpenLoop {id: $open_loop_id})
MATCH (a:Agent {id: $agent_id})
OPTIONAL MATCH (previous:Agent)-[old_rel:OWNS]->(o)
DELETE old_rel
CREATE (a)-[:OWNS {assigned_at: $now, assigned_by: $assigned_by}]->(o)
SET o.status = 'ASSIGNED',
    o.updated_at = $now
RETURN o.id AS open_loop_id,
       o.status,
       a.id AS assigned_agent_id;
```

### 7.8 Close an open loop with an outcome

```cypher
MATCH (o:OpenLoop {id: $open_loop_id})
MATCH (s:Session {id: $session_id})
MATCH (a:Agent {id: $agent_id})
CREATE (out:Outcome {
  id: $outcome_id,
  status: $outcome_status,
  metric_name: $metric_name,
  metric_value: $metric_value,
  observed_at: $observed_at,
  notes: $notes,
  created_at: $now
})
CREATE (o)-[:RESOLVED_BY]->(out)
CREATE (e:Episode {
  id: $episode_id,
  kind: 'OPEN_LOOP_CLOSED',
  text: $episode_text,
  occurred_at: $observed_at,
  recorded_at: $now,
  author_agent_id: a.id,
  session_id: s.id,
  importance: 0.8,
  synthetic: $synthetic,
  created_at: $now
})
CREATE (s)-[:RECORDED]->(e)
CREATE (a)-[:RECORDED]->(e)
CREATE (e)-[:RECORDED_OUTCOME]->(out)
SET o.status = 'CLOSED',
    o.updated_at = $now
RETURN o, out, e;
```

---

## 8. Shift handoff and multi-agent coordination queries

### 8.1 Create a session

```cypher
MATCH (w:Watch {id: $watch_id})
MATCH (a:Agent {id: $agent_id})
CREATE (s:Session {
  id: $session_id,
  agent_id: a.id,
  watch_id: w.id,
  started_at: $started_at,
  status: 'ACTIVE',
  last_reference_time: $reference_time,
  created_at: $now
})
CREATE (w)-[:HAS_SESSION]->(s)
CREATE (s)-[:RUN_BY]->(a)
RETURN s;
```

### 8.2 Create a handoff package

```cypher
MATCH (from:Agent {id: $from_agent_id})
MATCH (to:Agent {id: $to_agent_id})
MATCH (w:Watch {id: $watch_id})
CREATE (h:Handoff {
  id: $handoff_id,
  from_agent_id: from.id,
  to_agent_id: to.id,
  created_at: $now,
  reference_time: $reference_time,
  status: 'PENDING_REVIEW',
  summary: $summary,
  checklist_json: $checklist_json
})
CREATE (w)-[:HAS_HANDOFF]->(h)
CREATE (h)-[:FROM_AGENT]->(from)
CREATE (h)-[:TO_AGENT]->(to)
WITH h
UNWIND $open_loop_ids AS open_loop_id
MATCH (o:OpenLoop {id: open_loop_id})
CREATE (h)-[:TRANSFERS]->(o)
RETURN h.id AS handoff_id, count(o) AS transferred_open_loops;
```

### 8.3 Incoming agent: retrieve handoff context

```cypher
MATCH (h:Handoff {id: $handoff_id})-[:TRANSFERS]->(o:OpenLoop)
OPTIONAL MATCH (owner:Agent)-[:OWNS]->(o)
OPTIONAL MATCH (fa:FailedAttempt)-[:ABOUT]->(o)
OPTIONAL MATCH (fa)-[:TARGETS]->(target)
RETURN h.id AS handoff_id,
       h.summary,
       h.reference_time,
       o.id AS open_loop_id,
       o.title,
       o.description,
       o.priority,
       o.status,
       o.due_at,
       collect(DISTINCT {
         owner: owner.id,
         failed_action: fa.action_kind,
         failed_reason: fa.reason,
         failed_target: target.id,
         attempted_at: fa.attempted_at
       }) AS history
ORDER BY o.priority DESC, o.due_at ASC;
```

### 8.4 Complete a handoff

```cypher
MATCH (h:Handoff {id: $handoff_id})
MATCH (to:Agent {id: $to_agent_id})
SET h.status = 'ACCEPTED',
    h.accepted_at = $now,
    h.accepted_by = to.id
RETURN h;
```

### 8.5 Kill outgoing agent and continue with incoming agent

```cypher
MATCH (out:Agent {id: $outgoing_agent_id})
MATCH (inc:Agent {id: $incoming_agent_id})
MATCH (s:Session {id: $outgoing_session_id})
SET out.status = 'OFFLINE',
    s.status = 'INTERRUPTED',
    s.ended_at = $now

WITH inc
MATCH (h:Handoff {id: $handoff_id})
SET h.status = 'ACCEPTED',
    h.accepted_at = $now,
    h.accepted_by = inc.id
RETURN inc.id AS surviving_agent,
       h.id AS accepted_handoff;
```

### 8.6 Complete shift state: facts, decisions, loops, failed attempts

```cypher
MATCH (w:Watch {id: $watch_id})
OPTIONAL MATCH (w)-[:HAS_SESSION]->(s:Session)-[:RECORDED]->(e:Episode)
OPTIONAL MATCH (w)-[:HAS_HANDOFF]->(h:Handoff)-[:TRANSFERS]->(o:OpenLoop)
OPTIONAL MATCH (owner:Agent)-[:OWNS]->(o)
OPTIONAL MATCH (fa:FailedAttempt)-[:ABOUT]->(o)
WHERE (o IS NULL OR o.status IN ['OPEN', 'ASSIGNED', 'BLOCKED', 'ESCALATED'])
RETURN w.id AS watch_id,
       collect(DISTINCT {
         session_id: s.id,
         session_status: s.status,
         latest_episode: e.text,
         episode_time: e.occurred_at
       }) AS recent_sessions,
       collect(DISTINCT {
         handoff_id: h.id,
         open_loop_id: o.id,
         title: o.title,
         status: o.status,
         owner: owner.id,
         last_failed_attempt: fa.reason
       }) AS open_loops;
```

---

## 9. Planner and reviewer queries

### 9.1 Start a decision trace

```cypher
MATCH (s:Session {id: $session_id})
MATCH (planner:Agent {id: $planner_agent_id})
CREATE (dt:DecisionTrace {
  id: $trace_id,
  question: $question,
  reference_time: $reference_time,
  started_at: $now,
  status: 'RUNNING',
  planner_agent_id: planner.id,
  assumptions_json: $assumptions_json,
  created_at: $now
})
CREATE (s)-[:RECORDED_TRACE]->(dt)
RETURN dt;
```

### 9.2 Create a proposed decision

```cypher
MATCH (dt:DecisionTrace {id: $trace_id})
MATCH (i:Incident {id: $incident_id})
MATCH (z:Zone {id: $zone_id})
MATCH (planner:Agent {id: $planner_agent_id})
CREATE (d:Decision {
  id: $decision_id,
  action_kind: $action_kind,
  status: 'PROPOSED',
  rationale: $rationale,
  reference_time: $reference_time,
  proposed_at: $now,
  confidence: $confidence,
  created_by: planner.id,
  created_at: $now,
  updated_at: $now
})
CREATE (dt)-[:PROPOSED]->(d)
CREATE (d)-[:FOR_INCIDENT]->(i)
CREATE (d)-[:FOR_ZONE]->(z)
CREATE (planner)-[:MADE]->(d)
RETURN d;
```

### 9.3 Attach facts and evidence to a decision

```cypher
MATCH (d:Decision {id: $decision_id})
UNWIND $fact_ids AS fact_id
MATCH (f:Fact {id: fact_id})
CREATE (d)-[:USES_FACT]->(f)

WITH d
UNWIND $evidence_ids AS evidence_id
MATCH (e:Evidence {id: evidence_id})
CREATE (d)-[:SUPPORTED_BY]->(e)
RETURN d.id AS decision_id,
       count(*) AS attached_support_records;
```

### 9.4 Reviewer query: stale facts, conflicts, and missing evidence

```cypher
MATCH (d:Decision {id: $decision_id})
OPTIONAL MATCH (d)-[:USES_FACT]->(f:Fact)
OPTIONAL MATCH (f)-[:ABOUT]->(subject)
OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(e:Evidence)-[:FROM_SOURCE]->(src:Source)
OPTIONAL MATCH (newer:Fact)-[:SUPERSEDES]->(f)
OPTIONAL MATCH (d)-[:BLOCKED_BY]->(c:Constraint)
WITH d,
     collect(DISTINCT {
       fact_id: f.id,
       subject_id: subject.id,
       predicate: f.predicate,
       value: f.object_value,
       valid_to: f.valid_to,
       confidence: f.confidence,
       superseded: newer.id IS NOT NULL
     }) AS facts,
     collect(DISTINCT {
       evidence_id: e.id,
       source_url: src.url,
       quote: e.quote,
       confidence: e.confidence
     }) AS evidence,
     collect(DISTINCT {
       constraint_id: c.id,
       kind: c.kind,
       blocking: c.blocking,
       valid_to: c.valid_to
     }) AS constraints
RETURN d.id AS decision_id,
       d.status,
       d.rationale,
       facts,
       evidence,
       constraints,
       CASE
         WHEN size(evidence) = 0 THEN 'ABSTAIN_NO_EVIDENCE'
         WHEN any(x IN facts WHERE x.superseded = true) THEN 'REVIEW_SUPERSEDED_FACT'
         WHEN any(x IN facts WHERE x.valid_to IS NOT NULL AND x.valid_to <= d.reference_time) THEN 'REVIEW_EXPIRED_FACT'
         WHEN any(x IN constraints WHERE x.blocking = true) THEN 'BLOCKED_BY_CONSTRAINT'
         ELSE 'READY_FOR_HUMAN_REVIEW'
       END AS review_state;
```

### 9.5 Assign reviewer and request human approval

```cypher
MATCH (d:Decision {id: $decision_id})
MATCH (reviewer:Agent {id: $reviewer_agent_id})
MATCH (human:Human {id: $human_approver_id})
SET d.status = 'IN_REVIEW',
    d.updated_at = $now
CREATE (reviewer)-[:REVIEWED {started_at: $now}]->(d)
CREATE (d)-[:REQUIRES_APPROVAL_FROM]->(human)
RETURN d.id AS decision_id,
       d.status,
       reviewer.id AS reviewer_id,
       human.id AS approver_id;
```

### 9.6 Approve a decision

```cypher
MATCH (d:Decision {id: $decision_id})
MATCH (h:Human {id: $human_id})
WHERE d.status = 'IN_REVIEW'
  AND (d)-[:REQUIRES_APPROVAL_FROM]->(h)
SET d.status = 'APPROVED',
    d.approved_at = $now,
    d.approved_by = h.id,
    d.updated_at = $now
RETURN d;
```

### 9.7 Reject a decision with a reason

```cypher
MATCH (d:Decision {id: $decision_id})
MATCH (h:Human {id: $human_id})
WHERE d.status = 'IN_REVIEW'
  AND (d)-[:REQUIRES_APPROVAL_FROM]->(h)
SET d.status = 'REJECTED',
    d.rejected_at = $now,
    d.rejected_by = h.id,
    d.rejection_reason = $reason,
    d.updated_at = $now
CREATE (e:Episode {
  id: $episode_id,
  kind: 'DECISION_REJECTED',
  text: $episode_text,
  occurred_at: $now,
  recorded_at: $now,
  author_agent_id: $agent_id,
  importance: 0.8,
  created_at: $now
})
CREATE (e)-[:RECORDED_DECISION]->(d)
RETURN d, e;
```

### 9.8 Find approved decisions that may now be invalid

```cypher
MATCH (d:Decision {status: 'APPROVED'})
OPTIONAL MATCH (d)-[:USES_FACT]->(f:Fact)
OPTIONAL MATCH (d)-[:BLOCKED_BY]->(c:Constraint)
WHERE (f.valid_to IS NOT NULL AND f.valid_to <= $now)
   OR (c.blocking = true AND c.valid_from <= $now AND (c.valid_to IS NULL OR c.valid_to > $now))
RETURN d.id AS decision_id,
       d.action_kind,
       d.rationale,
       collect(DISTINCT {
         fact_id: f.id,
         expired_at: f.valid_to,
         predicate: f.predicate
       }) AS expired_facts,
       collect(DISTINCT {
         constraint_id: c.id,
         kind: c.kind,
         expression: c.expression
       }) AS active_constraints;
```

---

## 10. Routing and graph-algorithm queries

FalkorDB exposes graph algorithms through `CALL algo.<name>()`. The exact procedures and argument names must be checked against the installed version. [6]

### 10.1 Basic Cypher path for a small demo

```cypher
MATCH p=(source:Site {id: $source_site_id})
      -[:CONNECTED_BY*1..8]->
      (target:Site {id: $target_site_id})
WHERE all(r IN relationships(p) WHERE r.status = 'OPEN')
RETURN [n IN nodes(p) | n.id] AS site_path,
       reduce(total = 0, r IN relationships(p) | total + r.travel_minutes) AS total_minutes,
       length(p) AS hops
ORDER BY total_minutes ASC, hops ASC
LIMIT 3;
```

### 10.2 FalkorDB `algo.SPpaths` for a weighted route

The official syntax uses `sourceNode`, `targetNode`, `relTypes`, `weightProp`, optional `costProp`, `maxCost`, `maxLen`, `relDirection`, and `pathCount`. [7]

```cypher
MATCH (source:Site {id: $source_site_id}),
      (target:Site {id: $target_site_id})
CALL algo.SPpaths({
  sourceNode: source,
  targetNode: target,
  relTypes: ['CONNECTED_BY'],
  weightProp: 'distance_km',
  costProp: 'travel_minutes',
  maxCost: $maximum_travel_minutes,
  maxLen: 12,
  relDirection: 'outgoing',
  pathCount: 3
})
YIELD path, pathWeight, pathCost
RETURN pathWeight AS distance_km,
       pathCost AS travel_minutes,
       [n IN nodes(path) | n.id] AS route_nodes,
       [r IN relationships(path) | {
         status: r.status,
         travel_minutes: r.travel_minutes,
         source_id: r.source_id
       }] AS route_edges
ORDER BY travel_minutes ASC
LIMIT 3;
```

If this procedure is unavailable or the graph is small, use the Cypher path query above as a fallback.

### 10.3 Reachability from an affected zone

```cypher
MATCH (start:Site {id: $start_site_id})
CALL algo.BFS(start, {
  relTypes: ['CONNECTED_BY'],
  direction: 'OUTGOING',
  maxLevel: 8
})
YIELD node, level
MATCH (s:Shelter {id: node.id})
WHERE s.status = 'OPEN'
  AND s.capacity - s.occupied >= $minimum_spaces
RETURN s.id AS shelter_id,
       s.name,
       level AS hops,
       s.capacity - s.occupied AS available_spaces
ORDER BY hops ASC, available_spaces DESC;
```

Check the installed version’s BFS argument names before use; the official algorithm catalogue confirms BFS availability but individual procedure pages define the exact signature. [6]

### 10.4 Capacity-aware candidate ranking without MaxFlow

For a 72-hour MVP, a transparent deterministic ranking is safer than pretending to solve a complete evacuation optimization problem.

```cypher
MATCH (h:Hazard {id: $hazard_id})-[:AFFECTS]->(z:Zone)
MATCH (hh:Household)-[:LOCATED_IN]->(z)-[:HAS_SHELTER]->(s:Shelter)
MATCH (hh)-[:HAS_NEED]->(n:Need)
WHERE s.status = 'OPEN'
WITH s,
     count(DISTINCT hh) AS exposed_households,
     sum(n.quantity) AS requested_quantity
WITH s,
     exposed_households,
     requested_quantity,
     s.capacity - s.occupied AS available_spaces,
     CASE
       WHEN s.capacity - s.occupied >= requested_quantity THEN 1.0
       ELSE toFloat(s.capacity - s.occupied) / requested_quantity
     END AS capacity_coverage
RETURN s.id AS shelter_id,
       s.name,
       exposed_households,
       requested_quantity,
       available_spaces,
       capacity_coverage,
       (capacity_coverage * 0.6) +
       (CASE WHEN s.accessible THEN 0.4 ELSE 0.0 END) AS plan_score
ORDER BY plan_score DESC, available_spaces DESC;
```

### 10.5 Optional MaxFlow formulation

MaxFlow requires a carefully modeled directed capacity network. Do not use it until the demo has a small, validated flow graph. The official algorithm catalogue exposes MaxFlow through `CALL algo.*`. [6]

Recommended modeling:

```text
SourceNode -[:FLOW_EDGE {capacity, cost}]-> ZoneNode
ZoneNode   -[:FLOW_EDGE {capacity, cost}]-> ShelterNode
ShelterNode-[:FLOW_EDGE {capacity, cost}]-> NeedSink
```

Use the exact MaxFlow procedure signature from the pinned FalkorDB release. For the hackathon, showing a capacity-aware ranking plus an explainable path is lower risk than relying on an untested optimization procedure.

---

## 11. Memory retrieval queries

### 11.1 Recent episodes for a watch

```cypher
MATCH (w:Watch {id: $watch_id})-[:HAS_SESSION]->(s:Session)-[:RECORDED]->(e:Episode)
WHERE e.occurred_at >= $since_time
RETURN e.id AS episode_id,
       e.kind,
       e.text,
       e.occurred_at,
       e.recorded_at,
       e.author_agent_id,
       e.importance,
       e.source_id
ORDER BY e.occurred_at DESC
LIMIT $limit;
```

### 11.2 Search episodic memory by keywords

```cypher
CALL db.idx.fulltext.queryNodes('Episode', $search_text)
YIELD node, score
RETURN node.id AS episode_id,
       node.kind,
       node.text,
       node.occurred_at,
       node.recorded_at,
       score
ORDER BY score DESC, node.occurred_at DESC
LIMIT $limit;
```

### 11.3 Search semantic memory, then expand graph context

```cypher
CALL db.idx.vector.queryNodes(
  'Episode',
  'embedding',
  $candidate_count,
  vecf32($query_embedding)
)
YIELD node, score
MATCH (node)-[:MENTIONS]->(f:Fact)-[:ABOUT]->(subject)
WHERE f.valid_from <= $reference_time
  AND (f.valid_to IS NULL OR f.valid_to > $reference_time)
OPTIONAL MATCH (f)-[:SUPPORTED_BY]->(e:Evidence)-[:FROM_SOURCE]->(src:Source)
RETURN node.id AS episode_id,
       node.text,
       score,
       collect(DISTINCT {
         fact_id: f.id,
         subject_id: subject.id,
         predicate: f.predicate,
         value: f.object_value,
         valid_from: f.valid_from,
         valid_to: f.valid_to,
         source_url: src.url,
         quote: e.quote
       }) AS grounded_facts
ORDER BY score ASC
LIMIT $limit;
```

### 11.4 Find what was tried and failed for an overflow problem

```cypher
MATCH (fa:FailedAttempt)-[:ABOUT]->(o:OpenLoop)
WHERE toLower(o.title) CONTAINS toLower($topic)
   OR toLower(o.description) CONTAINS toLower($topic)
OPTIONAL MATCH (fa)-[:TARGETS]->(target)
OPTIONAL MATCH (fa)-[:RECORDED_IN]->(e:Episode)
RETURN o.id AS open_loop_id,
       o.title,
       fa.action_kind,
       fa.target_id,
       target.name AS target_name,
       fa.reason,
       fa.attempted_at,
       e.id AS episode_id
ORDER BY fa.attempted_at DESC;
```

### 11.5 Retrieve similar precedent decisions

```cypher
MATCH (d:Decision)-[:FOR_INCIDENT]->(i:Incident)
WHERE d.status IN ['APPROVED', 'REJECTED']
  AND d.action_kind = $action_kind
OPTIONAL MATCH (d)-[:LED_TO]->(o:Outcome)
OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(e:Evidence)-[:FROM_SOURCE]->(src:Source)
RETURN d.id AS decision_id,
       i.kind AS incident_kind,
       d.rationale,
       d.reference_time,
       d.status,
       collect(DISTINCT {
         outcome_status: o.status,
         metric_name: o.metric_name,
         metric_value: o.metric_value
       }) AS outcomes,
       collect(DISTINCT src.url) AS sources
ORDER BY d.reference_time DESC
LIMIT $limit;
```

---

## 12. Provenance and explainability queries

### 12.1 Return sources for a decision

```cypher
MATCH (d:Decision {id: $decision_id})-[:SUPPORTED_BY]->(e:Evidence)-[:FROM_SOURCE]->(src:Source)
RETURN d.id AS decision_id,
       e.id AS evidence_id,
       e.quote,
       e.source_span,
       e.observed_at,
       e.confidence,
       src.provider,
       src.url,
       src.retrieved_at,
       src.content_hash,
       src.license;
```

### 12.2 Detect unsupported decisions

```cypher
MATCH (d:Decision)
WHERE d.status IN ['PROPOSED', 'IN_REVIEW', 'APPROVED']
OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(e:Evidence)
WITH d, count(e) AS evidence_count
WHERE evidence_count = 0
RETURN d.id AS unsupported_decision_id,
       d.status,
       d.action_kind,
       d.rationale,
       d.reference_time;
```

### 12.3 Detect stale sources

```cypher
MATCH (d:Decision)-[:SUPPORTED_BY]->(e:Evidence)-[:FROM_SOURCE]->(src:Source)
WHERE src.retrieved_at < $freshness_cutoff
RETURN d.id AS decision_id,
       src.id AS source_id,
       src.url,
       src.retrieved_at,
       duration.between(src.retrieved_at, $now) AS source_age;
```

If the selected FalkorDB version does not support the exact duration expression, compute age in the application and filter on an indexed numeric timestamp instead.

### 12.4 Full evidence path for UI rendering

```cypher
MATCH p=(d:Decision {id: $decision_id})-[:FOR_ZONE]->(z:Zone)
OPTIONAL MATCH (d)-[:USES_FACT]->(f:Fact)-[:ABOUT]->(subject)
OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(e:Evidence)-[:FROM_SOURCE]->(src:Source)
RETURN {
  decision: {
    id: d.id,
    status: d.status,
    action_kind: d.action_kind,
    rationale: d.rationale,
    reference_time: d.reference_time,
    confidence: d.confidence
  },
  zone: {
    id: z.id,
    name: z.name
  },
  facts: collect(DISTINCT {
    id: f.id,
    subject_id: subject.id,
    predicate: f.predicate,
    value: f.object_value,
    valid_from: f.valid_from,
    valid_to: f.valid_to
  }),
  evidence: collect(DISTINCT {
    id: e.id,
    quote: e.quote,
    source_url: src.url,
    observed_at: e.observed_at,
    confidence: e.confidence
  })
} AS decision_packet;
```

---

## 13. Data-quality and safety queries

### 13.1 Find facts without provenance

```cypher
MATCH (f:Fact)
WHERE f.source_id IS NULL
   OR NOT (f)-[:SUPPORTED_BY]->(:Evidence)
RETURN f.id AS fact_id,
       f.subject_id,
       f.predicate,
       f.object_value,
       f.valid_from,
       f.confidence;
```

### 13.2 Find contradictory current facts

```cypher
MATCH (a:Fact)-[:ABOUT]->(subject)
MATCH (b:Fact)-[:ABOUT]->(subject)
WHERE a.id < b.id
  AND a.predicate = b.predicate
  AND a.valid_from <= $reference_time
  AND (a.valid_to IS NULL OR a.valid_to > $reference_time)
  AND b.valid_from <= $reference_time
  AND (b.valid_to IS NULL OR b.valid_to > $reference_time)
  AND a.object_value <> b.object_value
RETURN subject.id AS subject_id,
       a.predicate,
       a.id AS fact_a,
       a.object_value AS value_a,
       b.id AS fact_b,
       b.object_value AS value_b,
       a.confidence AS confidence_a,
       b.confidence AS confidence_b;
```

### 13.3 Find inaccessible or unavailable shelters selected by approved decisions

```cypher
MATCH (d:Decision {status: 'APPROVED'})-[:FOR_ZONE]->(z:Zone)
MATCH (d)-[:USES_FACT]->(f:Fact)-[:ABOUT]->(s:Shelter)
WHERE s.status <> 'OPEN'
   OR s.accessible = false
   OR s.capacity - s.occupied < $minimum_spaces
RETURN d.id AS decision_id,
       s.id AS shelter_id,
       s.name,
       s.status,
       s.accessible,
       s.capacity - s.occupied AS available_spaces,
       f.valid_from,
       f.valid_to;
```

### 13.4 Find synthetic records accidentally mixed with non-synthetic data

```cypher
MATCH (h:Household)
WHERE h.synthetic <> true
RETURN h.id AS household_id,
       h.privacy_class,
       h.synthetic;

MATCH (p:Person)
WHERE p.synthetic <> true
RETURN p.id AS person_id,
       p.privacy_class,
       p.synthetic;
```

### 13.5 Find decisions without human approval

```cypher
MATCH (d:Decision)
WHERE d.status = 'APPROVED'
  AND d.approved_by IS NULL
RETURN d.id AS decision_id,
       d.action_kind,
       d.approved_at,
       d.created_by;
```

---

## 14. Reset and demo-control queries

### 14.1 Reset operational state while preserving schema

Use only for a local demo graph.

```cypher
MATCH (d:Decision)
WHERE d.status IN ['PROPOSED', 'IN_REVIEW', 'APPROVED', 'REJECTED']
DETACH DELETE d;

MATCH (dt:DecisionTrace)
DETACH DELETE dt;

MATCH (h:Handoff)
DETACH DELETE h;

MATCH (e:Episode)
DETACH DELETE e;

MATCH (o:OpenLoop)
SET o.status = 'OPEN',
    o.updated_at = $now;

MATCH (a:Agent)-[r:OWNS]->(:OpenLoop)
DELETE r;
```

### 14.2 Simulate a road closure

```cypher
MATCH (r:Road {id: $road_id})
SET r.status = 'CLOSED',
    r.closed_at = $now,
    r.closed_reason = $reason,
    r.updated_at = $now

WITH r
MATCH (a:Site)-[link:CONNECTED_BY]->(b:Site)
WHERE link.road_id = r.id
SET link.status = 'CLOSED',
    link.closed_at = $now,
    link.closed_reason = $reason

CREATE (e:Episode {
  id: $episode_id,
  kind: 'ROAD_CLOSURE',
  text: $episode_text,
  occurred_at: $now,
  recorded_at: $now,
  author_agent_id: $agent_id,
  importance: 0.95,
  synthetic: true,
  created_at: $now
})
RETURN r.id AS closed_road_id, e.id AS episode_id;
```

### 14.3 Simulate shelter capacity change

```cypher
MATCH (s:Shelter {id: $shelter_id})
WITH s, s.occupied AS old_occupied
SET s.occupied = $new_occupied,
    s.updated_at = $now

CREATE (f:Fact {
  id: $fact_id,
  subject_id: s.id,
  predicate: 'available_cots',
  object_value: toString(s.capacity - s.occupied),
  value_type: 'INTEGER',
  valid_from: $now,
  valid_to: NULL,
  observed_at: $now,
  confidence: $confidence,
  status: 'VALID',
  source_id: $source_id,
  created_at: $now,
  updated_at: $now
})
CREATE (f)-[:ABOUT]->(s)
RETURN s.id AS shelter_id,
       old_occupied,
       s.occupied AS new_occupied,
       s.capacity - s.occupied AS available_cots,
       f.id AS fact_id;
```

### 14.4 Create the hackathon demo open loop

```cypher
MATCH (s:Shelter {id: $shelter_id})
CREATE (o:OpenLoop {
  id: $open_loop_id,
  title: 'Resolve west-side overflow shelter',
  description: $description,
  priority: 5,
  status: 'OPEN',
  due_at: $due_at,
  created_at: $now,
  updated_at: $now
})
CREATE (o)-[:DEPENDS_ON]->(s)
RETURN o;
```

---

## 15. Recommended agent workflow

### Outgoing Watch

1. Ingest new hazard and radio/feed observations.
2. Create or supersede `Fact` nodes.
3. Update shelter, road, and asset state.
4. Record failed attempts and open loops.
5. Run the handoff summary query.
6. Create a `Handoff` node and transfer unresolved loops.

### Incoming Watch

1. Accept the handoff.
2. Query current facts and the 14:00 snapshot.
3. Compare changed capacity, roads, authorities, and decisions.
4. Retrieve failed attempts so it does not repeat dead ends.
5. Assign unowned open loops.
6. Ask the planner agent for a new candidate plan.

### Planner

1. Start `DecisionTrace`.
2. Run the candidate-plan query.
3. Run route and capacity checks.
4. Attach facts and evidence.
5. Create a `Decision` with status `PROPOSED`.
6. Return the path, assumptions, confidence, and abstention state.

### Reviewer

1. Check temporal validity.
2. Check source freshness and provenance.
3. Check active constraints and authority.
4. Check for contradictions and superseded facts.
5. Check that no previous failed attempt is being repeated.
6. Move the decision to `IN_REVIEW` or mark it blocked.

### Human approver

1. Review the decision packet.
2. Approve or reject.
3. The system records the decision and later outcome.
4. No external dispatch or public notification occurs automatically in the MVP.

### Coordinator

1. Owns shared state transitions.
2. Assigns open loops.
3. Records handoff acceptance.
4. Writes outcome data.
5. Promotes successful decisions into reusable procedures or precedents.

---

## 16. Suggested 30-second demo sequence

1. Show the 14:00 graph: flood zone, Shelter A, 42 available cots, and an open road.
2. Ask: “Which shelter can receive the west-side households, and what did the previous watch try?”
3. The agent returns Shelter A, the route, source evidence, and a prior failed attempt.
4. Inject a 16:30 road-closure episode and a new shelter-capacity fact.
5. Ask the same question at 18:00.
6. The temporal query rejects the expired route and old capacity fact.
7. The planner proposes Shelter B.
8. The reviewer identifies one missing authority confirmation.
9. The human approves only after that issue is resolved.
10. Kill the outgoing agent and let the incoming agent continue from the handoff graph.

The winning visual is not the map. It is the **before/after graph state plus the cited reason the plan changed**.

---

## 17. MVP scope and non-goals

### Build in 72 hours

- One fictional county or city.
- One flood or wildfire event.
- 3–5 zones.
- 4–8 shelters.
- 10–20 synthetic households.
- 3 agencies.
- 10–20 roads/sites.
- 20–50 episodes and facts.
- Two watch sessions.
- Planner and reviewer agents.
- One incoming/outgoing handoff.
- One road-closure update.
- One capacity update.
- One human approval flow.
- One simple graph/path UI.

### Do not build

- Real emergency dispatch.
- Real patient or shelter-resident data.
- Nationwide optimization.
- Autonomous evacuation orders.
- Production-grade GIS.
- Full MaxFlow optimization unless it is already validated.
- Unbounded natural-language-to-Cypher generation.
- A generic document chatbot that treats the graph as decoration.

---

## 18. Validation checklist

Before submitting:

- [ ] FalkorDB is the primary graph database.
- [ ] The demo cannot produce its core answer without graph traversal.
- [ ] Every decision returns node/edge IDs and source evidence.
- [ ] The 14:00 and current states differ visibly.
- [ ] Superseded facts remain queryable.
- [ ] Open loops without owners are detected.
- [ ] Failed attempts are shown to the next agent.
- [ ] Handoffs survive outgoing-agent failure.
- [ ] Planner and reviewer write to shared graph state.
- [ ] Human approval is required before an action is considered approved.
- [ ] All people and households are synthetic.
- [ ] Public-source snapshots have URLs, timestamps, hashes, and licenses.
- [ ] Every query is tested against the pinned FalkorDB version.
- [ ] Neo4j-only syntax is not assumed.
- [ ] The README includes the exact graph name, seed commands, query parameters, and reset procedure.
- [ ] The demo works offline from cached fixtures.

---

## References

[1]: https://docs.falkordb.com/cypher "FalkorDB Cypher Query Language Reference"

[2]: https://docs.falkordb.com/cypher/indexing/range-index "FalkorDB Range Indexing"

[3]: https://docs.falkordb.com/cypher/indexing/fulltext-index "FalkorDB Full-Text Indexing"

[4]: https://docs.falkordb.com/design/concurrency "FalkorDB Atomicity and Concurrency Control"

[5]: https://docs.falkordb.com/cypher/indexing/vector-index "FalkorDB Vector Indexing"

[6]: https://docs.falkordb.com/algorithms "FalkorDB Graph Algorithms"

[7]: https://docs.falkordb.com/algorithms/sppath "FalkorDB Shortest Paths with algo.SPpaths"

