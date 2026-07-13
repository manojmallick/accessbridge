const { simplifyTextAsync } = require('../src/simplifier');

async function main() {
  const text = process.argv[2] || 'The implementation of this feature requires significant effort from the engineering team prior to the deployment date.';

  console.log('AccessBridge — AI Simplification Test');
  console.log('\nOriginal:');
  console.log(text);

  const result = await simplifyTextAsync(text);

  console.log('\nSimplified:');
  console.log(result.simplified);
  console.log(`\nBefore: Grade ${result.before.grade}`);
  console.log(`After: Grade ${result.after.grade}`);
  console.log(`AI used: ${result.ai ? 'yes' : 'no (rule-based fallback)'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
