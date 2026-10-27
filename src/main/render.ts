import { getData, setData } from './data';
import { PAGE_SIZES, type BuildOptions, type PlaceholderInfo } from '../messages';
import { continuationLayout, startOf, takeUnits, unitCount } from '../layout';
import type { Block, BookSpec, LayoutId, Page } from '../spec';
import { parseInline } from '../text';
import { ensureTheme, type ColorKey, type StyleKey, type Theme } from './theme';

export const IMAGE_KEY = 'ebookImage';
const LAST_BUILD_KEY = 'ebookLastBuild';

interface Ctx {
  theme: Theme;
  book: BookSpec;
  w: number;
  h: number;
  s: number;
  margin: number;
  gap: number;
  rtl: boolean;
  layout: LayoutId;
}

type Sizing = 'FILL' | 'HUG' | 'FIXED';

function stack(name: string, dir: 'VERTICAL' | 'HORIZONTAL', spacing: number): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir;
  f.itemSpacing = spacing;
  f.fills = [];
  f.clipsContent = false;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  return f;
}

function add<T extends SceneNode & LayoutMixin>(parent: FrameNode, child: T, h: Sizing = 'FILL', v?: Sizing): T {
  parent.appendChild(child);
  child.layoutSizingHorizontal = h;
  if (v) child.layoutSizingVertical = v;
  return child;
}

// Right-to-left rows read from the right: reverse the child order.
function mirror(row: FrameNode, ctx: Ctx) {
  if (ctx.rtl) for (const c of [...row.children].reverse()) row.appendChild(c);
}

function text(parent: FrameNode, content: string, style: StyleKey, color: ColorKey, ctx: Ctx, width: Sizing = 'FILL'): TextNode {
  const t = figma.createText();
  t.textStyleId = ctx.theme.styles[style].id;
  const { plain, bold, italic } = parseInline(content);
  t.characters = plain || ' ';
  const base = ctx.theme.styles[style].fontName;
  for (const [ranges, kind] of [[bold, 'bold'], [italic, 'italic']] as const) {
    const font = ctx.theme.emphasis(base, kind);
    if (font) for (const [a, b] of ranges) t.setRangeFontName(a, b, font);
  }
  t.fills = [ctx.theme.paint(color)];
  t.textAlignHorizontal = ctx.rtl ? 'RIGHT' : 'LEFT';
  t.textAutoResize = width === 'FILL' ? 'HEIGHT' : 'WIDTH_AND_HEIGHT';
  parent.appendChild(t);
  if (width === 'FILL') t.layoutSizingHorizontal = 'FILL';
  return t;
}

const componentScale = (c: ComponentNode) => Number(getData(c, 'scale')) || 1;

function image(parent: FrameNode, caption: string, ctx: Ctx, size: { w?: number; h?: number } = {}): SceneNode {
  const label = caption.trim() || ctx.book.title;
  let node: InstanceNode | FrameNode;
  if (ctx.theme.image) {
    node = ctx.theme.image.createInstance();
    const key = Object.keys(node.componentProperties).find((k) => k.startsWith('Caption'));
    if (key) node.setProperties({ [key]: label });
  } else {
    node = stack('Image', 'VERTICAL', 0);
    node.primaryAxisAlignItems = node.counterAxisAlignItems = 'CENTER';
    node.fills = [ctx.theme.paint('placeholder')];
    node.clipsContent = true;
    text(node, label, 'caption', 'body', ctx).textAlignHorizontal = 'CENTER';
  }
  node.name = `Image: ${label}`.slice(0, 80);
  node.cornerRadius = 14 * ctx.s;
  setData(node, IMAGE_KEY, label);
  node.resize(size.w ?? 100, size.h ?? 100);
  add(parent, node, size.w ? 'FIXED' : 'FILL', size.h ? 'FIXED' : 'FILL');
  return node;
}

function badge(parent: FrameNode, n: number, ctx: Ctx): SceneNode {
  const c = ctx.theme.badge;
  if (c) {
    const inst = c.createInstance();
    const key = Object.keys(inst.componentProperties).find((k) => k.startsWith('Number'));
    if (key) inst.setProperties({ [key]: String(n) });
    const ratio = ctx.s / componentScale(c);
    if (Math.abs(ratio - 1) > 0.01) inst.rescale(ratio);
    parent.appendChild(inst);
    return inst;
  }
  const f = stack('Number', 'HORIZONTAL', 0);
  f.primaryAxisAlignItems = f.counterAxisAlignItems = 'CENTER';
  f.resize(30 * ctx.s, 30 * ctx.s);
  f.primaryAxisSizingMode = f.counterAxisSizingMode = 'FIXED';
  f.cornerRadius = 8 * ctx.s;
  f.fills = [ctx.theme.paint('accent')];
  text(f, String(n), 'number', 'onAccent', ctx, 'HUG');
  parent.appendChild(f);
  return f;
}

function renderBlock(flow: FrameNode, b: Block, ctx: Ctx): SceneNode {
  const s = ctx.s;
  switch (b.type) {
    case 'heading':
      return text(flow, b.text ?? '', (b.level ?? 2) <= 2 ? 'heading' : 'subheading', 'heading', ctx);
    case 'paragraph':
      return text(flow, b.text ?? '', 'body', 'body', ctx);
    case 'quote': {
      const card = add(flow, stack('Quote', 'VERTICAL', ctx.gap / 2));
      card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 14 * s;
      card.cornerRadius = 10 * s;
      card.fills = [ctx.theme.paint('card')];
      text(card, b.text ?? '', 'quote', 'heading', ctx);
      return card;
    }
    case 'image':
      return image(flow, b.text ?? '', ctx, { h: Math.round((ctx.w - 2 * ctx.margin) * 0.45) });
    case 'bullets': {
      const list = add(flow, stack('List', 'VERTICAL', ctx.gap * 0.5));
      for (const item of b.items ?? []) {
        const row = add(list, stack('Item', 'HORIZONTAL', 8 * s));
        text(row, item.title ? '•' : ' ', 'body', 'accent', ctx, 'HUG');
        const line = item.body ? (item.title ? `**${item.title}:** ${item.body}` : item.body) : item.title;
        text(row, line, 'body', 'body', ctx);
        mirror(row, ctx);
      }
      return list;
    }
    case 'numbered': {
      const list = add(flow, stack(ctx.layout === 'toc' ? 'Contents' : 'Points', 'VERTICAL', ctx.gap * (ctx.layout === 'toc' ? 0.6 : 0.9)));
      (b.items ?? []).forEach((item, i) => {
        const row = add(list, stack('Item', 'HORIZONTAL', ctx.gap * 0.8));
        const n = startOf(b) + i;
        if (ctx.layout === 'toc') {
          row.counterAxisAlignItems = 'CENTER';
          row.paddingBottom = ctx.gap * 0.5;
          row.strokes = [ctx.theme.paint('placeholder')];
          row.strokeWeight = 0;
          row.strokeBottomWeight = 1;
          text(row, String(n).padStart(2, '0'), 'number', 'accent', ctx, 'HUG');
          text(row, item.title, 'subheading', 'body', ctx);
        } else {
          // A continued item (empty title) keeps the space where its number was.
          if (item.title) badge(row, n, ctx);
          else {
            const spacer = add(row, stack('Indent', 'HORIZONTAL', 0), 'FIXED', 'FIXED');
            spacer.resize(30 * s, 1);
          }
          const col = add(row, stack('Point', 'VERTICAL', 4 * s));
          if (item.title) text(col, item.title, 'subheading', 'heading', ctx);
          for (const l of (item.body ?? '').split('\n').filter(Boolean)) text(col, l, 'body', 'body', ctx);
        }
        mirror(row, ctx);
      });
      return list;
    }
  }
}

// Puts as many blocks into `flow` as fit under maxH; returns the ones that did not fit.
function fill(flow: FrameNode, blocks: Block[], maxH: number, ctx: Ctx): Block[] {
  const queue = [...blocks];
  const placed: { node: SceneNode; b: Block }[] = [];
  const fits = () => flow.height <= maxH + 0.5;
  while (queue.length) {
    const b = queue.shift()!;
    const node = renderBlock(flow, b, ctx);
    if (fits()) {
      placed.push({ node, b });
      continue;
    }
    node.remove();
    // Largest leading part of the block that still fits.
    const n = unitCount(b);
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const probe = renderBlock(flow, takeUnits(b, mid)[0], ctx);
      const ok = fits();
      probe.remove();
      if (ok) lo = mid;
      else hi = mid - 1;
    }
    // Nothing fits on an empty page: place one piece anyway so the book always moves forward.
    const k = lo === 0 && placed.length === 0 ? 1 : lo;
    if (k > 0) {
      const [head, rest] = takeUnits(b, k);
      placed.push({ node: renderBlock(flow, head, ctx), b: head });
      if (rest) queue.unshift(rest);
    } else queue.unshift(b);
    break;
  }
  // Don't leave a heading alone at the bottom of a page.
  while (queue.length && placed.length > 1 && placed[placed.length - 1].b.type === 'heading') {
    const p = placed.pop()!;
    p.node.remove();
    queue.unshift(p.b);
  }
  return queue;
}

function newPage(ctx: Ctx, name: string): FrameNode {
  const p = figma.createFrame();
  p.name = name;
  p.resize(ctx.w, ctx.h);
  p.layoutMode = 'VERTICAL';
  p.primaryAxisSizingMode = 'FIXED';
  p.counterAxisSizingMode = 'FIXED';
  p.paddingTop = p.paddingBottom = p.paddingLeft = p.paddingRight = ctx.margin;
  p.itemSpacing = ctx.gap;
  p.fills = [ctx.theme.paint('page')];
  p.clipsContent = true;
  p.setExplicitVariableModeForCollection(ctx.theme.collection, ctx.theme.modeId);
  return p;
}

// Height left for the next child of a page, after the gap before it.
function remaining(p: FrameNode, ctx: Ctx): number {
  const kids = p.children.filter((c) => !('layoutPositioning' in c) || c.layoutPositioning !== 'ABSOLUTE');
  const used = kids.reduce((n, c) => n + c.height, 0) + ctx.gap * kids.length;
  return ctx.h - 2 * ctx.margin - used;
}

function renderPage(ctx: Ctx, page: Page, number: number): { frame: FrameNode; leftover: Block[] } {
  const blocks = [...page.blocks];
  const innerH = ctx.h - 2 * ctx.margin;
  const innerW = ctx.w - 2 * ctx.margin;
  const p = newPage(ctx, `Page ${number}`);
  const takeTitle = () => (blocks[0]?.type === 'heading' ? blocks.shift()!.text : undefined);
  const takeImage = (fallback: string | undefined) => {
    const i = blocks.findIndex((b) => b.type === 'image');
    return i >= 0 ? blocks.splice(i, 1)[0].text ?? '' : fallback ?? '';
  };
  const title = (t?: string) => t && text(p, t, 'title', 'title', ctx);
  const flow = (parent: FrameNode) => add(parent, stack('Text', 'VERTICAL', ctx.gap * 0.8));
  const flowFill = (parent: FrameNode, items: Block[], maxH: number) => fill(flow(parent), items, maxH, ctx);
  const columns = (items: Block[], maxH: number) => {
    const row = add(p, stack('Columns', 'HORIZONTAL', ctx.gap * 1.6));
    const first = flow(row);
    const second = flow(row);
    // Measure everything in one column, then aim for half of it so the columns come out balanced.
    for (const b of items) renderBlock(first, b, ctx);
    const target = Math.min(maxH, first.height / 2 + ctx.gap);
    for (const c of [...first.children]) c.remove();
    const left = fill(first, items, target, ctx);
    const rest = fill(second, left, maxH, ctx);
    mirror(row, ctx);
    return rest;
  };
  const imgMin = innerH * 0.35;
  let leftover: Block[] = [];
  let t: string | undefined;

  switch (page.layout) {
    case 'cover': {
      p.fills = [ctx.theme.paint('accent')];
      const pageTitle = takeTitle() ?? ctx.book.title;
      image(p, takeImage(`Cover illustration for "${pageTitle}"`), ctx);
      text(p, pageTitle, 'coverTitle', 'onAccent', ctx);
      const sub = ctx.book.subtitle ?? (blocks[0]?.type === 'paragraph' ? blocks.shift()!.text : undefined);
      if (sub) text(p, sub, 'coverSub', 'onAccent', ctx);
      if (ctx.book.author) text(p, ctx.book.author, 'caption', 'onAccent', ctx);
      leftover = blocks;
      break;
    }
    case 'toc':
      title(takeTitle() ?? (ctx.rtl ? 'فهرست' : 'Contents'));
      leftover = flowFill(p, blocks, remaining(p, ctx));
      break;
    case 'bullet': {
      title(takeTitle());
      const bar = figma.createRectangle();
      bar.resize(48 * ctx.s, 4 * ctx.s);
      bar.cornerRadius = 2 * ctx.s;
      bar.fills = [ctx.theme.paint('accent')];
      p.appendChild(bar);
      if (ctx.rtl) p.counterAxisAlignItems = 'MAX';
      leftover = flowFill(p, blocks, remaining(p, ctx));
      break;
    }
    case 'intro': {
      title(takeTitle());
      const caption = takeImage(undefined);
      const row = add(p, stack('Intro', 'HORIZONTAL', ctx.gap * 1.6), 'FILL', 'FILL');
      const f = flow(row);
      image(row, caption, ctx, { w: Math.round(innerW * 0.45) });
      leftover = fill(f, blocks, row.height, ctx);
      mirror(row, ctx);
      break;
    }
    case 'image-desc': {
      const img = image(p, takeImage(undefined), ctx, { h: imgMin }) as FrameNode | InstanceNode;
      title(takeTitle());
      leftover = flowFill(p, blocks, remaining(p, ctx));
      img.layoutSizingVertical = 'FILL';
      break;
    }
    case 'image':
    case 'overview':
    case 'two-column-1': {
      t = takeTitle();
      title(t);
      const caption = takeImage(t);
      const room = remaining(p, ctx) - imgMin - ctx.gap;
      leftover =
        page.layout === 'two-column-1'
          ? columns(blocks, room)
          : flowFill(p, blocks, page.layout === 'overview' ? Math.min(room, innerH * 0.3) : room);
      image(p, caption, ctx);
      break;
    }
    case 'highlight': {
      t = takeTitle();
      image(p, takeImage(t), ctx, { h: Math.round(innerH * 0.38) });
      title(t);
      const card = add(p, stack('Highlight', 'VERTICAL', ctx.gap * 0.8));
      card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 18 * ctx.s;
      card.cornerRadius = 14 * ctx.s;
      card.fills = [ctx.theme.paint('card')];
      leftover = fill(card, blocks, card.height + remaining(p, ctx) + ctx.gap, ctx);
      break;
    }
    case 'two-column-2': {
      t = takeTitle();
      title(t);
      image(p, takeImage(t), ctx, { h: Math.round(innerH * 0.3) });
      leftover = columns(blocks, remaining(p, ctx));
      break;
    }
    case 'two-column-3': {
      t = takeTitle();
      title(t);
      const lead = blocks[0]?.type === 'paragraph' ? [blocks.shift()!] : [];
      const before = flowFill(p, lead, innerH * 0.2);
      image(p, takeImage(t), ctx, { h: Math.round(innerH * 0.15) });
      leftover = columns([...before, ...blocks], remaining(p, ctx));
      break;
    }
    case 'two-column-4': {
      title(takeTitle());
      const rule = figma.createRectangle();
      rule.resize(innerW, 2 * ctx.s);
      rule.fills = [ctx.theme.paint('body')];
      add(p, rule, 'FILL', 'FIXED');
      leftover = columns(blocks, remaining(p, ctx));
      break;
    }
    case 'two-column-5':
      title(takeTitle());
      leftover = columns(blocks, remaining(p, ctx));
      break;
    case 'placeholder':
      t = takeTitle();
      image(p, takeImage(t ?? ctx.book.title), ctx);
      leftover = blocks;
      break;
    default:
      title(takeTitle());
      leftover = flowFill(p, blocks, remaining(p, ctx));
  }

  if (page.layout !== 'cover') {
    const num = text(p, String(number), 'caption', 'body', ctx, 'HUG');
    num.layoutPositioning = 'ABSOLUTE';
    num.textAlignHorizontal = 'CENTER';
    num.x = (ctx.w - num.width) / 2;
    num.y = ctx.h - ctx.margin / 2 - num.height / 2;
  }
  return { frame: p, leftover };
}

export interface BuildResult {
  books: number;
  pages: number;
  warnings: string[];
}

export async function buildBooks(
  books: BookSpec[],
  options: BuildOptions,
  progress: (done: number, total: number) => void,
): Promise<BuildResult> {
  const slides = figma.editorType === 'slides';
  const sizeKey = slides ? 'slides' : options.size;
  const size = PAGE_SIZES[sizeKey];
  const themes = new Map<boolean, Theme>();
  const total = books.reduce((n, b) => n + b.pages.length, 0);
  const warnings: string[] = [];
  const built: SceneNode[] = [];
  let done = 0;
  let pageCount = 0;

  let x = 0;
  for (const n of figma.currentPage.children) x = Math.max(x, n.x + n.width + 200);
  let y = 0;

  for (const book of books) {
    const rtl = book.direction === 'rtl';
    if (!themes.has(rtl))
      themes.set(rtl, await ensureTheme({ group: size.label.split(' ')[0], scale: size.scale, rtl, mode: options.mode }));
    const s = size.scale;
    const ctx: Ctx = {
      theme: themes.get(rtl)!,
      book,
      w: size.w,
      h: size.h,
      s,
      margin: Math.round(Math.min(size.w, size.h) * 0.09),
      gap: Math.round(12 * s),
      rtl,
      layout: 'simpletext',
    };
    const frames: FrameNode[] = [];
    for (const page of book.pages) {
      let current: Page = page;
      for (let guard = 0; guard < 50; guard++) {
        ctx.layout = current.layout;
        const { frame, leftover } = renderPage(ctx, current, frames.length + 1);
        frames.push(frame);
        if (leftover.length === 0) break;
        if (leftover.length === current.blocks.length && leftover.every((b, i) => b === current.blocks[i]) && current.layout === continuationLayout(current.layout)) {
          warnings.push(`"${book.title}": some content could not be placed on page ${frames.length}.`);
          break;
        }
        current = { layout: continuationLayout(current.layout), blocks: leftover };
      }
      progress(++done, total);
      await new Promise((r) => setTimeout(r, 0)); // let progress messages reach the UI
    }
    pageCount += frames.length;

    if (slides) {
      for (const f of frames) {
        const slide = figma.createSlide();
        slide.appendChild(f);
        f.x = f.y = 0;
        built.push(slide);
      }
      continue;
    }
    const pad = Math.round(80 * s);
    const between = Math.round(40 * s);
    const section = figma.createSection();
    section.name = book.title;
    section.x = x;
    section.y = y;
    frames.forEach((f, i) => {
      section.appendChild(f);
      f.x = pad + i * (size.w + between);
      f.y = pad;
    });
    section.resizeWithoutConstraints(pad * 2 + frames.length * size.w + (frames.length - 1) * between, pad * 2 + size.h);
    y += section.height + 200;
    built.push(section);
  }

  setData(figma.currentPage, LAST_BUILD_KEY, JSON.stringify(built.map((n) => n.id)));
  if (!slides) {
    figma.currentPage.selection = built;
    figma.viewport.scrollAndZoomIntoView(built);
  }
  return { books: books.length, pages: pageCount, warnings };
}

// Pages to export or fill: the selection if it has any, otherwise the last build.
async function targets(): Promise<{ name: string; pages: SceneNode[] }> {
  const framesOf = (n: SceneNode): SceneNode[] =>
    n.type === 'SECTION' ? n.children.filter((c) => c.type === 'FRAME').sort((a, b) => a.y - b.y || a.x - b.x) : n.type === 'FRAME' || n.type === 'SLIDE' ? [n] : [];
  let roots: SceneNode[] = [...figma.currentPage.selection];
  if (figma.editorType === 'slides' && roots.length === 0) roots = figma.getSlideGrid().flat();
  if (roots.length === 0) {
    const ids: string[] = JSON.parse(getData(figma.currentPage, LAST_BUILD_KEY) || '[]');
    roots = (await Promise.all(ids.map((id) => figma.getNodeByIdAsync(id)))).filter((n): n is SceneNode => !!n && !n.removed && 'visible' in n);
  }
  const name = roots.find((r) => r.type === 'SECTION')?.name ?? 'ebook';
  return { name, pages: roots.flatMap(framesOf) };
}

export async function exportPdf(): Promise<{ name: string; parts: Uint8Array[] }> {
  const { name, pages } = await targets();
  if (pages.length === 0) throw new Error('Select the book (its section or pages) to export.');
  const parts: Uint8Array[] = [];
  for (const p of pages) parts.push(await p.exportAsync({ format: 'PDF' }));
  return { name, parts };
}

export async function listPlaceholders(): Promise<PlaceholderInfo[]> {
  const { pages } = await targets();
  const scope = pages.length ? pages : [figma.currentPage];
  const found = new Map<string, PlaceholderInfo>();
  for (const root of scope) {
    if (!('findAll' in root)) continue;
    for (const n of (root as ChildrenMixin).findAll((n) => getData(n, IMAGE_KEY) !== '' && getData(n, 'ebookImageDone') === ''))
      found.set(n.id, { id: n.id, caption: getData(n, IMAGE_KEY), width: n.width, height: n.height });
  }
  return [...found.values()];
}

export async function setImage(id: string, bytes: Uint8Array) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node || !('fills' in node)) throw new Error('That image placeholder no longer exists.');
  const img = figma.createImage(bytes);
  (node as GeometryMixin).fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
  if ('children' in node) for (const c of node.children) c.visible = false;
  setData(node, 'ebookImageDone', '1');
}
