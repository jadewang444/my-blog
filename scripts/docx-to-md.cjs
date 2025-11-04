const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

async function run() {
  const repoRoot = process.cwd();
  const docxPath = path.join(repoRoot, 'At Twenty-Five.docx');
  const mdPath = path.join(repoRoot, 'src', 'content', 'jotting', 'en', 'at-twenty-five.md');

  if (!fs.existsSync(docxPath)) {
    console.error('Docx file not found at', docxPath);
    process.exit(1);
  }

  if (!fs.existsSync(mdPath)) {
    console.error('Markdown file not found at', mdPath);
    process.exit(1);
  }

  const mdRaw = fs.readFileSync(mdPath, 'utf8');
  // preserve frontmatter (--- ... ---) if present
  let frontmatter = '';
  let rest = mdRaw;
  if (mdRaw.startsWith('---')) {
    const idx = mdRaw.indexOf('\n---', 3);
    if (idx !== -1) {
      // include the closing --- line
      const fmEnd = mdRaw.indexOf('\n', idx + 1);
      // safer: find the second '---' line
      const parts = mdRaw.split('\n');
      let closingIndex = -1;
      for (let i = 1; i < parts.length; i++) {
        if (parts[i].trim() === '---') { closingIndex = i; break; }
      }
      if (closingIndex !== -1) {
        frontmatter = parts.slice(0, closingIndex + 1).join('\n') + '\n\n';
        rest = parts.slice(closingIndex + 1).join('\n').trimStart();
      }
    }
  }

  console.log('Extracting text from', docxPath);
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = result.value || '';

  // Normalize line endings and ensure paragraph spacing (double newlines between paragraphs)
  const paragraphs = text.split(/\r?\n\r?\n+/).map(p => p.replace(/\r?\n/g, ' ').trim()).filter(Boolean);
  const body = paragraphs.join('\n\n') + '\n';

  const newMd = frontmatter + body;
  fs.writeFileSync(mdPath, newMd, 'utf8');
  console.log('Wrote updated markdown to', mdPath);
}

run().catch(err => { console.error(err); process.exit(1); });
