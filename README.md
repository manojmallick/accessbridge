# AccessBridge

A plain-language assistant for Slack that makes workplace messages easier to read for people with disabilities.

## Who it helps

- People with cognitive disabilities
- People with dyslexia
- Non-native speakers
- People who use screen readers (alt text for shared images)

## Features

| # | Workflow | What you get | Slash command |
|--:|---|---|---|
| 1 | **Plain Language Simplifier** | Complex text rewritten at a lower reading level, with before/after Flesch-Kincaid grade | `/simplify [text]` |
| 2 | **Image Alt Text** | A structured description for an image shared in Slack | `/describe-image` (attach an image) |
| 3 | **Meeting Notes Restructurer** | Dense notes split into Decisions, Action Items and Context | `/structure-notes [notes]` |
| 4 | **Acronym Explainer** | Acronym meanings from an accessibility knowledge base, optionally enriched with how your workspace uses the term | `/explain-acronym [ACRONYM]` |
| 5 | **Jargon-Free Translation** | Technical language converted into everyday words | `/translate-jargon [text]` |

Also included: `@AccessBridge` mentions, message shortcuts (right-click a message), an App Home tab with a quick reference, and **Easier / Just right / Too simple** feedback buttons after each simplification.

### How simplification works

1. If a Gemini API key is configured, the text is rewritten with Google Gemini.
2. If not (or if the call fails or times out), AccessBridge falls back to a built-in rule-based rewriter, so the app works with no API key at all.
3. Either way the reply shows the reading level before and after:

```
Before: Grade 16 (difficult)
After:  Grade 6 (easy to read)
```

## Quick start

Requires Node.js 18 or newer and a Slack workspace where you can install an app.

### 1. Create the Slack app

Follow [SLACK_APP_SETUP.md](SLACK_APP_SETUP.md). You can paste `manifest.json` to create the app with the right commands and shortcuts. The app runs in **Socket Mode**, so you don't need a public URL.

Required bot scopes: `app_mentions:read`, `chat:write`, `commands`, `files:read`, `search:read`.

### 2. Install and configure

```bash
git clone https://github.com/manojmallick/accessbridge.git
cd accessbridge
npm install
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|---|---|---|
| `SLACK_BOT_TOKEN` | yes | Bot token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | yes | From the app's Basic Information page |
| `SLACK_APP_TOKEN` | yes | App-level token (`xapp-...`) for Socket Mode |
| `ALLOWED_CHANNELS` | no | Comma-separated channel IDs; empty allows all |
| `GEMINI_API_KEY` | no | Enables AI simplification. Free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). `GOOGLE_API_KEY` also works |
| `GEMINI_MODEL` | no | Default `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_MS` | no | Gemini request timeout, default `10000` |
| `ENABLE_SLACK_SEARCH` | no | `true` adds workspace context from Slack search to acronym answers |
| `ACCESSBRIDGE_MCP_COMMAND`, `ACCESSBRIDGE_MCP_ARGS`, `ACCESSBRIDGE_MCP_TOOL`, `ACCESSBRIDGE_MCP_ARG` | no | How to launch the MCP knowledge-base server. Defaults run the bundled mock server |
| `ACCESSBRIDGE_MOCK` | no | `true` answers acronym lookups from local data without starting an MCP server |
| `PORT` | no | Port for the Bolt app, default `3000` |

### 3. Run

```bash
npm start        # start the Slack app
npm run dev      # restart on file changes
```

## Using it in Slack

Mention the bot:

- `@AccessBridge simplify this: [paste text]`
- `@AccessBridge what does WCAG mean?`
- `@AccessBridge structure these notes: [paste notes]`
- `@AccessBridge translate this for non-technical readers: [paste text]`

Or use the slash commands in the table above, or right-click any message and choose **Simplify this message** or **Explain acronym**. Open the **Home** tab for a quick guide.

## Scripts and testing

These scripts exercise each workflow locally, without Slack:

| Command | What it checks |
|---|---|
| `npm run test:simplify` | Rule-based simplifier and reading-level scoring |
| `npm run test:describe` | Image alt-text generation |
| `npm run test:acronym` | Acronym lookup through the MCP client |
| `npm run test:ai` | Gemini simplification (needs `GEMINI_API_KEY`) |
| `npm run tools` | Lists the tools the MCP server exposes |
| `npm run verify` | Overall sanity check |

## How it works

```
Slack event (mention / slash command / shortcut / App Home)
        |
        v
  src/index.js  (Bolt app, Socket Mode, routing)
        |
        +-- src/simplifier.js     rule-based rewriting, Flesch-Kincaid, note structuring
        |     +-- src/aiSimplifier.js   Gemini rewrite (optional)
        +-- src/imageDescriber.js  alt text for shared images
        +-- src/mcpClient.js       MCP client -> accessibility knowledge base
        |     +-- scripts/mock-accessibility-mcp.js, data/accessibility-kb.json
        +-- Slack search (optional) workspace context for acronyms
        |
        v
  Reply in thread or as an ephemeral message
```

More detail in [architecture.md](architecture.md) and the diagram `architecture-diagram.svg`.

## Project structure

```
src/                  Application code (index, simplifier, aiSimplifier, imageDescriber, mcpClient)
scripts/              Local test scripts and the mock MCP server
data/                 Accessibility knowledge base (JSON)
manifest.json         Slack app manifest
architecture.md       Design and data flow
SLACK_APP_SETUP.md    Step-by-step Slack setup
demo-script.md        Walkthrough for demos
```

## Built with

Slack Bolt for JavaScript, Google Gemini API (optional), Model Context Protocol SDK, Slack search API (optional), `dotenv` and `zod`.

## License

MIT. See [LICENSE](LICENSE).
