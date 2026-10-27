import { fromMarkdown } from 'mdast-util-from-markdown';
import type { List, ListItem, PhrasingContent, RootContent } from 'mdast';
import { type Block, type BookSpec, type Item, type LayoutId, type Page, isLayoutId } from './spec';
import { isRtlText, stripInline } from './text';

export interface Warning {
  line: number;
  message: string;
}

export interface ParseResult {
  book: BookSpec;
  auto: boolean[]; // per page: layout was picked automatically
  warnings: Warning[];
}

const LAYOUT_COMMENT = /<!--\s*layout:\s*([\w-]+)\s*-->/;
const BOOK_COMMENT = /<!--\s*book:\s*(\{[\s\S]*\})\s*-->/;
// Version 0.x markers, e.g. #>page-bullet<#
const LEGACY_MARKER = /^\s*#>page-([\w-]+)<#\s*$/gm;

function inline(nodes: PhrasingContent[]): string {
  return nodes
    .map((n): string => {
      switch (n.type) {
        case 'text':
        case 'inlineCode':
          return n.value;
        case 'strong':
          return `**${inline(n.children)}**`;
        case 'emphasis':
          return `*${inline(n.children)}*`;
        case 'link':
        case 'delete':
          return inline(n.children);
        case 'break':
          return '\n';
        default:
          return '';
      }
    })
    .join('');
}

// "**Logo:** Your logo should…" -> title "Logo", body "Your logo should…"
function splitTitle(line: string): Item {
  const m = line.match(/^\*\*(.+?):?\*\*:?\s+(.+)$/s) || line.match(/^\*(.+?):?\*:?\s+(.+)$/s);
  if (m) return { title: m[1].trim(), body: m[2].trim() };
  return { title: line.replace(/^\*\*(.+)\*\*$/, '$1').replace(/:$/, '').trim() };
}

function listText(list: List): string[] {
  return list.children.flatMap((li) => itemLines(li));
}

function itemLines(li: ListItem): string[] {
  return li.children.flatMap((c) =>
    c.type === 'paragraph' ? [inline(c.children)] : c.type === 'list' ? listText(c) : [],
  );
}

function listBlock(list: List): Block {
  const items = list.children.map((li) => {
    const [first, ...rest] = li.children;
    const head = first?.type === 'paragraph' ? splitTitle(inline(first.children).replace(/\n/g, ' ')) : { title: '' };
    const restLines = rest.flatMap((c) =>
      c.type === 'paragraph' ? [inline(c.children)] : c.type === 'list' ? listText(c) : [],
    );
    const body = [head.body, ...restLines].filter(Boolean).join('\n');
    return body ? { title: head.title, body } : { title: head.title };
  });
  return { type: list.ordered ? 'numbered' : 'bullets', items: items.filter((i) => i.title || i.body) };
}

// Picks a layout from what is on the page.
export function autoLayout(blocks: Block[]): LayoutId {
  const has = (t: Block['type']) => blocks.some((b) => b.type === t);
  const textLength = blocks.reduce(
    (n, b) => n + (b.text?.length ?? 0) + (b.items ?? []).reduce((m, i) => m + i.title.length + (i.body?.length ?? 0), 0),
    0,
  );
  if (blocks.length > 0 && blocks.every((b) => b.type === 'image')) return 'placeholder';
  if (has('numbered')) return 'bullet';
  if (has('image')) return blocks[0].type === 'image' ? 'image-desc' : 'overview';
  if (has('quote')) return 'highlight';
  if (textLength > 1800) return 'two-column-5';
  return 'simpletext';
}

export function parseMarkdown(source: string): ParseResult {
  const md = source.replace(/\r\n?/g, '\n').replace(LEGACY_MARKER, (_, id) => `<!-- layout: ${id} -->`);
  const tree = fromMarkdown(md);
  const warnings: Warning[] = [];
  const pages: { blocks: Block[]; layout?: LayoutId }[] = [{ blocks: [] }];
  const book: BookSpec = { title: '', pages: [] };
  const current = () => pages[pages.length - 1];
  const newPage = (layout?: LayoutId) => {
    if (current().blocks.length === 0 && !current().layout) current().layout = layout;
    else pages.push({ blocks: [], layout });
  };
  const push = (b: Block) => current().blocks.push(b);

  for (const node of tree.children as RootContent[]) {
    const line = node.position?.start.line ?? 0;
    switch (node.type) {
      case 'html': {
        const meta = node.value.match(BOOK_COMMENT);
        if (meta) {
          try {
            const m = JSON.parse(meta[1]);
            for (const k of ['title', 'subtitle', 'author'] as const) if (typeof m[k] === 'string') book[k] = m[k];
          } catch {
            warnings.push({ line, message: 'The book details comment is not valid JSON' });
          }
          break;
        }
        const lm = node.value.match(LAYOUT_COMMENT);
        if (!lm) break;
        const id = lm[1].toLowerCase();
        if (isLayoutId(id)) newPage(id);
        else {
          warnings.push({ line, message: `Unknown layout "${id}", picked one automatically` });
          newPage();
        }
        break;
      }
      case 'thematicBreak':
        newPage();
        break;
      case 'heading': {
        const text = inline(node.children).replace(/\n/g, ' ').trim();
        if (!text) break;
        if (node.depth === 1 && current().blocks.length > 0) newPage();
        if (node.depth === 1 && !book.title) book.title = stripInline(text);
        push({ type: 'heading', level: Math.min(node.depth, 3), text });
        break;
      }
      case 'paragraph': {
        const images = node.children.filter((c) => c.type === 'image');
        if (images.length > 0 && node.children.every((c) => c.type === 'image' || (c.type === 'text' && !c.value.trim()))) {
          for (const img of images) if (img.type === 'image') push({ type: 'image', text: img.alt || img.title || '' });
          break;
        }
        let para: string[] = [];
        const flush = () => {
          if (para.length) push({ type: 'paragraph', text: para.join(' ') });
          para = [];
        };
        for (const raw of inline(node.children).split('\n')) {
          const l = raw.trim();
          if (!l) continue;
          // Whole-line bold, as AI chat output uses for headings.
          const h = l.match(/^\*\*([^*]+?)\*\*:?$/);
          if (h) {
            flush();
            push({ type: 'heading', level: 2, text: h[1].replace(/:$/, '').trim() });
          } else para.push(l);
        }
        flush();
        break;
      }
      case 'list':
        push(listBlock(node));
        break;
      case 'blockquote': {
        const text = node.children
          .map((c) => (c.type === 'paragraph' ? inline(c.children) : ''))
          .filter(Boolean)
          .join('\n');
        if (text) push({ type: 'quote', text });
        break;
      }
      case 'code':
        if (node.value.trim()) push({ type: 'paragraph', text: node.value });
        break;
      case 'table':
        for (const row of node.children)
          push({ type: 'paragraph', text: row.children.map((cell) => inline(cell.children)).join(' · ') });
        break;
    }
  }

  const kept = pages.filter((p) => p.blocks.length > 0 || p.layout === 'placeholder');
  book.pages = kept.map((p): Page => ({ layout: p.layout ?? autoLayout(p.blocks), blocks: p.blocks }));
  if (!book.title) {
    const firstHeading = book.pages.flatMap((p) => p.blocks).find((b) => b.type === 'heading');
    book.title = firstHeading?.text ? stripInline(firstHeading.text) : 'Untitled book';
  }
  if (isRtlText(md)) book.direction = 'rtl';
  return { book, auto: kept.map((p) => !p.layout), warnings };
}

export function toMarkdown(book: BookSpec): string {
  const meta: Record<string, string> = { title: book.title };
  if (book.subtitle) meta.subtitle = book.subtitle;
  if (book.author) meta.author = book.author;
  const out = [`<!-- book: ${JSON.stringify(meta)} -->`];
  for (const page of book.pages) {
    out.push(`<!-- layout: ${page.layout} -->`);
    for (const b of page.blocks) {
      switch (b.type) {
        case 'heading':
          out.push(`${'#'.repeat(b.level ?? 2)} ${b.text}`);
          break;
        case 'paragraph':
          out.push(b.text ?? '');
          break;
        case 'quote':
          out.push((b.text ?? '').split('\n').map((l) => `> ${l}`).join('\n'));
          break;
        case 'image':
          out.push(`![${(b.text ?? '').replace(/[[\]]/g, '')}](image)`);
          break;
        case 'bullets':
          out.push((b.items ?? []).map((i) => (i.body ? `- **${i.title}:** ${i.body.replace(/\n/g, ' ')}` : `- ${i.title}`)).join('\n'));
          break;
        case 'numbered':
          out.push(
            (b.items ?? [])
              .map((i, n) => {
                const head = `${n + 1}. **${i.title}**`;
                return i.body ? `${head}\n\n${i.body.split('\n').map((l) => `   ${l}`).join('\n\n')}` : head;
              })
              .join('\n\n'),
          );
          break;
      }
    }
  }
  return out.join('\n\n') + '\n';
}

// Adds a cover and a contents page in front, unless the book already has them.
export function withFrontMatter(book: BookSpec, opts: { cover: boolean; toc: boolean }): BookSpec {
  const pages = [...book.pages];
  if (opts.toc && !pages.some((p) => p.layout === 'toc')) {
    // One entry per page that opens with a heading of level 1 or 2.
    const top = pages.map((p) => p.blocks[0]).filter((b) => b?.type === 'heading' && (b.level ?? 2) <= 2);
    if (top.length > 1)
      pages.unshift({
        layout: 'toc',
        blocks: [
          { type: 'heading', level: 1, text: book.direction === 'rtl' ? 'فهرست' : 'Contents' },
          { type: 'numbered', items: top.map((b) => ({ title: stripInline(b.text ?? '') })) },
        ],
      });
  }
  if (opts.cover && !pages.some((p) => p.layout === 'cover')) pages.unshift({ layout: 'cover', blocks: [] });
  return { ...book, pages };
}
