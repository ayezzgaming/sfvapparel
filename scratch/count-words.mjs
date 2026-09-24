import fs from 'fs';

const html = fs.readFileSync('src/app/(public)/page.tsx', 'utf8');
// Strip JSX tags
const text = html.replace(/<[^>]*>/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/\s+/g, ' ');
const words = text.split(' ').filter(w => w.length > 1 && !w.startsWith('className') && !w.startsWith('http'));
console.log('Total extracted words in page.tsx content:', words.length);
