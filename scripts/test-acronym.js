require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { AccessibilityMcpClient } = require('../src/mcpClient');

const term = process.argv[2] || 'WCAG';

(async () => {
  const client = new AccessibilityMcpClient();
  try {
    await client.connect();
    const result = await client.lookup(term);
    console.log(`Lookup for "${term}":`);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
})();
