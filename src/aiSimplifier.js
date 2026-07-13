// Google AI Studio (Gemini API) simplifier.
// Uses a plain API key — no GCP project or service account needed.
// Get a key at https://aistudio.google.com/apikey

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 10000);

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function isAIEnabled() {
  return Boolean(getApiKey());
}

async function callGemini(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API is not configured. Set GEMINI_API_KEY.');
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Slack expects a response within 3s for ack, but the rewrite runs after ack —
  // still bound the call so a hung API can't wedge the handler.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          // 2.5-flash is a thinking model and its reasoning tokens are charged
          // against maxOutputTokens. Left on, thinking consumed ~980 of 1024 and
          // the rewrite was truncated mid-sentence — once turning "4000 users"
          // into "400". Rewriting to plain language needs no reasoning budget.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Gemini API timed out after ${TIMEOUT_MS}ms.`);
    }
    throw new Error(`Gemini API request failed: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let detail = body.slice(0, 200);
    try {
      detail = JSON.parse(body).error?.message || detail;
    } catch {
      // keep the raw snippet
    }
    throw new Error(`Gemini API error ${res.status}: ${detail}`);
  }

  const data = await res.json();

  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Gemini blocked the prompt: ${blockReason}`);
  }

  const candidate = data.candidates?.[0];

  // A truncated rewrite is worse than no rewrite: it can silently drop facts
  // (a cut-off "4000 users" reads as "400"). Never return a partial answer —
  // throw so the caller falls back to the rule-based path.
  if (candidate?.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
    throw new Error(`Gemini stopped early: ${candidate.finishReason}`);
  }
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new Error('Gemini response was truncated (MAX_TOKENS) — discarding to avoid dropping facts.');
  }

  const out = candidate?.content?.parts?.[0]?.text?.trim();
  if (!out) {
    throw new Error('Gemini API returned an empty response.');
  }

  return out;
}

async function simplifyWithAI(text) {
  return callGemini(`Rewrite the following workplace message in plain, simple English.

Rules:
- Use short sentences and everyday words.
- Aim for a reading level of grade 6 or below.
- Keep the original meaning and all facts intact — especially names, numbers, and dates.
- Return only the rewritten text, with no preamble or commentary.

Input:
${text}

Plain-language version:`);
}

// Structuring meeting notes by keyword ("will", "due", "owns") is unreliable
// once the text has been rewritten: the rewrite splits "who owns it" from
// "when it is due" into separate sentences, so the owner and the deadline land
// in different buckets. Ask the model to bucket semantically instead.
async function structureWithAI(text) {
  const prompt = `Restructure the following meeting notes into three groups.

Rules:
- Rewrite each line in plain, simple English (grade 6 or below).
- Keep every fact — especially names, numbers, and dates — exactly right.
- "decisions": what was decided or agreed.
- "actions": what someone must do, who owns it, and when it is due. Keep the owner and the deadline together in one line.
- "context": background and impact. Everything else.
- A line belongs in exactly one group.
- Return ONLY valid JSON, no markdown fences, in this shape:
{"decisions":["..."],"actions":["..."],"context":["..."]}

Notes:
${text}`;

  const raw = await callGemini(prompt);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini returned unparseable JSON for structured notes.');
  }

  const arr = (v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string' && s.trim()) : []);
  return {
    decisions: arr(parsed.decisions),
    actions: arr(parsed.actions),
    context: arr(parsed.context),
  };
}

module.exports = {
  isAIEnabled,
  simplifyWithAI,
  structureWithAI,
};
