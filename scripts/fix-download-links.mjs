import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const swipio = path.join(root, 'swipio');

for (const lang of fs.readdirSync(swipio)) {
  const dir = path.join(swipio, lang);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of ['faq.html', 'support.html']) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) continue;
    let html = fs.readFileSync(filePath, 'utf8');
    const updated = html.replace(/href="\.\.\/\.\.\/index\.html#download"/g, 'href="index.html#download"');
    if (updated !== html) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log('Fixed download link:', path.relative(root, filePath));
    }
  }
}

console.log('Done');
