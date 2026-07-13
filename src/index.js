require('dotenv').config();

const { App } = require('@slack/bolt');
const { AccessibilityMcpClient } = require('./mcpClient');
const { simplifyTextAsync, simplifyText, structureNotesAsync, extractTerms } = require('./simplifier');
const { describeImage } = require('./imageDescriber');

const mcp = new AccessibilityMcpClient();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const ALLOWED_CHANNELS = (process.env.ALLOWED_CHANNELS || '')
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean);

const ENABLE_SLACK_SEARCH = process.env.ENABLE_SLACK_SEARCH === 'true';
const SLACK_MAX_LENGTH = 3500;

function isAllowed(channel) {
  if (ALLOWED_CHANNELS.length === 0) return true;
  return ALLOWED_CHANNELS.includes(channel);
}

function truncate(text) {
  if (text.length <= SLACK_MAX_LENGTH) return text;
  return text.slice(0, SLACK_MAX_LENGTH - 3) + '...';
}

function readingBadge(label, grade) {
  if (grade <= 6) return `${label}: Grade ${grade} (easy to read)`;
  if (grade <= 9) return `${label}: Grade ${grade} (fairly easy)`;
  if (grade <= 12) return `${label}: Grade ${grade} (somewhat difficult)`;
  return `${label}: Grade ${grade} (difficult)`;
}

function extractSearchKeywords(question) {
  const stopWords = new Set([
    'what', 'does', 'mean', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'of',
    'for', 'to', 'from', 'and', 'or', 'with', 'by', 'this', 'that', 'it',
    'accessbridge', 'simplify', 'describe', 'translate', 'structure',
  ]);
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 5)
    .join(' ');
}

async function searchSlackHistory(client, question) {
  try {
    const query = extractSearchKeywords(question);
    if (!query) return null;

    const result = await client.search.messages({
      query,
      sort: 'timestamp',
      sort_dir: 'desc',
      count: 3,
    });

    const matches = result?.ok ? result.messages?.matches || [] : [];
    if (matches.length === 0) return null;

    const lines = matches.map((m, i) => {
      const channel = m.channel?.name || 'private';
      const snippet = (m.text || '').replace(/\n/g, ' ').slice(0, 80);
      return `${i + 1}. #${channel}: "${snippet}${snippet.length >= 80 ? '...' : ''}"`;
    });

    return `Also found ${matches.length} past workspace discussion(s):\n${lines.join('\n')}`;
  } catch (err) {
    console.error('[Search] Slack search failed:', err.message);
    return null;
  }
}

async function appendSearchContext(client, question, message) {
  if (!ENABLE_SLACK_SEARCH || !client) return message;
  const searchResult = await searchSlackHistory(client, question);
  if (searchResult) {
    message += '\n\n' + searchResult;
  }
  return message;
}

// --- Workflow 1: Plain Language Simplifier ---

async function handleSimplify(text, say, client, context = '') {
  const result = await simplifyTextAsync(text);
  const terms = extractTerms(result.original);

  let plainText = `Plain-language version:\n\n${result.simplified}\n\n`;
  plainText += `${readingBadge('Before', result.before.grade)}\n`;
  plainText += `${readingBadge('After', result.after.grade)}\n`;
  plainText += `${result.before.grade > result.after.grade ? 'Improved readability' : 'Readability maintained'}`;

  if (terms.acronyms.length > 0 || terms.jargon.length > 0) {
    plainText += '\n\nKey terms to explain:';
    if (terms.acronyms.length > 0) plainText += `\n• Acronyms: ${terms.acronyms.join(', ')}`;
    if (terms.jargon.length > 0) plainText += `\n• Terms: ${terms.jargon.join(', ')}`;
  }

  plainText = await appendSearchContext(client, text, plainText);
  plainText = truncate(plainText);

  const blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Plain-language version:*\n\n${result.simplified}` },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_${readingBadge('Before', result.before.grade)}_ | _${readingBadge('After', result.after.grade)}_`,
        },
      ],
    },
  ];

  if (terms.acronyms.length > 0 || terms.jargon.length > 0) {
    let termsText = '';
    if (terms.acronyms.length > 0) termsText += `*Acronyms:* ${terms.acronyms.join(', ')}\n`;
    if (terms.jargon.length > 0) termsText += `*Terms:* ${terms.jargon.join(', ')}`;
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Key terms to explain:*\n${termsText.trim()}` },
    });
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: 'Easier', emoji: false }, action_id: 'feedback_easier', value: 'easier' },
      { type: 'button', text: { type: 'plain_text', text: 'Just right', emoji: false }, action_id: 'feedback_right', value: 'right' },
      { type: 'button', text: { type: 'plain_text', text: 'Too simple', emoji: false }, action_id: 'feedback_too_simple', value: 'too_simple' },
    ],
  });

  await say({ text: plainText, blocks });
}

// --- Workflow 2: Image Description ---

async function handleDescribe(event, say, client) {
  // If the mention has files attached, describe the first image
  if (event.files && event.files.length > 0) {
    const fileId = event.files[0];
    const description = await describeImage(client, fileId);
    await say(truncate(`*Image description:*\n\n${description}`));
    return;
  }

  await say('Please attach an image to your message, or use `/describe-image` with a file upload.');
}

// --- Workflow 3: Meeting Notes Restructurer ---

async function handleStructure(text, say, client) {
  const result = await structureNotesAsync(text);
  let message = '*Structured notes:*\n\n';

  if (result.structured.decisions.length > 0) {
    message += '*Decisions*\n';
    result.structured.decisions.forEach((s) => { message += `• ${s}\n`; });
    message += '\n';
  }

  if (result.structured.actions.length > 0) {
    message += '*Action Items*\n';
    result.structured.actions.forEach((s) => { message += `• ${s}\n`; });
    message += '\n';
  }

  if (result.structured.context.length > 0) {
    message += '*Context*\n';
    result.structured.context.forEach((s) => { message += `• ${s}\n`; });
  }

  message += `\n_${readingBadge('Before', result.before.grade)}_\n`;
  message += `_${readingBadge('After', result.after.grade)}_`;

  message = await appendSearchContext(client, text, message);
  await say(truncate(message));
}

// --- Workflow 4: Acronym Explainer ---

async function handleAcronym(term, say, client) {
  const lookup = await mcp.lookup(term);

  let message = `*${lookup.term || term}*`;
  if (lookup.found) {
    message += `\n\n${lookup.simple}`;
    if (lookup.definition && lookup.definition !== lookup.simple) {
      message += `\n\n_Full definition:_ ${lookup.definition}`;
    }
  } else {
    message += `\n\n${lookup.simple}`;
  }

  message = await appendSearchContext(client, term, message);
  await say(truncate(message));
}

// --- Workflow 5: Jargon-Free Translation ---

async function handleTranslate(text, say, client) {
  // "translate this for non-technical readers" is essentially the same as simplify
  await handleSimplify(text, say, client, 'translate');
}

// --- Router ---

async function routeMention(text, event, say, client) {
  const lower = text.toLowerCase();

  // Image description: "describe this" or "what is in this image"
  if (/\b(describe this|describe the image|what is in this image|alt text)\b/.test(lower) || event.files?.length > 0) {
    return handleDescribe(event, say, client);
  }

  // Acronym explainer: "what does X mean" or "what is X"
  const acronymMatch = text.match(/\bwhat\s+(?:does|is)\s+([A-Z]{2,6})\s+mean(?:\s+here)?\b/i) ||
                       text.match(/\bwhat\s+(?:is|does)\s+([A-Z]{2,6})\??\b/i);
  if (acronymMatch) {
    return handleAcronym(acronymMatch[1], say, client);
  }

  // Structure notes: "structure these notes" or "summarize this meeting"
  if (/\b(structure these notes|summarize this meeting|organize these notes|meeting notes)\b/.test(lower)) {
    return handleStructure(text.replace(/\b(structure these notes|summarize this meeting|organize these notes|meeting notes)\b/gi, '').trim(), say, client);
  }

  // Translate / jargon-free
  if (/\b(translate this|jargon.?free|non.?technical|plain language version)\b/.test(lower)) {
    return handleTranslate(text.replace(/\b(translate this|jargon.?free|for non-technical readers|plain language version)\b/gi, '').trim(), say, client);
  }

  // Default: simplify
  const cleaned = text.replace(/\b(accessbridge|simplify this)\b/gi, '').trim();
  return handleSimplify(cleaned || text, say, client);
}

// --- Event Handlers ---

app.event('app_mention', async ({ event, say, client }) => {
  if (!isAllowed(event.channel)) return;

  const text = event.text.replace(/<@\w+>/g, '').trim();
  if (!text) {
    await say('Hi! I can simplify text, describe images, explain acronyms, and restructure meeting notes. Try: "@AccessBridge simplify this" or "@AccessBridge what does WCAG mean?"');
    return;
  }

  await routeMention(text, event, say, client);
});

app.command('/simplify', async ({ command, ack, respond, client }) => {
  await ack();
  if (!isAllowed(command.channel_id)) {
    await respond('AccessBridge is not enabled in this channel.');
    return;
  }
  await handleSimplify(command.text, respond, client);
});

app.command('/describe-image', async ({ command, ack, respond, client }) => {
  await ack();
  if (!isAllowed(command.channel_id)) {
    await respond('AccessBridge is not enabled in this channel.');
    return;
  }
  await respond('Upload an image in the same message as this command, or mention me with an image attached.');
});

app.command('/structure-notes', async ({ command, ack, respond, client }) => {
  await ack();
  if (!isAllowed(command.channel_id)) {
    await respond('AccessBridge is not enabled in this channel.');
    return;
  }
  await handleStructure(command.text, respond, client);
});

app.command('/explain-acronym', async ({ command, ack, respond, client }) => {
  await ack();
  if (!isAllowed(command.channel_id)) {
    await respond('AccessBridge is not enabled in this channel.');
    return;
  }
  const term = command.text.trim();
  if (!term) {
    await respond('Please provide an acronym, e.g. `/explain-acronym WCAG`');
    return;
  }
  await handleAcronym(term, respond, client);
});

app.command('/translate-jargon', async ({ command, ack, respond, client }) => {
  await ack();
  if (!isAllowed(command.channel_id)) {
    await respond('AccessBridge is not enabled in this channel.');
    return;
  }
  await handleTranslate(command.text, respond, client);
});

// Message shortcuts
app.shortcut('simplify_message', async ({ shortcut, ack, client }) => {
  await ack();
  const text = shortcut.message?.text || '';
  if (!text) {
    await client.chat.postEphemeral({
      channel: shortcut.channel.id,
      user: shortcut.user.id,
      text: 'No text found in this message to simplify.',
    });
    return;
  }

  const result = await simplifyTextAsync(text);
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Plain-language version:*\n\n${result.simplified}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_${readingBadge('Before', result.before.grade)}_ | _${readingBadge('After', result.after.grade)}_`,
        },
      ],
    },
  ];

  await client.chat.postEphemeral({
    channel: shortcut.channel.id,
    user: shortcut.user.id,
    blocks,
    text: `Plain-language version: ${result.simplified}`,
  });
});

app.shortcut('explain_acronym', async ({ shortcut, ack, client }) => {
  await ack();
  const text = shortcut.message?.text || '';
  const terms = extractTerms(text);

  if (terms.acronyms.length === 0) {
    await client.chat.postEphemeral({
      channel: shortcut.channel.id,
      user: shortcut.user.id,
      text: 'No acronyms found in this message.',
    });
    return;
  }

  const explanations = [];
  for (const acronym of terms.acronyms.slice(0, 3)) {
    const lookup = await mcp.lookup(acronym);
    explanations.push(`*${acronym}*\n${lookup.simple}`);
  }

  await client.chat.postEphemeral({
    channel: shortcut.channel.id,
    user: shortcut.user.id,
    text: `Acronyms explained:\n\n${explanations.join('\n\n')}`,
  });
});

// Feedback buttons
app.action('feedback_easier', async ({ ack, body, client }) => {
  await ack();
  await client.chat.postEphemeral({
    channel: body.channel.id,
    user: body.user.id,
    text: 'Thanks for the feedback. We will aim for an even simpler version next time.',
  });
});

app.action('feedback_right', async ({ ack, body, client }) => {
  await ack();
  await client.chat.postEphemeral({
    channel: body.channel.id,
    user: body.user.id,
    text: 'Thanks for the feedback. Glad this level worked for you.',
  });
});

app.action('feedback_too_simple', async ({ ack, body, client }) => {
  await ack();
  await client.chat.postEphemeral({
    channel: body.channel.id,
    user: body.user.id,
    text: 'Thanks for the feedback. We will keep more detail next time.',
  });
});

// App Home tab
app.event('app_home_opened', async ({ client, event }) => {
  await client.views.publish({
    user_id: event.user,
    view: {
      type: 'home',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: 'Welcome to AccessBridge', emoji: false },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'AccessBridge makes Slack messages easier to understand for people with cognitive disabilities, dyslexia, non-native language backgrounds, and screen-reader users.',
          },
        },
        { type: 'divider' },
        {
          type: 'header',
          text: { type: 'plain_text', text: 'How to use AccessBridge', emoji: false },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Mention @AccessBridge in a channel or use these slash commands:\n\n• `/simplify [text]` — rewrite text in plain language\n• `/translate-jargon [text]` — convert technical terms to everyday words\n• `/structure-notes [notes]` — organize notes into decisions, actions, and context\n• `/explain-acronym [ACRONYM]` — explain an acronym\n• `/describe-image` — attach an image for an alt-text suggestion',
          },
        },
        { type: 'divider' },
        {
          type: 'header',
          text: { type: 'plain_text', text: 'Example messages', emoji: false },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• `@AccessBridge simplify this: The implementation requires significant effort.`\n• `@AccessBridge what does WCAG mean?`\n• `@AccessBridge structure these notes: [paste notes]`',
          },
        },
        { type: 'divider' },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: 'Every simplification shows a Flesch-Kincaid reading score before and after.' },
          ],
        },
      ],
    },
  });
});

// Health check
app.message('hello accessbridge', async ({ say }) => {
  await say('AccessBridge is online. I simplify text, describe images, explain acronyms, and structure notes.');
});

(async () => {
  try {
    await mcp.connect();
    await app.start(process.env.PORT || 3000);
    console.log('[Slack] AccessBridge is running');
  } catch (err) {
    console.error('[Fatal] Failed to start:', err);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  await mcp.close();
  await app.stop();
  process.exit(0);
});
