# AccessBridge — Devpost Submission Checklist

**Deadline:** July 13, 2026, 5:00pm PDT

---

## Pre-Submission

- [ ] Confirm Netherlands eligibility at https://slackhack.devpost.com/rules
- [ ] Create Slack app from `manifest.json`
- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env` and fill in Slack tokens
- [ ] Test local workflows:
  - [ ] `npm run test:simplify`
  - [ ] `npm run test:describe`
  - [ ] `npm run test:acronym`
- [ ] Start app: `npm start`
- [ ] Test in Slack:
  - [ ] `@AccessBridge simplify this: [text]`
  - [ ] `@AccessBridge what does WCAG mean?`
  - [ ] `@AccessBridge structure these notes: [notes]`
  - [ ] Right-click a message → *Simplify this message*
  - [ ] Right-click a message with an acronym → *Explain acronym*
  - [ ] Open AccessBridge Home tab for instructions
  - [ ] Click a feedback button (*Easier*, *Just right*, *Too simple*) after a simplification
- [ ] Record 2–3 minute demo video using `demo-script.md`
- [ ] Take screenshots of before/after reading levels

## Devpost Form

| Field | Value |
|-------|-------|
| Title | AccessBridge: Plain Language Translator for People with Disabilities |
| Track | Slack Agent for Good |
| Tagline | A Slack agent that simplifies workplace communication so everyone can understand. |
| Description | Paste from `submission.md` |
| Video | [Paste YouTube/Loom URL] |
| Technologies | Slack Bolt, Slack AI, MCP, Real-Time Search API |
| Repo | [Paste public or judge-accessible repo URL] |

## Final Review

- [ ] No placeholder text remains
- [ ] Video clearly shows reading level before/after
- [ ] Response includes accessibility-specific terms and acronyms
- [ ] Demo runtime under 3 minutes
- [ ] Submitted before 5:00pm PDT
