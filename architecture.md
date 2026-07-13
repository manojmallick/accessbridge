# AccessBridge Architecture

## Component Diagram

```
User Message / Shortcut / App Home
    |
    v
AccessBridge (Bolt.js app)
    |
    +-- Plain Language Simplifier (src/simplifier.js)
    |   +-- Vertex AI Gemini (src/aiSimplifier.js)
    |   +-- Rule-based fallback
    +-- Image Alt Text Generator (src/imageDescriber.js)
    +-- Message Shortcuts (src/index.js)
    +-- App Home Tab (src/index.js)
    +-- MCP --> Accessibility Knowledge Base (data/accessibility-kb.json)
    +-- Search API --> Slack message history (context)
    |
    v
Accessible response in thread or ephemeral message
```

## Data Flow

1. **Trigger**: User types `@AccessBridge`, uses a slash command, right-clicks a message for a shortcut, or opens the App Home tab.
2. **Delivery**: Slack sends an `app_mention`, `slash_command`, `shortcut`, or `app_home_opened` event to the Bolt.js app via Socket Mode.
3. **Routing**: `src/index.js` routes the request to the correct workflow.
4. **Processing**:
   - Simplification first tries Vertex AI Gemini, then falls back to rule-based plain-language rewriting. Both paths use Flesch-Kincaid scoring.
   - Acronym explanation calls the MCP knowledge base via `src/mcpClient.js`.
   - Image description uses Slack's `files.info` and a structured alt-text template.
5. **Context enrichment**: If enabled, the Real-Time Search API adds past workspace usage.
6. **Formatting**: The response includes the simplified output, before/after reading level, and any relevant terms.
7. **Reply**: The app posts the formatted answer back into the thread.

## Technology Mapping to Hackathon Requirements

| Requirement | Implementation |
|-------------|----------------|
| Slack AI capabilities | Text simplification, summarization, and structured note formatting |
| MCP server integration | Local accessibility knowledge base MCP server |
| Real-Time Search API | Optional `client.search.messages()` for acronym context |

## Key Files

| File | Responsibility |
|------|---------------|
| `src/index.js` | Slack event handlers, workflow routing, message shortcuts, App Home, response formatting |
| `src/simplifier.js` | Plain-language rewriting, Flesch-Kincaid scoring, and AI fallback |
| `src/aiSimplifier.js` | Vertex AI Gemini integration for AI-powered simplification |
| `src/mcpClient.js` | MCP stdio client for accessibility knowledge base |
| `src/imageDescriber.js` | Image metadata handling and alt-text generation |
| `data/accessibility-kb.json` | Local accessibility terms and definitions (30+ terms) |
| `scripts/mock-accessibility-mcp.js` | MCP stdio server exposing `lookup_accessibility_term` |
| `manifest.json` | Slack app scopes, slash commands, and message shortcuts |
