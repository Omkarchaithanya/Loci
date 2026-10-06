# Demo script (2–3 minutes)

Say this out loud. Drive the numbered rail at the top of the app.

1. **14:00.** “Cedar County flood. Synthetic demo. FalkorDB-shaped graph `watchchange_flood_demo`.” Show Overview: 42 cots at Riverside High, West Connector implied open.
2. **Planner.** Run traversal. “Shelter A is selected because the path hazard → West Basin → need → Riverside High → West Connector is OPEN, with radio evidence.” Point at node IDs.
3. **Inject 16:30.** “We do not overwrite. We supersede.” Open What changed: cots 42 → 8, connector OPEN → CLOSED. Both old facts still reconstruct at 14:00.
4. **18:00 incoming.** Accept handoff. Kill outgoing. Assign the unowned loop. Show the North School failed attempt.
5. **Planner again.** “Civic Arena is the live path. North School is excluded. Shelter A is blocked on the closed road and capacity.”
6. **Reviewer.** “Blocked: no Parks authority on Civic District.”
7. **Confirm Parks authority.** Reviewer goes `READY_FOR_HUMAN_REVIEW`.
8. **Approve.** “Only now is the decision APPROVED. This is simulation, not dispatch.” Record outcome.

**Line to land:** “At 14:00 Shelter A was correct. At 18:00 it is not. The graph, not the model, changed the plan.”
