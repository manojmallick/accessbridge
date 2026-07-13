#!/usr/bin/env node
// MCP stdio server for accessibility knowledge base

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const kb = require('../data/accessibility-kb.json');

function lookupTerm(term) {
  const key = Object.keys(kb).find((k) => k.toLowerCase() === (term || '').toLowerCase().trim());
  if (!key) {
    return {
      term: term,
      found: false,
      simple: `No plain-language definition found for "${term}" in the accessibility knowledge base.`,
    };
  }
  return { ...kb[key], found: true };
}

const server = new McpServer({
  name: 'accessbridge-accessibility-kb',
  version: '1.0.0',
});

server.registerTool(
  'lookup_accessibility_term',
  {
    description: 'Look up a plain-language definition of an accessibility or disability-related term.',
    inputSchema: {
      term: z.string().describe('The term to look up'),
    },
  },
  async ({ term }) => {
    const result = lookupTerm(term);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
