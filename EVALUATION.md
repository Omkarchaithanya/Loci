# Evaluation

## Graph centrality

`candidatePlans()` walks hazard → zone → household/need → shelter → CONNECTED_BY → HAS_AUTHORITY → asset. Kernel tests: 14:00 → `shelter_riverside`; after 16:30 closure → `shelter_civic`. Without that traversal there is no recommendation.

## Agent coordination

Handoff node transfers `ol_west_overflow`. Failed attempt `fa_north_school` is visible to Incoming after Outgoing is OFFLINE. Assignment writes `[:OWNS]`.

## Explainability

Every proposal carries `graph_path`, `fact_ids`, `evidence_ids`, assumptions, confidence, blockers, and `requires_human_approval: true`.

## Adaptation

16:30 supersession changes the 18:00 plan. 14:00 reconstruction still returns 42 cots.

## Safety

Reviewer blocks missing Parks authority. Human must approve. Synthetic-demo badge is always visible.

## Feasibility

One county, one flood, one handoff. Bounded on purpose so the demo is reproducible offline from fixtures.
