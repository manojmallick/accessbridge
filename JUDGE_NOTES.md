# AccessBridge — Judge Notes

## Hackathon Requirement Mapping

| Requirement | Implementation | Evidence |
|-------------|----------------|----------|
| Slack AI capabilities | Rule-based simplification, summarization, structured notes | `src/simplifier.js` |
| MCP server integration | Local accessibility knowledge base MCP server | `src/mcpClient.js`, `scripts/mock-accessibility-mcp.js` |
| Real-Time Search API | Optional `searchSlackHistory()` for acronym context | `src/index.js:83-103` |

## How to Verify Locally

```bash
cd "."
npm install
npm run test:simplify
npm run test:describe
ACCESSBRIDGE_MOCK=true npm run test:acronym WCAG
```

You should see Flesch-Kincaid before/after scores and acronym definitions.

## How to Verify in Slack

1. Create the Slack app from `manifest.json`.
2. Fill in `.env` with Slack tokens.
3. `npm start`
4. Mention `@AccessBridge simplify this: [complex text]`.
5. Mention `@AccessBridge what does WCAG mean?`.

## Key Technical Decisions

- **Vertex AI Gemini** is used for AI-powered simplification when configured. If Vertex AI is not configured, the app falls back to a rule-based simplifier so the demo still works.
- **Message shortcuts** allow users to right-click any message and get a plain-language version or acronym explanations without typing commands.
- **App Home tab** provides a self-service onboarding guide with examples.
- **Feedback buttons** on every simplification let users rate the reading level, showing interactivity and a path to personalization.
- **Expanded knowledge base** contains 30+ accessibility terms so the MCP integration has real coverage.
- **Flesch-Kincaid scoring** is built into the app, so every response shows a measurable accessibility improvement.
- **Local MCP server** (`scripts/mock-accessibility-mcp.js`) exposes `lookup_accessibility_term` and reads from `data/accessibility-kb.json`.
- **Optional Slack Search** behind `ENABLE_SLACK_SEARCH`. One env var activates the third required technology without changing code.

## Files to Review

| File | What to Look For |
|------|-----------------|
| `src/index.js` | Workflow routing, slash commands, message shortcuts, App Home, feedback buttons, search integration |
| `src/simplifier.js` | Plain-language rewriting, readability scoring, and AI fallback |
| `src/aiSimplifier.js` | Vertex AI Gemini integration |
| `src/mcpClient.js` | MCP client for accessibility knowledge base |
| `src/imageDescriber.js` | Image metadata and alt-text generation |
| `data/accessibility-kb.json` | Expanded accessibility terms and definitions |
| `manifest.json` | Scopes, slash commands, and message shortcuts |
| `architecture-diagram.svg` | Visual architecture diagram |
