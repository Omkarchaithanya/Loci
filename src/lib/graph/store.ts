import { FalkorDB } from 'falkordb';

export interface GraphStore {
  query(cypher: string, params?: Record<string, any>): Promise<any>;
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

  async query(cypher: string, params: Record<string, any> = {}) {
    return await this.graph.query(cypher, { params });
  }

  async close() {
    await this.client.close();
  }
}

let defaultStore: GraphStore | null = null;

export async function getGraphStore(): Promise<GraphStore> {
  if (!defaultStore) {
    const url = process.env.FALKORDB_URL || "redis://127.0.0.1:6379";
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
  }
  return defaultStore;
}
