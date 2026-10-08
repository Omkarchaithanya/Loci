import { FalkorDB } from 'falkordb';

export interface GraphStore {
  query(cypher: string, params?: Record<string, any>): Promise<any>;
  roQuery(cypher: string, params?: Record<string, any>): Promise<any>;
  close(): Promise<void>;
  name: string;
}

export class FalkorDBStore implements GraphStore {
  private client: FalkorDB;
  private graph: any;
  public name: string;


  private constructor(client: FalkorDB, graphName: string) {
    this.client = client;
    this.name = graphName;
    this.graph = this.client.selectGraph(graphName);
  }

  static async connect(url: string, graphName: string): Promise<FalkorDBStore> {
    const client = await FalkorDB.connect({ url });
    return new FalkorDBStore(client, graphName);
  }

  private injectTiming(res: any, totalTimeMs: number) {
    let serverTimeMs = 0;
    if (res.metadata) {
      for (const m of res.metadata) {
        if (typeof m === 'string' && m.includes('internal execution time')) {
          const match = m.match(/([0-9.]+) milliseconds/);
          if (match) serverTimeMs = parseFloat(match[1]);
        }
      }
    }
    res.totalTimeMs = totalTimeMs;
    res.serverTimeMs = serverTimeMs;
    return res;
  }

  async query(cypher: string, params: Record<string, any> = {}) {
    const start = performance.now();
    const res = await this.graph.query(cypher, { params });
    const totalTimeMs = performance.now() - start;
    console.log(`[FalkorDB query] total=${totalTimeMs.toFixed(2)}ms | cypher=${cypher.replace(/\n/g, ' ').substring(0, 80)}...`);
    return this.injectTiming(res, totalTimeMs);
  }

  async roQuery(cypher: string, params: Record<string, any> = {}) {
    const start = performance.now();
    const res = await this.graph.roQuery(cypher, { params });
    const totalTimeMs = performance.now() - start;
    console.log(`[FalkorDB roQuery] total=${totalTimeMs.toFixed(2)}ms | cypher=${cypher.replace(/\n/g, ' ').substring(0, 80)}...`);
    return this.injectTiming(res, totalTimeMs);
  }

  async close() {
    await this.client.close();
  }
}

let defaultStore: GraphStore | null = null;

export async function getGraphStore(): Promise<GraphStore> {
  if (!defaultStore) {
    if (process.env.DEV_KERNEL === "1") {
      const { FalkorEngine } = await import("./engine.ts");
      defaultStore = new FalkorEngine();
      return defaultStore;
    }

    const url = process.env.FALKORDB_URL;
    if (!url) {
      throw new Error("NOT_CONNECTED");
    }

    const graphName = process.env.FALKORDB_GRAPH || "watchchange_flood_demo";
    defaultStore = await FalkorDBStore.connect(url, graphName);
    
    // Apply schema on connection
    try {
      const fs = (await import('fs/promises')).default;
      const path = (await import('path')).default;
      const schema = await fs.readFile(path.join(process.cwd(), 'schema.cypher'), 'utf-8');
      for (const statement of schema.split(';')) {
        if (statement.trim()) {
          try {
            await defaultStore.query(statement);
          } catch (e) {
            // Index might already exist
          }
        }
      }
    } catch (e) {
      console.warn("Could not apply schema:", e);
    }

    // Warm-up query set
    try {
      await defaultStore.roQuery("MATCH (n) RETURN count(n) as count LIMIT 1");
      await defaultStore.roQuery("MATCH (h:Hazard) RETURN h LIMIT 1");
    } catch (e) {
      console.warn("Warmup queries failed:", e);
    }
  }
  return defaultStore;
}
