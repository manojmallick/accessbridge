const { generateAltText } = require('../src/imageDescriber');

const samples = [
  { name: 'dashboard.png', filetype: 'png', size: 245_000 },
  { name: 'report.pdf', filetype: 'pdf', size: 1_200_000 },
  { name: 'diagram.svg', filetype: 'svg', size: 18_000 },
];

console.log('AccessBridge — Image Alt Text Test\n');
samples.forEach((file) => {
  console.log('---');
  console.log(generateAltText(file));
  console.log('');
});
