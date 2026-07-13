require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { AccessibilityMcpClient } = require('../src/mcpClient');

(async () => {
  const client = new AccessibilityMcpClient();
  try {
    await client.connect();
    const tools = await client.client.listTools();
    console.log('[Tools]', JSON.stringify(tools, null, 2));
  } catch (err) {
    console.error('Failed to list tools:', err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
})();
