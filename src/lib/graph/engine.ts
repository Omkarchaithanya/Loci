import type { GraphNode, GraphRel, GraphSnapshot, Props } from "./types.ts";

function cloneProps(props: Props): Props {
  const out: Props = {};
  for (const [k, v] of Object.entries(props)) {
    out[k] = Array.isArray(v) ? [...v] : v;
  }
  return out;
}

export class PropertyGraph {
  name: string;
  private nodes = new Map<string, GraphNode>();
  private rels = new Map<string, GraphRel>();
  private outIndex = new Map<string, string[]>();
  private inIndex = new Map<string, string[]>();
  private labelIndex = new Map<string, Set<string>>();
  private nextRel = 1;

  constructor(name: string) {
    this.name = name;
  }

  clone(): PropertyGraph {
    const g = PropertyGraph.restore(this.snapshot());
    return g;
  }

  snapshot(): GraphSnapshot {
    return {
      name: this.name,
      nodes: [...this.nodes.values()].map((n) => ({
        id: n.id,
        labels: [...n.labels],
        props: cloneProps(n.props),
      })),
      rels: [...this.rels.values()].map((r) => ({
        id: r.id,
        type: r.type,
        from: r.from,
        to: r.to,
        props: cloneProps(r.props),
      })),
      nextRel: this.nextRel,
    };
  }

  static restore(data: GraphSnapshot): PropertyGraph {
    const g = new PropertyGraph(data.name);
    g.nextRel = data.nextRel;
    for (const n of data.nodes) {
      g.nodes.set(n.id, { id: n.id, labels: [...n.labels], props: cloneProps(n.props) });
      for (const label of n.labels) {
        let set = g.labelIndex.get(label);
        if (!set) {
          set = new Set();
          g.labelIndex.set(label, set);
        }
        set.add(n.id);
      }
    }
    for (const r of data.rels) {
      g.rels.set(r.id, { ...r, props: cloneProps(r.props) });
      g.indexRel(r);
    }
    return g;
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  relCount(): number {
    return this.rels.size;
  }

  get(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  must(id: string): GraphNode {
    const n = this.nodes.get(id);
    if (!n) throw new Error(`Missing node ${id}`);
    return n;
  }

  mergeNode(labels: string[], id: string, props: Props): GraphNode {
    const existing = this.nodes.get(id);
    if (existing) {
      for (const label of labels) {
        if (!existing.labels.includes(label)) {
          existing.labels.push(label);
          let set = this.labelIndex.get(label);
          if (!set) {
            set = new Set();
            this.labelIndex.set(label, set);
          }
          set.add(id);
        }
      }
      Object.assign(existing.props, props);
      return existing;
    }
    const node: GraphNode = { id, labels: [...labels], props: { ...props } };
    this.nodes.set(id, node);
    for (const label of labels) {
      let set = this.labelIndex.get(label);
      if (!set) {
        set = new Set();
        this.labelIndex.set(label, set);
      }
      set.add(id);
    }
    return node;
  }

  setProps(id: string, props: Props): void {
    const n = this.must(id);
    Object.assign(n.props, props);
  }

  mergeRel(type: string, from: string, to: string, props: Props = {}, id?: string): GraphRel {
    if (id) {
      const existing = this.rels.get(id);
      if (existing) {
        existing.type = type;
        existing.from = from;
        existing.to = to;
        Object.assign(existing.props, props);
        return existing;
      }
    } else {
      for (const relId of this.outIndex.get(from) ?? []) {
        const rel = this.rels.get(relId);
        if (rel && rel.type === type && rel.to === to) {
          Object.assign(rel.props, props);
          return rel;
        }
      }
    }
    const rel: GraphRel = {
      id: id ?? `rel_${this.nextRel++}`,
      type,
      from,
      to,
      props: { ...props },
    };
    this.rels.set(rel.id, rel);
    this.indexRel(rel);
    return rel;
  }

  deleteRel(id: string): void {
    const rel = this.rels.get(id);
    if (!rel) return;
    this.rels.delete(id);
    this.outIndex.set(rel.from, (this.outIndex.get(rel.from) ?? []).filter((x) => x !== id));
    this.inIndex.set(rel.to, (this.inIndex.get(rel.to) ?? []).filter((x) => x !== id));
  }

  nodesByLabel(label: string): GraphNode[] {
    const ids = this.labelIndex.get(label);
    if (!ids) return [];
    return [...ids].map((id) => this.must(id));
  }

  out(id: string, type?: string): GraphRel[] {
    return (this.outIndex.get(id) ?? [])
      .map((rid) => this.rels.get(rid)!)
      .filter((r) => (type ? r.type === type : true));
  }

  in(id: string, type?: string): GraphRel[] {
    return (this.inIndex.get(id) ?? [])
      .map((rid) => this.rels.get(rid)!)
      .filter((r) => (type ? r.type === type : true));
  }

  neighbors(id: string, type?: string, direction: "out" | "in" | "both" = "out"): GraphNode[] {
    const rels: GraphRel[] = [];
    if (direction === "out" || direction === "both") rels.push(...this.out(id, type));
    if (direction === "in" || direction === "both") rels.push(...this.in(id, type));
    const seen = new Set<string>();
    const nodes: GraphNode[] = [];
    for (const rel of rels) {
      const nid = rel.from === id ? rel.to : rel.from;
      if (seen.has(nid)) continue;
      seen.add(nid);
      const n = this.nodes.get(nid);
      if (n) nodes.push(n);
    }
    return nodes;
  }

  hasRel(from: string, type: string, to: string): boolean {
    return this.out(from, type).some((r) => r.to === to);
  }

  /**
   * Weighted BFS over CONNECTED_BY (or any rel type) honoring a status predicate.
   * Returns the lowest travel_minutes path, or null if unreachable.
   */
  shortestPath(
    sourceId: string,
    targetId: string,
    relType: string,
    opts: {
      maxHops?: number;
      edgeOk?: (rel: GraphRel) => boolean;
      weightKey?: string;
    } = {},
  ): { nodeIds: string[]; relIds: string[]; minutes: number } | null {
    if (sourceId === targetId) return { nodeIds: [sourceId], relIds: [], minutes: 0 };
    const maxHops = opts.maxHops ?? 8;
    const edgeOk = opts.edgeOk ?? (() => true);
    const weightKey = opts.weightKey ?? "travel_minutes";

    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; rel: string }>();
    const queue: string[] = [sourceId];
    dist.set(sourceId, 0);
    const hops = new Map<string, number>([[sourceId, 0]]);

    while (queue.length) {
      const cur = queue.shift()!;
      const curHops = hops.get(cur) ?? 0;
      if (curHops >= maxHops) continue;
      for (const rel of this.out(cur, relType)) {
        if (!edgeOk(rel)) continue;
        const w = Number(rel.props[weightKey] ?? 1);
        const nextCost = (dist.get(cur) ?? 0) + (Number.isFinite(w) ? w : 1);
        const existing = dist.get(rel.to);
        if (existing !== undefined && existing <= nextCost) continue;
        dist.set(rel.to, nextCost);
        prev.set(rel.to, { node: cur, rel: rel.id });
        hops.set(rel.to, curHops + 1);
        queue.push(rel.to);
      }
    }

    if (!dist.has(targetId)) return null;
    const nodeIds: string[] = [];
    const relIds: string[] = [];
    let walk: string | undefined = targetId;
    while (walk && walk !== sourceId) {
      nodeIds.push(walk);
      const step = prev.get(walk);
      if (!step) break;
      relIds.push(step.rel);
      walk = step.node;
    }
    nodeIds.push(sourceId);
    nodeIds.reverse();
    relIds.reverse();
    return { nodeIds, relIds, minutes: dist.get(targetId) ?? 0 };
  }

  private indexRel(rel: GraphRel): void {
    const outs = this.outIndex.get(rel.from) ?? [];
    outs.push(rel.id);
    this.outIndex.set(rel.from, outs);
    const ins = this.inIndex.get(rel.to) ?? [];
    ins.push(rel.id);
    this.inIndex.set(rel.to, ins);
  }
}
