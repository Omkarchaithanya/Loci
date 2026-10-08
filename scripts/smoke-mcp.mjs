import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

console.log('Running MCP smoke test...');

const server = spawn('node', ['--experimental-strip-types', 'src/mcp/server.ts'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let responseCount = 0;
let outputData = '';

server.stdout.on('data', (data) => {
  outputData += data.toString();
  try {
    // Try to parse full JSON-RPC lines
    const lines = outputData.split('\n');
    while (lines.length > 1) {
      const line = lines.shift();
      if (!line) continue;
      
      const res = JSON.parse(line);
      console.log('Received:', res);
      
      if (res.id === 1) {
        assert.ok(res.result.tools.length >= 4, 'Should list at least 4 tools');
        const names = res.result.tools.map((t) => t.name);
        assert.ok(names.includes('get_facts_at_time'));
        assert.ok(names.includes('get_failed_attempts'));
        assert.ok(names.includes('plan_shelter_transfer'));
        assert.ok(names.includes('approve_decision'));
        console.log('✅ ListTools passed');
        
        // Test approve_decision dry run
        server.stdin.write(JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "approve_decision",
            arguments: { plan_id: "test_plan", status: "APPROVED" }
          }
        }) + '\n');
      } else if (res.id === 2) {
        assert.ok(res.result.content[0].text.includes('Dry-run'));
        console.log('✅ CallTool dry-run passed');
        server.kill();
        process.exit(0);
      }
    }
    outputData = lines.join('\n');
  } catch (e) {
    // Incomplete JSON
  }
});

// Test ListTools
server.stdin.write(JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
}) + '\n');

setTimeout(() => {
  console.error("Timeout!");
  server.kill();
  process.exit(1);
}, 5000);
