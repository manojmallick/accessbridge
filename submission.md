# AccessBridge — Devpost Submission Text

## Project Title

AccessBridge: Plain Language Translator for People with Disabilities

## Tagline

A Slack agent that simplifies workplace communication so everyone can understand.

## About The Project

1 in 5 people have some form of disability. In workplace Slack channels, complex documents, legal language, technical jargon, and dense meeting notes create daily barriers for people with cognitive disabilities, dyslexia, vision impairments, and non-native speakers.

AccessBridge lives where the communication already happens — inside Slack — and makes it accessible in real time.

## How It Works

1. User mentions `@AccessBridge` or uses a slash command.
2. The Bolt.js app routes the request to the right workflow.
3. AccessBridge rewrites text using Vertex AI Gemini (with a rule-based fallback), describes images, explains acronyms, or restructures notes.
4. Every simplification shows a Flesch-Kincaid before/after score.
5. Optional Slack Real-Time Search adds workspace context to acronym explanations.

## The 5 Workflows

- **Plain Language Simplifier** — lowers reading level and highlights key terms.
- **Image Alt Text** — generates structured image descriptions.
- **Meeting Notes Restructurer** — splits notes into Decisions, Action Items, and Context.
- **Acronym Explainer** — explains acronyms using an MCP accessibility knowledge base.
- **Jargon-Free Translation** — converts technical language into everyday words.

## Bonus Features

- **AI-powered simplification** — Vertex AI Gemini rewrites complex messages, with a rule-based fallback if AI is not configured.
- **Message shortcuts** — right-click any message and choose *Simplify this message* or *Explain acronym*.
- **App Home tab** — built-in instructions and example commands for new users.
- **Feedback buttons** — every simplification includes *Easier*, *Just right*, and *Too simple* buttons.
- **Screen-reader friendly formatting** — plain-text fallbacks, no emoji-only labels, and structured sections.
- **Expanded knowledge base** — 30+ accessibility and workplace terms included.

## Technologies Used

- **Slack Bolt:** custom app runtime for mentions, slash commands, and message shortcuts.
- **Google Vertex AI (Gemini):** AI-powered plain-language simplification.
- **MCP server integration:** accessibility knowledge base via local MCP server.
- **Real-Time Search API:** workspace context for acronym explanations.

## Demo

[Video link here — 2 min 30 sec]

**Demo scenario:** A user pastes a dense HR policy message. `@AccessBridge simplify this` returns a Grade 6 version, flags acronyms like ADA and WCAG, and explains WCAG in plain language with past workspace usage.

## Key Differentiator

This is the only Slack accessibility agent built for Track 2 that:

- measures impact with a real readability score,
- combines simplification + acronym lookup + image description + note restructuring,
- and uses all three required Slack technologies.

## Social Impact

15% of the global workforce has a disability. Many use Slack. For them, AccessBridge is not a productivity enhancement — it is access to information itself.

## Try It Out

1. Create a Slack app from `manifest.json`.
2. `npm install`
3. Configure `.env` from `.env.example`.
4. `npm start`
5. Mention `@AccessBridge simplify this: [your text]`
