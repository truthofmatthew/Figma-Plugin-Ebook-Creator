// Pure text helpers shared by the UI and the renderer.

export interface Inline {
  plain: string;
  bold: [number, number][];
  italic: [number, number][];
}

// Turns "a **b** *c*" into plain text plus character ranges to style.
export function parseInline(text: string): Inline {
  const out: Inline = { plain: '', bold: [], italic: [] };
  const re = /\*\*(.+?)\*\*|\*(?!\s)(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.plain += text.slice(last, m.index);
    const inner = m[1] ?? m[2];
    const start = out.plain.length;
    out.plain += inner;
    (m[1] !== undefined ? out.bold : out.italic).push([start, start + inner.length]);
    last = m.index + m[0].length;
  }
  out.plain += text.slice(last);
  return out;
}

export const stripInline = (text: string) => parseInline(text).plain;

// Splits text into sentences; a single long sentence falls back to word groups so it can still break across pages.
export function sentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?؟。])\s+/).filter(Boolean);
  if (parts.length > 1 || text.length < 400) return parts.length ? parts : [text];
  const words = text.split(/\s+/);
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += 12) groups.push(words.slice(i, i + 12).join(' '));
  return groups;
}

// True when most letters are Arabic, Persian or Hebrew script.
export function isRtlText(text: string): boolean {
  const rtl = (text.match(/[֐-ࣿיִ-﷿ﹰ-﻿]/g) || []).length;
  const ltr = (text.match(/[A-Za-zÀ-ɏЀ-ӿ]/g) || []).length;
  return rtl > ltr;
}
