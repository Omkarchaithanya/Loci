# Deployment

## This host

TanStack Start on the Grok app-builder / Vercel runtime. Preview binds `0.0.0.0:8080` via `npm run dev` and `startup.sh`. Production is the published HTTPS origin.

There is no FalkorDB sidecar here. The in-process kernel is the running graph. Do not describe this preview as a managed FalkorDB cluster.

## Local FalkorDB

```text
docker compose up -d
# image: falkordb/falkordb:v4.20.4
# load schema.cypher then seed against watchchange_flood_demo
```

Set `FALKORDB_URL` when swapping the adapter. Until then the kernel is source of truth.

## Health

`GET /api/health` — graph name, node count, readiness.

`GET /api/plan?t=14` — 14:00 plan.
`GET /api/plan?t=18&auth=1` — 18:00 plan with Parks authority.

## Rollback

Redeploy the previous commit. Reset the demo from the rail (re-seeds 14:00). Compose: `docker compose down` does not delete `falkor-data` unless volumes are removed.

## Backup

Kernel: the seed is in git. FalkorDB volume: snapshot `falkor-data`. Restore by replacing the volume and replaying seed if empty.
