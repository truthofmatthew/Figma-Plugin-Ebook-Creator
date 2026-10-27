import { readFileSync } from 'node:fs';
import { parseMarkdown, withFrontMatter } from '../src/markdown';
const { book } = parseMarkdown(readFileSync(process.argv[2], 'utf8'));
console.log(JSON.stringify(withFrontMatter(book, { cover: true, toc: true })));
