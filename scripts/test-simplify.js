const { simplifyText, structureNotes } = require('../src/simplifier');

const samples = [
  'The implementation of this feature requires significant effort from the engineering team prior to the deployment date.',
  'Due to the fact that the requirements are not finalized, we will communicate the decision subsequent to the meeting.',
  'WCAG stands for Web Content Accessibility Guidelines and it is important for screen reader compatibility.',
];

console.log('AccessBridge — Plain Language Test\n');
samples.forEach((text) => {
  const result = simplifyText(text);
  console.log('Original:', result.original);
  console.log('Simplified:', result.simplified);
  console.log(`Before: Grade ${result.before.grade} | After: Grade ${result.after.grade}\n`);
});

console.log('\n--- Meeting Notes Structure ---\n');
const notes = 'We decided to delay the launch. Alice will update the timeline. The compliance team raised concerns about WCAG 2.1 conformance. We need to review the accessibility report before final release.';
const structured = structureNotes(notes);
console.log('Original:', structured.original);
console.log('Structured:', JSON.stringify(structured.structured, null, 2));
console.log(`Before: Grade ${structured.before.grade} | After: Grade ${structured.after.grade}`);
