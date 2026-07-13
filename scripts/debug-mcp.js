require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

(async () => {
  const command = 'node';
  const args = [require('path').resolve(__dirname, '../scripts/mock-accessibility-mcp.js')];
  console.log('Command:', command);
  console.log('Args:', args);

  const transport = new StdioClientTransport({ command, args });
  const client = new Client({ name: 'accessbridge-debug', version: '1.0.0' });

  try {
    await client.connect(transport);
    console.log('Connected');

    const tools = await client.listTools();
    console.log('Tools:', JSON.stringify(tools, null, 2));

    const result = await client.callTool({
      name: 'lookup_accessibility_term',
      arguments: { term: 'WCAG' },
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await transport.close();
  }
})();
