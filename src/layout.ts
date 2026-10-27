// Pure page-flow helpers used by the renderer.
import type { Block, LayoutId } from './spec';
import { sentences } from './text';

export const startOf = (b: Block) => b.start ?? 1;

// How many pieces a block can be cut into when it runs past the end of a page (1 = can't be cut).
export function unitCount(b: Block): number {
  if ((b.type === 'paragraph' || b.type === 'quote') && b.text) return sentences(b.text).length;
  if ((b.type === 'bullets' || b.type === 'numbered') && b.items) {
    if (b.items.length > 1) return b.items.length;
    return b.items[0]?.body ? sentences(b.items[0].body).length : 1;
  }
  return 1;
}

// The first k pieces of a block, and the rest (null when k covers it all).
export function takeUnits(b: Block, k: number): [Block, Block | null] {
  const n = unitCount(b);
  if (k >= n) return [b, null];
  if (b.type === 'paragraph' || b.type === 'quote') {
    const s = sentences(b.text!);
    return [{ ...b, text: s.slice(0, k).join(' ') }, { ...b, text: s.slice(k).join(' ') }];
  }
  const items = b.items!;
  if (items.length > 1)
    return [
      { ...b, items: items.slice(0, k) },
      { ...b, items: items.slice(k), start: startOf(b) + k },
    ];
  // One long item: the second half keeps its number but not the repeated title.
  const s = sentences(items[0].body!);
  return [
    { ...b, items: [{ ...items[0], body: s.slice(0, k).join(' ') }] },
    { ...b, items: [{ title: '', body: s.slice(k).join(' ') }], start: startOf(b) },
  ];
}

// Layout for the extra page that takes text which did not fit.
export function continuationLayout(layout: LayoutId): LayoutId {
  if (layout.startsWith('two-column')) return 'two-column-5';
  if (layout === 'bullet' || layout === 'toc') return layout;
  return 'simpletext';
}
