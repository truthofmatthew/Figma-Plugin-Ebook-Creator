// The one data model every input (Markdown, AI, pasted JSON) converts to, and the renderer reads.

export const LAYOUTS = [
  { id: 'cover', name: 'Cover', hint: 'Book title, subtitle and author on a full-colour page' },
  { id: 'toc', name: 'Contents', hint: 'Numbered list of chapter titles' },
  { id: 'intro', name: 'Intro', hint: 'Title, text on one side, tall image on the other' },
  { id: 'simpletext', name: 'Text', hint: 'Title and flowing text' },
  { id: 'bullet', name: 'Numbered points', hint: 'Numbered points with short explanations' },
  { id: 'image-desc', name: 'Image, then text', hint: 'Large image on top, text below' },
  { id: 'image', name: 'Text, then image', hint: 'Text on top, large image below' },
  { id: 'overview', name: 'Overview', hint: 'Title, a short lead and an image' },
  { id: 'highlight', name: 'Highlight', hint: 'Image on top, text in a coloured card' },
  { id: 'two-column-1', name: 'Two columns + image', hint: 'Two text columns, image below' },
  { id: 'two-column-2', name: 'Image + two columns', hint: 'Image band, then two text columns' },
  { id: 'two-column-3', name: 'Lead, image, columns', hint: 'Lead paragraph, image strip, two columns' },
  { id: 'two-column-4', name: 'Two columns with rule', hint: 'Title, divider line, two columns' },
  { id: 'two-column-5', name: 'Two columns', hint: 'Long text in two columns' },
  { id: 'placeholder', name: 'Full-page image', hint: 'One image filling the page' },
] as const;

export type LayoutId = (typeof LAYOUTS)[number]['id'];
export const LAYOUT_IDS = LAYOUTS.map((l) => l.id) as LayoutId[];
export const isLayoutId = (s: string): s is LayoutId => (LAYOUT_IDS as string[]).includes(s);

export type BlockType = 'heading' | 'paragraph' | 'bullets' | 'numbered' | 'quote' | 'image';
const BLOCK_TYPES: BlockType[] = ['heading', 'paragraph', 'bullets', 'numbered', 'quote', 'image'];

// Text fields may contain **bold** and *italic*.
export interface Item {
  title: string;
  body?: string;
}

// Flat on purpose: the same shape works for hand-written JSON, AI structured output and the renderer.
export interface Block {
  type: BlockType;
  text?: string; // heading, paragraph, quote; image caption
  level?: number; // heading: 1–3
  items?: Item[]; // bullets, numbered
  start?: number; // numbered: first number, when a list continues from the previous page
}

export interface Page {
  layout: LayoutId;
  blocks: Block[];
}

export interface BookSpec {
  title: string;
  subtitle?: string;
  author?: string;
  direction?: 'ltr' | 'rtl';
  pages: Page[];
}

const MAX_PAGES = 500;
const MAX_TEXT = 20000;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const str = (v: unknown, where: string, optional = false): string | undefined => {
  if (v === undefined || v === null) {
    if (optional) return undefined;
    throw new Error(`${where} is missing`);
  }
  if (typeof v !== 'string') throw new Error(`${where} must be text`);
  if (v.length > MAX_TEXT) throw new Error(`${where} is longer than ${MAX_TEXT} characters`);
  return v;
};

function validateBlock(raw: any, where: string): Block {
  if (!raw || typeof raw !== 'object') throw new Error(`${where} must be an object`);
  const type = raw.type ?? raw.kind;
  if (!BLOCK_TYPES.includes(type)) throw new Error(`${where}.type must be one of ${BLOCK_TYPES.join(', ')}`);
  const block: Block = { type };
  const text = str(raw.text, `${where}.text`, true);
  if (text !== undefined && text !== '') block.text = text;
  if (type === 'heading') {
    const level = Number(raw.level ?? 2);
    block.level = level >= 1 && level <= 3 ? Math.round(level) : 2;
  }
  if (type === 'bullets' || type === 'numbered') {
    if (!Array.isArray(raw.items)) throw new Error(`${where}.items must be a list`);
    block.items = raw.items.map((it: any, i: number) => {
      if (typeof it === 'string') return { title: str(it, `${where}.items[${i}]`)! };
      const item: Item = { title: str(it?.title, `${where}.items[${i}].title`)! };
      const body = str(it?.body, `${where}.items[${i}].body`, true);
      if (body) item.body = body;
      return item;
    });
  } else if (type !== 'image' && !block.text) {
    throw new Error(`${where}.text is missing`);
  }
  return block;
}

export function validateBook(raw: unknown): Result<BookSpec> {
  try {
    const r = raw as any;
    if (!r || typeof r !== 'object' || Array.isArray(r)) throw new Error('A book must be a JSON object');
    if (!Array.isArray(r.pages) || r.pages.length === 0) throw new Error('pages must be a non-empty list');
    if (r.pages.length > MAX_PAGES) throw new Error(`A book can have at most ${MAX_PAGES} pages`);
    const book: BookSpec = {
      title: str(r.title, 'title', true) || 'Untitled book',
      pages: r.pages.map((p: any, i: number): Page => {
        const layout = String(p?.layout ?? 'simpletext');
        if (!isLayoutId(layout)) throw new Error(`pages[${i}].layout "${layout}" is not a known layout`);
        const blocks = Array.isArray(p?.blocks) ? p.blocks : [];
        return { layout, blocks: blocks.map((b: any, j: number) => validateBlock(b, `pages[${i}].blocks[${j}]`)) };
      }),
    };
    const subtitle = str(r.subtitle, 'subtitle', true);
    const author = str(r.author, 'author', true);
    if (subtitle) book.subtitle = subtitle;
    if (author) book.author = author;
    if (r.direction === 'rtl' || r.direction === 'ltr') book.direction = r.direction;
    return { ok: true, value: book };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Accepts one book or a list of books (batch mode).
export function parseBookJson(text: string): Result<BookSpec[]> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  const list = Array.isArray(raw) ? raw : [raw];
  if (list.length === 0) return { ok: false, error: 'The list of books is empty' };
  const books: BookSpec[] = [];
  for (let i = 0; i < list.length; i++) {
    const res = validateBook(list[i]);
    if (!res.ok) return { ok: false, error: list.length > 1 ? `Book ${i + 1}: ${res.error}` : res.error };
    books.push(res.value);
  }
  return { ok: true, value: books };
}

// JSON schema for AI structured output: every object closed and every field required.
const ITEM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'body'],
  properties: {
    title: { type: 'string' },
    body: { type: 'string', description: 'Empty string when the item has no explanation' },
  },
};

export const BLOCK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'text', 'level', 'items'],
  properties: {
    type: { type: 'string', enum: BLOCK_TYPES },
    text: { type: 'string', description: 'heading/paragraph/quote text, or a description of the image for image blocks; empty for lists' },
    level: { type: 'integer', description: 'Heading level 1-3; 0 for other blocks' },
    items: { type: 'array', items: ITEM_SCHEMA, description: 'List items for bullets/numbered; empty otherwise' },
  },
};

export const PAGES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['pages'],
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['layout', 'blocks'],
        properties: {
          layout: { type: 'string', enum: LAYOUT_IDS.filter((id) => id !== 'cover' && id !== 'toc') },
          blocks: { type: 'array', items: BLOCK_SCHEMA },
        },
      },
    },
  },
};

export const OUTLINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'subtitle', 'chapters'],
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'summary'],
        properties: { title: { type: 'string' }, summary: { type: 'string' } },
      },
    },
  },
};
