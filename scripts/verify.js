#!/usr/bin/env node
// AccessBridge pre-flight verification script

const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tests = [
  { name: 'Simplifier', cmd: 'node scripts/test-simplify.js' },
  { name: 'AI simplifier fallback', cmd: 'node scripts/test-ai-simplify.js' },
  { name: 'Image describer', cmd: 'node scripts/test-describe.js' },
  { name: 'Acronym lookup', cmd: 'node scripts/test-acronym.js "assistive technology"' },
  { name: 'MCP tools list', cmd: 'node scripts/list-tools.js' },
];

let failed = 0;

console.log('AccessBridge Verification\n');

for (const test of tests) {
  try {
    const output = execSync(test.cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    const success = output.includes('found: true') || output.includes('Image Alt Text Test') || output.includes('Plain Language Test') || output.includes('lookup_accessibility_term');
    console.log(`✓ ${test.name}: OK`);
    if (!success) {
      console.log(output);
    }
  } catch (err) {
    failed++;
    console.error(`✗ ${test.name}: FAILED`);
    console.error(err.stderr || err.message);
  }
}

console.log('\n---');
if (failed === 0) {
  console.log('All AccessBridge checks passed. Ready for Slack testing.');
  process.exit(0);
} else {
  console.log(`${failed} check(s) failed. Fix the issues above before testing in Slack.`);
  process.exit(1);
}
