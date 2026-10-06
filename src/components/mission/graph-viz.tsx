import type { GraphPathNode } from "@/lib/agents/contract.ts";
import { cn } from "@/lib/utils";

const ROLE_FILL: Record<string, string> = {
  hazard: "var(--color-hazard)",
  "affected-zone": "var(--color-cyan)",
  household: "var(--color-fg)",
  need: "var(--color-amber)",
  shelter: "var(--color-ok)",
  "shelter-zone": "var(--color-cyan)",
  site: "var(--color-muted)",
  road: "var(--color-amber)",
  agency: "var(--color-cyan)",
  asset: "var(--color-ok)",
};

export function EvidencePath({
  nodes,
  className,
}: {
  nodes: GraphPathNode[];
  className?: string;
}) {
  if (!nodes.length) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        Run the planner to materialize a graph path.
      </p>
    );
  }
  return (
    <ol className={cn("flex flex-wrap items-stretch gap-2", className)}>
      {nodes.map((n, i) => (
        <li key={`${n.id}-${i}`} className="flex items-center gap-2">
          <div className="min-w-0 rounded-md bg-inset px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{n.role}</p>
            <p className="truncate text-sm text-fg">{n.name}</p>
            <p className="truncate font-mono text-[11px] text-cyan">{n.id}</p>
          </div>
          {i < nodes.length - 1 ? (
            <span className="text-cyan" aria-hidden>
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function PathCanvas({ nodes }: { nodes: GraphPathNode[] }) {
  const w = 720;
  const h = 280;
  const shown = nodes.slice(0, 10);
  const cx = (i: number) => 70 + (i % 5) * 140;
  const cy = (i: number) => (i < 5 ? 80 : 200);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Evidence path graph">
      {shown.map((n, i) => {
        if (i === 0) return null;
        const prev = i - 1;
        return (
          <line
            key={`e-${n.id}-${i}`}
            x1={cx(prev)}
            y1={cy(prev)}
            x2={cx(i)}
            y2={cy(i)}
            stroke="var(--color-cyan)"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
        );
      })}
      {shown.map((n, i) => (
        <g key={n.id + i}>
          <circle cx={cx(i)} cy={cy(i)} r="18" fill={ROLE_FILL[n.role] ?? "var(--color-fg)"} fillOpacity="0.18" stroke={ROLE_FILL[n.role] ?? "var(--color-fg)"} strokeWidth="1.5" />
          <text x={cx(i)} y={cy(i) + 36} textAnchor="middle" fill="var(--color-fg)" fontSize="11">
            {n.name.length > 18 ? `${n.name.slice(0, 16)}…` : n.name}
          </text>
          <text x={cx(i)} y={cy(i) + 50} textAnchor="middle" fill="var(--color-muted)" fontSize="9" fontFamily="var(--font-mono)">
            {n.id}
          </text>
        </g>
      ))}
    </svg>
  );
}
