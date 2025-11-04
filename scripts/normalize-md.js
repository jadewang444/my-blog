const fs = require('fs');
const file = './src/content/jotting/en/at-twenty-five.md';
let src = fs.readFileSync(file, 'utf8');
// Remove common invisible/control characters that can break Markdown/HTML rendering
const invisible = /[\u200B\uFEFF\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069]/g;
const cleaned = src.replace(invisible, '');
if (cleaned === src) {
  console.log('No invisible characters found.');
  process.exit(0);
}
fs.writeFileSync(file, cleaned, 'utf8');
console.log('Normalized', file);
