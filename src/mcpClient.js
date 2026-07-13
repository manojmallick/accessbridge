const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

function resolveArg(arg) {
  if (typeof arg !== 'string') return arg;
  if (arg.startsWith('/')) return arg;
  if (arg.startsWith('node') || arg.startsWith('npx')) return arg;
  if (arg.startsWith('./') || arg.startsWith('../')) {
    return path.resolve(__dirname, '..', arg);
  }
  return arg;
}

class AccessibilityMcpClient {
  constructor() {
    this.command = process.env.ACCESSBRIDGE_MCP_COMMAND || 'node';
    this.args = (process.env.ACCESSBRIDGE_MCP_ARGS || './scripts/mock-accessibility-mcp.js')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)
      .map(resolveArg);
    this.toolName = process.env.ACCESSBRIDGE_MCP_TOOL || 'lookup_accessibility_term';
    this.argName = process.env.ACCESSBRIDGE_MCP_ARG || 'term';
    this.mockMode = process.env.ACCESSBRIDGE_MOCK === 'true';
    this.client = null;
  }

  async connect() {
    if (this.mockMode) {
      console.log('[MCP] Running in mock mode');
      return;
    }

    const transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
    });

    this.client = new Client({ name: 'accessbridge', version: '1.0.0' });
    await this.client.connect(transport);
    console.log('[MCP] Connected to accessibility knowledge base');
  }

  async lookup(term) {
    if (this.mockMode) {
      return this.mockLookup(term);
    }

    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: this.toolName,
      arguments: { [this.argName]: term },
    });

    return this.parseResult(result);
  }

  parseResult(result) {
    if (!result || !result.content || result.content.length === 0) {
      return null;
    }
    const text = result.content.find((c) => c.type === 'text')?.text;
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { term: '', simple: text, found: true };
    }
  }

  mockLookup(term) {
    const kb = {
      wcag: {
        term: 'WCAG',
        definition: 'Web Content Accessibility Guidelines.',
        simple: 'Rules that help websites and apps work for everyone, including people who cannot see or use a mouse.',
      },
      'alt text': {
        term: 'alt text',
        definition: 'Alternative text describing an image.',
        simple: 'A written description of a picture for people who cannot see it.',
      },
      'screen reader': {
        term: 'screen reader',
        definition: 'Software that reads screen content aloud.',
        simple: 'A program that reads what is on the screen for blind users.',
      },
    };

    const key = Object.keys(kb).find((k) => k.toLowerCase() === (term || '').toLowerCase().trim());
    if (key) {
      return { ...kb[key], found: true };
    }
    return {
      term,
      found: false,
      simple: `No plain-language definition found for "${term}". Try a term like "WCAG" or "screen reader".`,
    };
  }

  async close() {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
      this.client = null;
    }
  }
}

module.exports = { AccessibilityMcpClient };
