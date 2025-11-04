const fs = require('fs');
const file = './src/content/jotting/en/at-twenty-five.md';
const s = fs.readFileSync(file, 'utf8');
const needle = 'I was born in Wuchang District, Wuhan, at ';
const pos = s.indexOf(needle);
if (pos === -1) { console.log('Needle not found'); process.exit(1); }
const start = pos + needle.length;
console.log('Context around the timestamp (visible + code points):\n');
for (let i = start - 10; i < start + 30; i++) {
  if (i < 0 || i >= s.length) continue;
  const ch = s[i];
  const code = ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0');
  console.log(i, JSON.stringify(ch), 'U+'+code);
}
console.log('\nFull slice:', JSON.stringify(s.slice(start, start+40)));
