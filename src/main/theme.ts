import { getData, setData } from './data';
// Creates (or reuses) the colour variables, text styles and components every page binds to,
// so users restyle a whole book by editing them once.
import { THEME_MODES, type ThemeMode } from '../messages';

export const COLOR_KEYS = ['page', 'title', 'heading', 'body', 'accent', 'onAccent', 'placeholder', 'card'] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

const PALETTES: Record<ThemeMode, Record<ColorKey, string>> = {
  Cream: { page: '#FFFBEF', title: '#027998', heading: '#B30109', body: '#0B5465', accent: '#B30109', onAccent: '#FFFBEF', placeholder: '#E9E1CB', card: '#F5ECD5' },
  Teal: { page: '#0E4A55', title: '#FFFFFF', heading: '#F2C14E', body: '#D8ECEE', accent: '#F2C14E', onAccent: '#0E4A55', placeholder: '#1D6370', card: '#135A67' },
  Night: { page: '#16161A', title: '#F5F5F7', heading: '#8AB4FF', body: '#C9C9D1', accent: '#8AB4FF', onAccent: '#16161A', placeholder: '#2A2A31', card: '#202027' },
};

const FILLS: VariableScope[] = ['FRAME_FILL', 'SHAPE_FILL'];
const SCOPES: Record<ColorKey, VariableScope[]> = {
  page: FILLS,
  card: FILLS,
  placeholder: [...FILLS, 'STROKE_COLOR'],
  accent: [...FILLS, 'TEXT_FILL', 'STROKE_COLOR'],
  title: ['TEXT_FILL'],
  heading: ['TEXT_FILL'],
  body: ['TEXT_FILL', 'SHAPE_FILL'],
  onAccent: ['TEXT_FILL'],
};

export const STYLE_KEYS = ['coverTitle', 'coverSub', 'title', 'heading', 'subheading', 'body', 'quote', 'caption', 'number'] as const;
export type StyleKey = (typeof STYLE_KEYS)[number];

type Role = 'display' | 'body';
const STYLE_SPECS: Record<StyleKey, { name: string; role: Role; size: number; lineHeight: number }> = {
  coverTitle: { name: 'Cover title', role: 'display', size: 44, lineHeight: 110 },
  coverSub: { name: 'Cover subtitle', role: 'body', size: 15, lineHeight: 140 },
  title: { name: 'Title', role: 'display', size: 28, lineHeight: 115 },
  heading: { name: 'Heading', role: 'display', size: 17, lineHeight: 125 },
  subheading: { name: 'Subheading', role: 'display', size: 13, lineHeight: 130 },
  body: { name: 'Body', role: 'body', size: 10.5, lineHeight: 155 },
  quote: { name: 'Quote', role: 'display', size: 15, lineHeight: 140 },
  caption: { name: 'Caption', role: 'body', size: 8.5, lineHeight: 140 },
  number: { name: 'Number', role: 'display', size: 17, lineHeight: 100 },
};

// Roxborough CF and DM Sans were the original fonts; most people don't have them, so fall back.
const FONT_CHOICES: Record<'ltr' | 'rtl', Record<Role, [string, string][]>> = {
  ltr: {
    display: [['Roxborough CF', 'Bold'], ['Playfair Display', 'Bold'], ['DM Serif Display', 'Regular'], ['Lora', 'Bold'], ['Inter', 'Bold']],
    body: [['DM Sans', 'Regular'], ['Inter', 'Regular']],
  },
  rtl: {
    display: [['Vazirmatn', 'Bold'], ['Noto Sans Arabic', 'Bold'], ['Noto Naskh Arabic', 'Bold'], ['Inter', 'Bold']],
    body: [['Vazirmatn', 'Regular'], ['Noto Sans Arabic', 'Regular'], ['Noto Naskh Arabic', 'Regular'], ['Inter', 'Regular']],
  },
};

export interface Theme {
  collection: VariableCollection;
  modeId: string;
  colors: Record<ColorKey, Variable>;
  styles: Record<StyleKey, TextStyle>;
  emphasis(font: FontName, kind: 'bold' | 'italic'): FontName | null;
  badge: ComponentNode | null;
  image: ComponentNode | null;
  paint(key: ColorKey): SolidPaint;
}

const COLLECTION_NAME = 'Ebook theme';
const COMPONENTS_PAGE = 'Ebook components';

async function ensureColors(mode: ThemeMode) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find((c) => c.name === COLLECTION_NAME);
  const created = !collection;
  if (!collection) {
    collection = figma.variables.createVariableCollection(COLLECTION_NAME);
    collection.renameMode(collection.modes[0].modeId, THEME_MODES[0]);
    for (const m of THEME_MODES.slice(1)) {
      try {
        collection.addMode(m);
      } catch {
        break; // the plan's mode limit; the single mode gets the chosen palette below
      }
    }
  }
  const modeByName = new Map(collection.modes.map((m) => [m.name, m.modeId]));
  const vars = (await Promise.all(collection.variableIds.map((id) => figma.variables.getVariableByIdAsync(id)))).filter(
    (v): v is Variable => !!v,
  );
  const colors = {} as Record<ColorKey, Variable>;
  for (const key of COLOR_KEYS) {
    let v = vars.find((x) => x.name === `color/${key}`);
    if (!v) {
      v = figma.variables.createVariable(`color/${key}`, collection, 'COLOR');
      v.scopes = SCOPES[key];
      for (const m of collection.modes) {
        const palette = PALETTES[m.name as ThemeMode] ?? PALETTES.Cream;
        v.setValueForMode(m.modeId, figma.util.rgba(palette[key]));
      }
    }
    colors[key] = v;
  }
  let modeId = modeByName.get(mode);
  if (!modeId) {
    // Only one mode available: repaint it with the chosen palette.
    modeId = collection.modes[0].modeId;
    if (created || collection.modes.length === 1)
      for (const key of COLOR_KEYS) colors[key].setValueForMode(modeId, figma.util.rgba(PALETTES[mode][key]));
  }
  return { collection, modeId, colors };
}

function pickFont(available: Font[], choices: [string, string][]): FontName {
  for (const [family, style] of choices)
    if (available.some((f) => f.fontName.family === family && f.fontName.style === style)) return { family, style };
  return { family: 'Inter', style: choices[choices.length - 1][1] };
}

async function ensureStyles(group: string, scale: number, rtl: boolean, available: Font[]) {
  const existing = await figma.getLocalTextStylesAsync();
  const fonts = {
    display: pickFont(available, FONT_CHOICES[rtl ? 'rtl' : 'ltr'].display),
    body: pickFont(available, FONT_CHOICES[rtl ? 'rtl' : 'ltr'].body),
  };
  const styles = {} as Record<StyleKey, TextStyle>;
  for (const key of STYLE_KEYS) {
    const spec = STYLE_SPECS[key];
    const name = `${group}/${spec.name}`;
    let style = existing.find((s) => s.name === name);
    if (!style) {
      style = figma.createTextStyle();
      style.name = name;
      const font = key === 'body' || key === 'caption' || key === 'coverSub' ? fonts.body : fonts[spec.role];
      await figma.loadFontAsync(font);
      style.fontName = font;
      style.fontSize = Math.round(spec.size * scale * 2) / 2;
      style.lineHeight = { unit: 'PERCENT', value: spec.lineHeight };
    }
    try {
      await figma.loadFontAsync(style.fontName);
    } catch {
      throw new Error(`The font "${style.fontName.family} ${style.fontName.style}" used by text style "${name}" is not installed.`);
    }
    styles[key] = style;
  }
  return styles;
}

function emphasisFinder(available: Font[]) {
  const cache = new Map<string, FontName | null>();
  const order = { bold: ['Bold', 'SemiBold', 'Semi Bold', 'ExtraBold', 'Black', 'Medium'], italic: ['Italic', 'Regular Italic', 'Light Italic'] };
  return (font: FontName, kind: 'bold' | 'italic'): FontName | null => {
    const k = `${font.family}|${font.style}|${kind}`;
    if (!cache.has(k)) {
      const styles = available.filter((f) => f.fontName.family === font.family).map((f) => f.fontName.style);
      // A bold display face is already bold; italic falls back to bold, then to nothing.
      const want = kind === 'italic' && !styles.some((s) => order.italic.includes(s)) ? order.bold : order[kind];
      const style = want.find((s) => styles.includes(s) && s !== font.style);
      cache.set(k, style ? { family: font.family, style } : null);
    }
    return cache.get(k)!;
  };
}

async function ensureComponents(theme: Pick<Theme, 'paint' | 'styles'>, scale: number): Promise<Pick<Theme, 'badge' | 'image'>> {
  if (figma.editorType !== 'figma') return { badge: null, image: null };
  const saved = JSON.parse(getData(figma.root, 'components') || '{}');
  const found = async (id?: string) => {
    const n = id ? await figma.getNodeByIdAsync(id) : null;
    return n && n.type === 'COMPONENT' && !n.removed ? n : null;
  };
  let badge = await found(saved.badge);
  let image = await found(saved.image);
  if (badge && image) return { badge, image };

  let page = figma.root.children.find((p) => p.name === COMPONENTS_PAGE);
  if (!page) {
    page = figma.createPage();
    page.name = COMPONENTS_PAGE;
  }
  await page.loadAsync();

  if (!badge) {
    badge = figma.createComponent();
    badge.name = 'Ebook/Number badge';
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisAlignItems = 'CENTER';
    badge.counterAxisAlignItems = 'CENTER';
    badge.resize(30, 30);
    badge.primaryAxisSizingMode = 'FIXED';
    badge.counterAxisSizingMode = 'FIXED';
    badge.cornerRadius = 8;
    badge.fills = [theme.paint('accent')];
    const t = figma.createText();
    t.textStyleId = theme.styles.number.id;
    t.characters = '1';
    t.fills = [theme.paint('onAccent')];
    badge.appendChild(t);
    t.componentPropertyReferences = { characters: badge.addComponentProperty('Number', 'TEXT', '1') };
    setData(badge, 'scale', String(scale));
    page.appendChild(badge);
  }
  if (!image) {
    image = figma.createComponent();
    image.name = 'Ebook/Image placeholder';
    image.layoutMode = 'VERTICAL';
    image.primaryAxisAlignItems = 'CENTER';
    image.counterAxisAlignItems = 'CENTER';
    image.paddingLeft = image.paddingRight = 16;
    image.resize(320, 200);
    image.primaryAxisSizingMode = 'FIXED';
    image.counterAxisSizingMode = 'FIXED';
    image.cornerRadius = 16;
    image.clipsContent = true;
    image.fills = [theme.paint('placeholder')];
    const t = figma.createText();
    t.textStyleId = theme.styles.caption.id;
    t.characters = 'Image';
    t.textAlignHorizontal = 'CENTER';
    t.fills = [theme.paint('body')];
    t.opacity = 0.7;
    image.appendChild(t);
    t.layoutSizingHorizontal = 'FILL';
    t.componentPropertyReferences = { characters: image.addComponentProperty('Caption', 'TEXT', 'Image') };
    image.x = 60;
    setData(image, 'scale', String(scale));
    page.appendChild(image);
  }
  setData(figma.root, 'components', JSON.stringify({ badge: badge.id, image: image.id }));
  return { badge, image };
}

export async function ensureTheme(opts: { group: string; scale: number; rtl: boolean; mode: ThemeMode }): Promise<Theme> {
  const available = await figma.listAvailableFontsAsync();
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const { collection, modeId, colors } = await ensureColors(opts.mode);
  const paint = (key: ColorKey) =>
    figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', colors[key]);
  const styles = await ensureStyles(`Ebook ${opts.group}${opts.rtl ? ' RTL' : ''}`, opts.scale, opts.rtl, available);
  const emphasis = emphasisFinder(available);
  for (const s of Object.values(styles))
    for (const kind of ['bold', 'italic'] as const) {
      const f = emphasis(s.fontName, kind);
      if (f) await figma.loadFontAsync(f);
    }
  const components = await ensureComponents({ paint, styles }, opts.scale);
  return { collection, modeId, colors, styles, emphasis, paint, ...components };
}
