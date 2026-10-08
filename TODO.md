# TODO — Loci

Outcome-based tasks. A task is done only with a passing test or a rendered, verified UI state.

## Foundation

- [x] Inspect workspace, freeze stack (TanStack Start, auth off, in-process Falkor kernel + FalkorDB v4.20.4 compose).
- [x] Property graph kernel: nodes, edges, label index, path BFS, clone, serialize.
- [x] Idempotent 14:00 Cedar County flood seed with synthetic households.
- [x] Bi-temporal Fact create / supersede / reconstruct / diff.

## Graph-native intelligence

- [x] Candidate plan query: hazard → zone → need → shelter → open route → authority → asset.
- [x] 14:00 plan selects Riverside High (Shelter A) with evidence path.
- [x] 16:30 inject closes West Connector and supersedes capacity 42 → 8.
- [x] 18:00 plan rejects Shelter A, skips failed North School, proposes Civic Arena.
- [x] Unowned open loop detected; assignment persists in the graph.
- [x] Reviewer blocks Civic Arena until Parks authority is confirmed.
- [x] Human approval required before status APPROVED; outcome written back.

## Mission control UI

- [x] Overview, temporal before/after, handoff, planner, human review, graph explorer.
- [x] Demo rail: 14:00 → inject 16:30 → 18:00 → plan → confirm authority → approve.
- [x] Synthetic-demo badge, loading/empty/error, mobile 390px usable.
- [x] `/manus-routes.json` and `/api/health` with graph readiness.

## Validation and packaging

- [x] Kernel tests prove the winning demo without UI.
- [x] `npm run typecheck` and `npm run build` pass.
- [x] Browser smoke (desktop + mobile) shows content, no console errors.
- [x] README, ARCHITECTURE, DATA-MODEL, AGENT-WORKFLOWS, DEMO-SCRIPT, EVALUATION, SECURITY, DEPLOYMENT.
