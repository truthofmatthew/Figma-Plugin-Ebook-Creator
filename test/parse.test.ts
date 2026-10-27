import { describe, expect, it } from 'vitest';
import { autoLayout, parseMarkdown, toMarkdown, withFrontMatter } from '../src/markdown';
import { parseBookJson, validateBook } from '../src/spec';
import { isRtlText, parseInline, sentences } from '../src/text';
import { continuationLayout, takeUnits, unitCount } from '../src/layout';

describe('page flow helpers', () => {
  it('cuts paragraphs by sentence and lists by item, keeping numbering', () => {
    const p = { type: 'paragraph' as const, text: 'A. B. C.' };
    expect(unitCount(p)).toBe(3);
    expect(takeUnits(p, 2)).toEqual([{ type: 'paragraph', text: 'A. B.' }, { type: 'paragraph', text: 'C.' }]);
    const list = { type: 'numbered' as const, items: [{ title: 'a' }, { title: 'b' }, { title: 'c' }] };
    expect(takeUnits(list, 1)[1]).toEqual({ type: 'numbered', items: [{ title: 'b' }, { title: 'c' }], start: 2 });
    const one = { type: 'numbered' as const, items: [{ title: 'a', body: 'X. Y.' }], start: 4 };
    expect(takeUnits(one, 1)).toEqual([
      { type: 'numbered', items: [{ title: 'a', body: 'X.' }], start: 4 },
      { type: 'numbered', items: [{ title: '', body: 'Y.' }], start: 4 },
    ]);
    expect(takeUnits(p, 3)).toEqual([p, null]);
    expect(continuationLayout('two-column-2')).toBe('two-column-5');
    expect(continuationLayout('image-desc')).toBe('simpletext');
  });
});

describe('parseMarkdown', () => {
  it('splits pages on h1 and picks layouts', () => {
    const { book, auto } = parseMarkdown(`# Branding 101

Branding is how people see you.

# Chapter 2

1. **The Essence of Branding**
   What a brand is.
2. **Why it matters**
`);
    expect(book.title).toBe('Branding 101');
    expect(book.pages.map((p) => p.layout)).toEqual(['simpletext', 'bullet']);
    expect(auto).toEqual([true, true]);
    expect(book.pages[1].blocks[1]).toEqual({
      type: 'numbered',
      items: [{ title: 'The Essence of Branding', body: 'What a brand is.' }, { title: 'Why it matters' }],
    });
  });

  it('reads layout comments and warns on unknown ones', () => {
    const { book, auto, warnings } = parseMarkdown(`<!-- layout: two-column-4 -->
## A
Text

<!-- layout: nope -->
## B
Text`);
    expect(book.pages.map((p) => p.layout)).toEqual(['two-column-4', 'simpletext']);
    expect(auto).toEqual([false, true]);
    expect(warnings).toEqual([{ line: 5, message: 'Unknown layout "nope", picked one automatically' }]);
  });

  it('keeps reading version 0.x markers and ChatGPT-style bold headings', () => {
    const { book } = parseMarkdown(`#>page-bullet<#
**Part I: Understanding the Fundamentals**
Intro text here.
1. **Brand Strategy:**
   - Define your audience.
   - *Logo:* Make it unique.`);
    expect(book.pages).toHaveLength(1);
    expect(book.pages[0].layout).toBe('bullet');
    expect(book.pages[0].blocks).toEqual([
      { type: 'heading', level: 2, text: 'Part I: Understanding the Fundamentals' },
      { type: 'paragraph', text: 'Intro text here.' },
      { type: 'numbered', items: [{ title: 'Brand Strategy', body: 'Define your audience.\n*Logo:* Make it unique.' }] },
    ]);
  });

  it('turns image-only paragraphs, quotes and bullets into blocks', () => {
    const { book } = parseMarkdown(`![A cosy reading corner](x.png)

> Stay curious.

- **Logo:** unique
- Colours`);
    expect(book.pages[0].layout).toBe('image-desc');
    expect(book.pages[0].blocks).toEqual([
      { type: 'image', text: 'A cosy reading corner' },
      { type: 'quote', text: 'Stay curious.' },
      { type: 'bullets', items: [{ title: 'Logo', body: 'unique' }, { title: 'Colours' }] },
    ]);
  });

  it('detects right-to-left text', () => {
    expect(parseMarkdown('# راهنمای برند\n\nمتن فارسی').book.direction).toBe('rtl');
    expect(parseMarkdown('# Hello').book.direction).toBeUndefined();
  });

  it('round-trips through toMarkdown', () => {
    const md = `<!-- book: {"title":"T","subtitle":"S"} -->
<!-- layout: overview -->
# One
Lead with **bold**.

![Picture](image)

<!-- layout: bullet -->
## Two
1. **First**
   Body line
2. **Second**

> Quote`;
    const first = parseMarkdown(md).book;
    expect(first.subtitle).toBe('S');
    const second = parseMarkdown(toMarkdown(first)).book;
    expect(second).toEqual(first);
  });
});

describe('autoLayout', () => {
  it('handles image-only and long pages', () => {
    expect(autoLayout([{ type: 'image', text: '' }])).toBe('placeholder');
    expect(autoLayout([{ type: 'paragraph', text: 'x'.repeat(2000) }])).toBe('two-column-5');
    expect(autoLayout([{ type: 'quote', text: 'q' }])).toBe('highlight');
  });
});

describe('withFrontMatter', () => {
  it('adds a cover and contents built from h1 headings', () => {
    const { book } = parseMarkdown('# A\n\ntext\n\n# B\n\ntext');
    const full = withFrontMatter(book, { cover: true, toc: true });
    expect(full.pages.map((p) => p.layout)).toEqual(['cover', 'toc', 'simpletext', 'simpletext']);
    expect(full.pages[1].blocks[1].items).toEqual([{ title: 'A' }, { title: 'B' }]);
    expect(withFrontMatter(full, { cover: true, toc: true }).pages).toHaveLength(4);
  });
});

describe('validateBook / parseBookJson', () => {
  it('accepts AI-shaped blocks and normalises empty fields', () => {
    const res = validateBook({
      title: 'X',
      pages: [{ layout: 'bullet', blocks: [{ type: 'numbered', text: '', level: 0, items: [{ title: 'a', body: '' }] }] }],
    });
    expect(res).toEqual({ ok: true, value: { title: 'X', pages: [{ layout: 'bullet', blocks: [{ type: 'numbered', items: [{ title: 'a' }] }] }] } });
  });

  it('rejects bad input with a location', () => {
    expect(parseBookJson('{')).toMatchObject({ ok: false });
    expect(parseBookJson('{"pages":[{"layout":"zzz","blocks":[]}]}')).toEqual({ ok: false, error: 'pages[0].layout "zzz" is not a known layout' });
    expect(parseBookJson('[{"pages":[{"layout":"toc","blocks":[]}]},{"pages":[]}]')).toEqual({ ok: false, error: 'Book 2: pages must be a non-empty list' });
  });
});

describe('text helpers', () => {
  it('parseInline finds bold and italic ranges', () => {
    expect(parseInline('a **bc** *d*')).toEqual({ plain: 'a bc d', bold: [[2, 4]], italic: [[5, 6]] });
  });
  it('sentences splits on sentence ends, long run-ons into word groups', () => {
    expect(sentences('One. Two three? Four!')).toEqual(['One.', 'Two three?', 'Four!']);
    expect(sentences('word')).toEqual(['word']);
    expect(sentences(Array(120).fill('word').join(' '))).toHaveLength(10);
  });
  it('isRtlText', () => {
    expect(isRtlText('سلام world')).toBe(false);
    expect(isRtlText('سلام دنیا')).toBe(true);
  });
});
