# WatchChange Mesh — Implementation Plan

## Product goal

WatchChange Mesh is a human-approved disaster-coordination decision-support system. It reconstructs what was true at a previous watch, compares it with the current world, and proposes a reviewable shelter/route plan grounded in a typed graph path and source evidence.

Primary track: **Agent Memory and Coordination**. Secondary: **Agents That Act on Connected Data**.

## Current-state assessment

This workspace is a TanStack Start app-builder sandbox (React 19, Tailwind v4, Vercel). There is no prior Flask MVP here. FalkorDB cannot run as a sidecar on this host, so the product ships a **Falkor-compatible in-process property graph kernel** that executes the same OpenCypher catalog used against pinned `falkordb/falkordb:v4.20.4`. Connecting `FALKORDB_URL` is the documented production swap; the demo never fakes a recommendation with LLM text.

## Hosting architecture

- Public HTTPS app on the Grok/Vercel app-builder runtime.
- Preview contract: `0.0.0.0:8080` via `npm run dev`.
- Graph kernel runs isomorphic (client + server) so the winning demo is deterministic and offline-capable from cached fixtures.
- Optional xAI (`grok-4.5`) writes an operational brief from the graph packet only — never as the source of facts.
- Local/self-hosted path: Docker Compose with pinned FalkorDB + the same Cypher seed.

## Graph persistence

- Canonical graph name: `watchchange_flood_demo`.
- Baseline seed is code (`src/lib/graph/seed.ts`) and Cypher (`schema.cypher`).
- Demo mutations (16:30 change, handoff, assignment, proposal, approval) are a replay log in localStorage so each reviewer can reset independently.
- Important facts are never overwritten: replacement `Fact` + `valid_to` close + `[:SUPERSEDES]`.

## Temporal semantics

- **Valid time:** `valid_from` / `valid_to` (NULL = still valid).
- **Observation time:** `observed_at` / `created_at` / `updated_at`.
- Point-in-time reconstruction uses closed-open intervals: `valid_from <= t AND (valid_to IS NULL OR valid_to > t)`.

## Agent workflow

```
Ingestor → Outgoing Watch → Handoff → Incoming Watch
  → Change detection → Planner → Reviewer → Human approval → Coordinator → Outcome
```

Planner is a multi-hop traversal (hazard → zone → need → shelter → route → authority → asset). Reviewer is constraint-based. Neither may mark a decision `APPROVED`.

## Winning demo

| Time | World | Plan |
| --- | --- | --- |
| 14:00 | West Connector open, Riverside High 42 cots | Shelter A |
| 16:30 | Connector closed, Riverside High 8 cots | facts superseded, not overwritten |
| 18:00 | Incoming watch + failed North School attempt | Civic Arena, needs Parks authority + human approval |

## Security and privacy

- Synthetic households only, labeled in the UI.
- No arbitrary Cypher from the browser.
- No real dispatch.
- Decision support language only: Proposed / Needs review / Approved by human.

## Design

Mission-control editorial: dark graphite, electric cyan (connectivity), amber (review), red (hazards/closures), green (approved). IBM Plex Sans + IBM Plex Mono. Wordmark: watch-ring + graph nodes.
