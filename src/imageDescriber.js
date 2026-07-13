// Image description / alt text generator
// Uses Slack's files.info to get image metadata and generates a structured description.
// For the hackathon demo, this uses a rule-based template. A production version would
// call a vision model (Slack AI vision, OpenAI GPT-4V, etc.).

function generateAltText(file) {
  const type = (file.filetype || 'image').toLowerCase();
  const name = file.name || 'image';
  const size = file.size ? `File size: ${Math.round(file.size / 1024)} KB.` : '';

  let description = '';

  switch (type) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      description = `An image named "${name}". It appears to be a ${type.toUpperCase()} file shared in Slack.`;
      break;
    case 'pdf':
      description = `A PDF document named "${name}". Screen readers may need OCR to read its contents.`;
      break;
    case 'svg':
      description = `A vector image named "${name}". It may contain diagrams, icons, or illustrations.`;
      break;
    default:
      description = `A shared file named "${name}" of type ${type}.`;
  }

  return [
    description,
    size,
    'If this image contains text, charts, or diagrams, please share a typed description so everyone can access it.',
    'Tip: When sharing screenshots, describe the key information in your message.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function describeImage(client, fileId) {
  try {
    const result = await client.files.info({ file: fileId });
    const file = result.file;

    if (!file) {
      return 'I could not find that file. It may have been deleted or I may not have permission to access it.';
    }

    if (!file.mimetype?.startsWith('image/') && !['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(file.filetype)) {
      return `That file (${file.name}) does not look like an image. I can describe images and screenshots. For documents, try summarizing the text instead.`;
    }

    return generateAltText(file);
  } catch (err) {
    console.error('[Image] Failed to describe image:', err.message);
    return 'Sorry, I could not describe that image. Make sure I have permission to read files in this workspace.';
  }
}

module.exports = { describeImage, generateAltText };
