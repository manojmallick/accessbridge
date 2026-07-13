// Plain language simplifier and readability scoring
// Rule-based by default; optionally enhanced with the Gemini API (Google AI Studio).

const { isAIEnabled, simplifyWithAI, structureWithAI } = require('./aiSimplifier');

function syllableCount(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const match = word.match(/[aeiouy]{1,2}/g);
  return match ? match.length : 1;
}

function fleschKincaid(text) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + syllableCount(w), 0);

  if (sentences.length === 0 || words.length === 0) return { grade: 0, score: 100 };

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease
  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  // Flesch-Kincaid Grade Level
  const grade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

  return { grade: Math.max(0, Math.round(grade * 10) / 10), score: Math.round(score) };
}

function simplifyText(text) {
  if (!text || !text.trim()) {
    return { original: '', simplified: '', before: { grade: 0, score: 100 }, after: { grade: 0, score: 100 } };
  }

  let simplified = text
    // Break long sentences
    .replace(/,\s*and\s+/g, '. And ')
    .replace(/;\s*/g, '. ')
    .replace(/:\s*/g, '. ')
    // Remove filler phrases
    .replace(/\bin\s+order\s+to\b/gi, 'to')
    .replace(/\bat\s+this\s+point\s+in\s+time\b/gi, 'now')
    .replace(/\bdue\s+to\s+the\s+fact\s+that\b/gi, 'because')
    .replace(/\bin\s+the\s+event\s+that\b/gi, 'if')
    .replace(/\bfor\s+the\s+purpose\s+of\b/gi, 'for')
    // Simplify common complex words
    .replace(/\butilize\b/gi, 'use')
    .replace(/\bimplementation\b/gi, 'use')
    .replace(/\bapproximately\b/gi, 'about')
    .replace(/\bsignificant\b/gi, 'big')
    .replace(/\brequirements\b/gi, 'needs')
    .replace(/\benhance\b/gi, 'improve')
    .replace(/\bcommunicate\b/gi, 'tell')
    .replace(/\bprior\s+to\b/gi, 'before')
    .replace(/\bsubsequent\s+to\b/gi, 'after')
    .replace(/\bnevertheless\b/gi, 'but')
    .replace(/\bfurthermore\b/gi, 'also')
    .replace(/\bhowever\b/gi, 'but')
    .replace(/\btherefore\b/gi, 'so')
    .replace(/\bconsequently\b/gi, 'so');

  // Add line breaks for readability
  const sentences = simplified
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  simplified = sentences.join('\n\n');

  const before = fleschKincaid(text);
  const after = fleschKincaid(simplified);

  return {
    original: text,
    simplified,
    before,
    after,
  };
}

async function simplifyTextAsync(text) {
  const ruleResult = simplifyText(text);
  if (!isAIEnabled()) {
    return ruleResult;
  }

  try {
    const aiSimplified = await simplifyWithAI(text);
    const after = fleschKincaid(aiSimplified);
    return {
      original: text,
      simplified: aiSimplified,
      before: ruleResult.before,
      after,
      ai: true,
    };
  } catch (err) {
    console.error('[AI Simplifier] Falling back to rule-based:', err.message);
    return ruleResult;
  }
}

function extractTerms(text) {
  // Find likely acronyms (2-6 uppercase letters) and jargon words
  const acronyms = [...text.matchAll(/\b[A-Z]{2,6}\b/g)].map((m) => m[0]);
  const jargon = [
    'accessibility', 'accommodation', 'wcag', 'ada', 'disability', 'dyslexia',
    'screen reader', 'alt text', 'cognitive', 'neurodivergent', 'assistive technology',
  ].filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(text));

  return { acronyms: [...new Set(acronyms)], jargon: [...new Set(jargon)] };
}

function bucketSentences(sentences) {
  const decisions = [];
  const actions = [];
  const context = [];

  // Each sentence lands in exactly one bucket. Actions win over decisions:
  // "John will own the migration, due Tuesday" is both, but it is actionable,
  // and showing it twice reads as a bug.
  for (const s of sentences) {
    if (/\b(action|todo|task|assign|responsible|owner|owns|due|by\s+\w+day)\b/i.test(s)) {
      actions.push(s);
    } else if (/\b(decided?|agreed?|will|approved)\b/i.test(s)) {
      decisions.push(s);
    } else {
      context.push(s);
    }
  }

  return { decisions, actions, context };
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Sync, rule-based. Kept for callers that cannot await.
function structureNotes(text) {
  const simplified = simplifyText(text);
  return {
    structured: bucketSentences(splitSentences(simplified.simplified)),
    ...simplified,
  };
}

// Preferred path. Lets the model bucket the notes semantically — keyword
// matching mis-files a rewritten "John will move the database. He must finish
// by Tuesday." as a decision plus orphaned context. Falls back to rule-based
// on any AI failure.
async function structureNotesAsync(text) {
  const before = fleschKincaid(text);

  if (isAIEnabled()) {
    try {
      const structured = await structureWithAI(text);
      const flat = [...structured.decisions, ...structured.actions, ...structured.context].join(' ');
      return {
        original: text,
        simplified: flat,
        structured,
        before,
        after: fleschKincaid(flat),
        ai: true,
      };
    } catch (err) {
      console.error('[AI Structure] Falling back to rule-based:', err.message);
    }
  }

  const simplified = simplifyText(text);
  return {
    structured: bucketSentences(splitSentences(simplified.simplified)),
    ...simplified,
  };
}

module.exports = {
  simplifyText,
  simplifyTextAsync,
  structureNotes,
  structureNotesAsync,
  extractTerms,
  fleschKincaid,
};
