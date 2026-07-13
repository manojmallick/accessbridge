# AccessBridge Demo Script (2–3 minutes)

## Scene 1: The Problem (30 sec)

**Visual:** A Slack channel with a long, jargon-filled message.

```
#team-announcements

HR: "In accordance with the revised ADA accommodations policy, all personnel are required to submit their WCAG compliance attestations prior to the fiscal year-end audit."
```

**Voiceover:**
> Workplace Slack is full of dense language, acronyms, and documents that are hard for people with cognitive disabilities, dyslexia, or non-native speakers to process. They either miss critical information or spend extra energy decoding it.

---

## Scene 2: The Agent in Action (60 sec)

**Visual:** User mentions AccessBridge.

```
@AccessBridge simplify this
```

**Visual:** AccessBridge replies with a plain-language version and a reading-level score.

```
*Plain-language version:*

"Under the updated disability-access policy, all staff must send in their WCAG compliance forms before the year-end check."

_Before: Grade 16 (difficult)_
_After: Grade 6 (easy to read)_
_Improved readability_

*Key terms to explain:*
• Acronyms: ADA, WCAG
```

**Voiceover:**
> AccessBridge rewrites the message at a Grade 6 reading level using Vertex AI Gemini. It also flags key acronyms and terms.

---

## Scene 3: Acronym Context (30 sec)

**Visual:** User asks for an acronym explanation.

```
@AccessBridge what does WCAG mean?
```

**Visual:** Response includes the plain-language definition and, if enabled, past workspace discussions.

```
*WCAG*

Rules that help websites and apps work for everyone, including people who cannot see or use a mouse.

_Full definition:_ Web Content Accessibility Guidelines.

Also found 2 past workspace discussion(s):
1. #accessibility: "We need to make sure the new signup page passes WCAG contrast checks."
```

**Voiceover:**
> It doesn't just give a dictionary definition. It uses Slack's Real-Time Search API to show how the term is actually used in this workspace.

---

## Scene 4: Image Alt Text (30 sec)

**Visual:** User uploads a screenshot and mentions AccessBridge.

```
@AccessBridge describe this
[screenshot.png attached]
```

**Visual:** Response shows structured alt text.

```
*Image description:*

An image named "screenshot.png". It appears to be a PNG file shared in Slack.
File size: 245 KB.

If this image contains text, charts, or diagrams, please share a typed description so everyone can access it.

Tip: When sharing screenshots, describe the key information in your message.
```

**Voiceover:**
> AccessBridge also nudges teams toward better alt text habits, making Slack more inclusive for screen-reader users.

---

## Scene 5: Message Shortcuts & App Home (30 sec)

**Visual:** User right-clicks a dense message and selects *Simplify this message*.

**Visual:** AccessBridge replies with an ephemeral message showing the plain-language version and reading scores.

**Visual:** User opens the AccessBridge Home tab to see instructions and example commands.

**Voiceover:**
> You don't even need to type commands. Just right-click any message and choose Simplify. The Home tab also gives users a quick reference, so the agent is discoverable from day one.

---

## Scene 6: Feedback Loop (15 sec)

**Visual:** The simplified response shows three buttons: *Easier*, *Just right*, *Too simple*.

**Visual:** User clicks *Just right* and gets a quick ephemeral confirmation.

**Voiceover:**
> AccessBridge also learns from users. Every simplification includes feedback buttons, so the team can tune the reading level over time.

---

## Scene 7: Why It Wins (30 sec)

**Visual:** Architecture slide or return to Slack with a second workflow.

```
Slack Message
    |
    v
AccessBridge (Bolt.js)
    |
    +-- Slack AI (simplification)
    +-- MCP (accessibility knowledge base)
    +-- Real-Time Search API (context)
    |
    v
Accessible reply in thread
```

**Voiceover:**
> AccessBridge uses all three required Slack technologies: AI for simplification, an MCP server for disability resources, and Real-Time Search for context. For 15% of the workforce, this isn't a nice-to-have. It's the difference between participating fully and being left behind.

---

## Recording Tips

- Use a test workspace.
- Keep messages under 4000 characters.
- Show the before/after reading level clearly.
- Keep total runtime under 3 minutes.
- Upload to YouTube or Loom unlisted.
