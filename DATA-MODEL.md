# Data model

Graph name: `watchchange_flood_demo`.

## Labels

Tenant, Incident, Watch, Session, Agent, Human, Hazard, Zone, Road, Site, Constraint, Household, Person, Need, Shelter, Resource, Asset, Agency, Source, Evidence, Episode, Fact, OpenLoop, FailedAttempt, DecisionTrace, Decision, Handoff, Outcome.

## Temporal fields

- **Valid time:** `valid_from`, `valid_to` (NULL = still valid). Interval is closed-open.
- **Observation time:** `observed_at`, `created_at`, `updated_at`.

Never overwrite an operational fact. Create a replacement, close `valid_to`, add `[:SUPERSEDES]`.

## Key relationships

```
Hazard -[:AFFECTS]-> Zone
Household -[:LOCATED_IN]-> Zone
Household -[:HAS_NEED]-> Need
Zone -[:HAS_SHELTER]-> Shelter
Site -[:CONNECTED_BY {road_id, status, travel_minutes}]-> Site
Agency -[:HAS_AUTHORITY]-> Zone
Agency -[:CONTROLS]-> Asset
Fact -[:ABOUT]-> subject
Fact -[:SUPERSEDES]-> Fact
Fact -[:SUPPORTED_BY]-> Evidence
Evidence -[:FROM_SOURCE]-> Source
FailedAttempt -[:TARGETS]-> Shelter
Handoff -[:TRANSFERS]-> OpenLoop
Decision -[:USES_FACT]-> Fact
Decision -[:REQUIRES_APPROVAL_FROM]-> Human
```

## Seed snapshot (14:00)

- Hazard `hazard_river_rise` affects `zone_west_basin`.
- Six synthetic households, 24 shelter places requested.
- `shelter_riverside` 42 cots, West Connector OPEN.
- `shelter_civic` 100 cots, North Civic OPEN.
- `shelter_north_school` not accessible; failed attempt recorded.
- Open loop `ol_west_overflow` unowned.
- Parks authority on Civic District is **absent** until a human confirms it.

## 16:30 mutation

- `fact_road_west_1630` SUPERSEDES `fact_road_west_1400` (OPEN → CLOSED).
- `fact_shelter_a_cots_1630` SUPERSEDES `fact_shelter_a_cots_1400` (42 → 8).
