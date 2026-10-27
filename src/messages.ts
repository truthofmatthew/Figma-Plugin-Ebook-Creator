import type { BookSpec } from './spec';

export const PAGE_SIZES = {
  a4: { label: 'A4', w: 595, h: 842, scale: 1 },
  letter: { label: 'US Letter', w: 612, h: 792, scale: 1 },
  '6x9': { label: '6 × 9 in', w: 432, h: 648, scale: 0.8 },
  square: { label: 'Square', w: 640, h: 640, scale: 1 },
  slides: { label: 'Slide 1920 × 1080', w: 1920, h: 1080, scale: 2.2 },
} as const;
export type PageSize = keyof typeof PAGE_SIZES;

export const THEME_MODES = ['Cream', 'Teal', 'Night'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export interface BuildOptions {
  size: PageSize;
  mode: ThemeMode;
}

export type Provider = 'anthropic' | 'openai' | 'gemini';

export interface Settings {
  provider: Provider;
  keys: Record<Provider, string>;
  models: Record<Provider, string>;
  imageModel: string; // OpenAI image model; images use keys.openai
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  keys: { anthropic: '', openai: '', gemini: '' },
  models: { anthropic: 'claude-opus-5-5', openai: 'gpt-5', gemini: 'gemini-2.5-flash' },
  imageModel: 'gpt-image-1',
};

export interface PlaceholderInfo {
  id: string;
  caption: string;
  width: number;
  height: number;
}

export type ToMain =
  | { type: 'build'; books: BookSpec[]; options: BuildOptions }
  | { type: 'export-pdf' }
  | { type: 'list-placeholders' }
  | { type: 'set-image'; id: string; bytes: Uint8Array }
  | { type: 'save-settings'; settings: Settings }
  | { type: 'notify'; message: string; error?: boolean }
  | { type: 'resize'; width: number; height: number };

export type ToUI =
  | { type: 'init'; settings: Settings; editorType: string }
  | { type: 'progress'; done: number; total: number }
  | { type: 'built'; books: number; pages: number; warnings: string[] }
  | { type: 'error'; message: string }
  | { type: 'pdf-parts'; name: string; parts: Uint8Array[] }
  | { type: 'placeholders'; items: PlaceholderInfo[] }
  | { type: 'image-set'; id: string };
