import { FalkorDB } from 'falkordb';

async function benchmark(host: string, iterations: number) {
  const client = await FalkorDB.connect({ url: `redis://${host}:6379` });
  const graph = client.selectGraph("watchchange_benchmark");
  
  await graph.query("MATCH (n) DETACH DELETE n");
  
  const latencies = [];
  
  for (let i = 0; i < 10; i++) {
    await graph.query("RETURN 1");
  }
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await graph.query("RETURN 1");
    latencies.push(performance.now() - start);
  }
  
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const max = sorted[sorted.length - 1];
  const slowQueries = latencies.filter(l => l > 50).length;
  
  const paddedHost = host.padEnd(12, ' ');
  console.log(`${paddedHost} | ${p50.toFixed(2).padStart(6, ' ')}ms | ${p95.toFixed(2).padStart(6, ' ')}ms | ${max.toFixed(2).padStart(6, ' ')}ms | ${slowQueries.toString().padStart(5, ' ')}`);
  
  await client.close();
}

async function run() {
  console.log(`Host         | p50      | p95      | max      | >50ms`);
  console.log(`-------------|----------|----------|----------|-------`);
  await benchmark("localhost", 1000);
  await benchmark("127.0.0.1", 1000);
  await benchmark("localhost", 1000);
  await benchmark("127.0.0.1", 1000);
}

run().catch(console.error);
