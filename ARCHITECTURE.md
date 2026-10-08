# Architecture

```
Mission control UI
    → typed query catalog (OpenCypher + kernel)
    → property graph (watchchange_flood_demo)
    → planner / reviewer / coordinator (pure functions)
    → human approval write-back
```

## Topology

- **Frontend:** TanStack Start, React 19, Tailwind v4. Mission-control surface.
- **Graph:** Live FalkorDB instance via `falkordb/falkordb:v4.20.4` (Docker) or FalkorDB Cloud (`FALKORDB_URL`). The in-process kernel is strictly isolated to CI/unit tests (`DEV_KERNEL=1`).
- **Agents:** Deterministic graph functions. Optional xAI brief is user-initiated and may not invent facts.
- **Persistence:** Demo flags are session state. The seed is idempotent code. Compose volume `falkor-data` is the durable FalkorDB path.

## Data flow

1. Ingestor writes typed nodes + `Fact` + `Evidence` + `Source`.
2. Outgoing watch records episodes, failed attempts, open loops, handoff.
3. Incoming watch reconstructs `t=14:00` and `t=now`, diffs supersession.
4. Planner: hazard → zone → need → shelter → route → authority → asset.
5. Reviewer: evidence, temporal validity, failed attempts, route, capacity, authority.
6. Human: `APPROVED` or `REJECTED`. Coordinator writes `Outcome`.

## Failure modes

| Failure | Behavior |
| --- | --- |
| Missing evidence | `ABSTAINED` |
| Closed route / low capacity / failed attempt | `BLOCKED` |
| Missing destination authority | `BLOCKED_NO_AUTHORITY` |
| xAI unavailable | Deterministic graph brief |
| Kernel empty | `/api/health` reports not ready |

## Trust boundary

The browser cannot send Cypher. Mutations are named demo actions. All people/households are synthetic.
