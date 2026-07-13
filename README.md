# AccessBridge

Plain language translator for people with disabilities inside Slack.

## What It Does

AccessBridge makes workplace Slack communication easier to understand for people with:

- Cognitive disabilities
- Dyslexia
- Non-native language backgrounds
- Vision impairments using screen readers

It provides five accessibility workflows:

1. **Plain Language Simplifier** — rewrites complex text at a lower reading level.
2. **Image Alt Text** — generates structured descriptions for shared images.
3. **Meeting Notes Restructurer** — splits dense notes into Decisions, Action Items, and Context.
4. **Acronym Explainer** — explains acronyms using an accessibility knowledge base.
5. **Jargon-Free Translation** — converts technical language into everyday words.

## Quick Start

### 1. Install dependencies

```bash
cd accessbridge
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in:

- `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN` — from your Slack app
- `ALLOWED_CHANNELS` — optional channel allowlist
- `ENABLE_SLACK_SEARCH` — set `true` to use Slack Real-Time Search API for acronym context
- `VERTEX_AI_PROJECT` — set to your Google Cloud project ID to enable Gemini-powered simplification
- `VERTEX_AI_LOCATION` — region for Vertex AI (default `us-central1`)
- `VERTEX_AI_MODEL` — model ID (default `gemini-1.5-flash-001`)
- `GOOGLE_APPLICATION_CREDENTIALS` — path to your Google Cloud service account key file

The default MCP server is a local mock accessibility knowledge base, so no external API key is required. If Vertex AI is not configured, AccessBridge falls back to rule-based simplification.

### 3. Test simplification locally

```bash
npm run test:simplify
npm run test:describe
npm run test:acronym
npm run test:ai
npm run verify
```

### 4. Start the Slack app

```bash
npm start
```

## Usage in Slack

Mention `@AccessBridge` followed by:

- `@AccessBridge simplify this: [paste text]`
- `@AccessBridge what does WCAG mean?`
- `@AccessBridge structure these notes: [paste notes]`
- `@AccessBridge translate this for non-technical readers: [paste text]`

Or use slash commands:

- `/simplify [text]`
- `/describe-image` (attach an image)
- `/structure-notes [notes]`
- `/explain-acronym [ACRONYM]`
- `/translate-jargon [text]`

You can also right-click any message and choose:

- **Simplify this message** — rewrite it in plain language
- **Explain acronym** — explain acronyms from that message

Open the **AccessBridge Home tab** for a quick reference guide.

After each simplification, you can click **Easier**, **Just right**, or **Too simple** to give feedback.

## Impact Metric

Every simplification shows the Flesch-Kincaid reading level before and after:

```
Before: Grade 16 (difficult)
After: Grade 6 (easy to read)
```

## Required Slack Scopes

- `app_mentions:read`
- `chat:write`
- `commands`
- `files:read`
- `search:read`

## Technologies

- **Slack Bolt** — custom Slack app runtime
- **Slack AI** — built-in text simplification and summarization
- **MCP server integration** — accessibility knowledge base via local MCP server
- **Real-Time Search API** — optional workspace context for acronym explanations
