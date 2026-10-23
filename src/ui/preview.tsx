import type { LayoutId } from '../spec';

// Small schematic of each layout: t = title, l = text lines, i = image, c = card, b = colour block.
type Shape = [kind: 't' | 'l' | 'i' | 'c' | 'b', x: number, y: number, w: number, h: number];
const lines = (x: number, y: number, w: number, n: number): Shape[] => Array.from({ length: n }, (_, k) => ['l', x, y + k * 2.4, w, 1]);

const SHAPES: Record<LayoutId, Shape[]> = {
  cover: [['b', 0, 0, 30, 42], ['i', 3, 3, 24, 24], ['t', 3, 30, 18, 3], ['l', 3, 35, 14, 1]],
  toc: [['t', 3, 3, 12, 3], ...lines(3, 9, 24, 12)],
  intro: [['t', 3, 3, 18, 3], ...lines(3, 9, 11, 10), ['i', 16, 9, 11, 30]],
  simpletext: [['t', 3, 3, 18, 3], ...lines(3, 9, 24, 13)],
  bullet: [['t', 3, 3, 18, 3], ['i', 3, 9, 3, 3], ...lines(8, 9.5, 19, 2), ['i', 3, 16, 3, 3], ...lines(8, 16.5, 19, 2), ['i', 3, 23, 3, 3], ...lines(8, 23.5, 19, 2)],
  'image-desc': [['i', 3, 3, 24, 20], ['t', 3, 26, 16, 3], ...lines(3, 31, 24, 4)],
  image: [['t', 3, 3, 16, 3], ...lines(3, 9, 24, 4), ['i', 3, 19, 24, 20]],
  overview: [['t', 3, 3, 16, 3], ...lines(3, 9, 24, 2), ['i', 3, 15, 24, 24]],
  highlight: [['i', 3, 3, 24, 14], ['t', 3, 20, 16, 3], ['c', 3, 25, 24, 14], ...lines(5, 28, 20, 4)],
  'two-column-1': [['t', 3, 3, 18, 3], ...lines(3, 9, 11, 6), ...lines(16, 9, 11, 6), ['i', 3, 25, 24, 14]],
  'two-column-2': [['t', 3, 3, 18, 3], ['i', 3, 9, 24, 11], ...lines(3, 23, 11, 6), ...lines(16, 23, 11, 6)],
  'two-column-3': [['t', 3, 3, 18, 3], ...lines(3, 9, 24, 2), ['i', 3, 15, 24, 6], ...lines(3, 24, 11, 6), ...lines(16, 24, 11, 6)],
  'two-column-4': [['t', 3, 3, 18, 3], ['b', 3, 8.5, 24, 0.6], ...lines(3, 11, 11, 10), ...lines(16, 11, 11, 10)],
  'two-column-5': [['t', 3, 3, 18, 3], ...lines(3, 9, 11, 12), ...lines(16, 9, 11, 12)],
  placeholder: [['i', 3, 3, 24, 36]],
};

const FILL: Record<Shape[0], string> = {
  t: 'var(--ink)',
  l: 'var(--ink-faint)',
  i: 'var(--img)',
  c: 'var(--card)',
  b: 'var(--accent)',
};

export function LayoutPreview({ layout, size = 34 }: { layout: LayoutId; size?: number }) {
  return (
    <svg class="preview" width={size} height={(size * 42) / 30} viewBox="0 0 30 42" aria-hidden="true">
      <rect width="30" height="42" rx="1.5" fill="var(--paper)" />
      {SHAPES[layout].map(([k, x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={k === 'i' || k === 'c' ? 1.2 : 0.5} fill={FILL[k]} />
      ))}
    </svg>
  );
}
