// Extracts the vector paths of the 90mins+ brand logo (models/90mins-logo.svg) into src/logo90.json
import fs from 'node:fs';
const svg = fs.readFileSync('models/90mins-logo.svg', 'utf8');
const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const paths = [...svg.matchAll(/<path[^>]*?d="([^"]+)"/g)].map(m => m[1]);
fs.writeFileSync('src/logo90.json', JSON.stringify({ vb, paths }));
console.log('logo paths', paths.length, vb);
