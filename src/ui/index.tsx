import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import EXAMPLE from '../../examples/small-brand-playbook.md';
import { autoLayout, parseMarkdown, toMarkdown, withFrontMatter } from '../markdown';
import { DEFAULT_SETTINGS, PAGE_SIZES, type PageSize, type PlaceholderInfo, type Settings, THEME_MODES, type ThemeMode, type ToMain, type ToUI } from '../messages';
import { type BookSpec, LAYOUTS, type LayoutId, parseBookJson } from '../spec';
import { stripInline } from '../text';
import { COPY_PROMPT, generateBook, generateImage } from './ai';
import { downloadPdf } from './pdf';
import { LayoutPreview } from './preview';

const post = (msg: ToMain) => parent.postMessage({ pluginMessage: msg }, '*');
const notify = (message: string, error = false) => post({ type: 'notify', message, error });

type Step = 'write' | 'layout' | 'build';
type Source = 'paste' | 'generate' | 'json';

const SWATCH: Record<ThemeMode, [string, string]> = { Cream: ['#FFFBEF', '#B30109'], Teal: ['#0E4A55', '#F2C14E'], Night: ['#16161A', '#8AB4FF'] };

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Figma's plugin iframe often blocks the Clipboard API.
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  notify('Prompt copied. Paste it into any AI chat, then paste the answer here.');
}

function pageLabel(blocks: BookSpec['pages'][number]['blocks']) {
  const b = blocks.find((x) => x.type === 'heading') ?? blocks[0];
  const text = b?.text ?? b?.items?.[0]?.title ?? '';
  return stripInline(text) || (b?.type === 'image' ? 'Image' : 'Untitled page');
}

function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [editor, setEditor] = useState('figma');
  const [step, setStep] = useState<Step>('write');
  const [source, setSource] = useState<Source>('paste');
  const [showSettings, setShowSettings] = useState(false);

  const [md, setMd] = useState('');
  const [overrides, setOverrides] = useState<Record<number, LayoutId>>({});
  const [batch, setBatch] = useState<BookSpec[] | null>(null);
  const [json, setJson] = useState('');

  const [req, setReq] = useState({ topic: '', audience: '', tone: '', language: 'English', chapters: 5 });
  const [genStatus, setGenStatus] = useState('');
  const [generating, setGenerating] = useState(false);

  const [size, setSize] = useState<PageSize>('a4');
  const [mode, setMode] = useState<ThemeMode>('Cream');
  const [cover, setCover] = useState(true);
  const [toc, setToc] = useState(true);
  const [rtl, setRtl] = useState<boolean | null>(null); // null = follow the text
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [built, setBuilt] = useState<{ pages: number; books: number; warnings: string[] } | null>(null);
  const [error, setError] = useState('');
  const [imageStatus, setImageStatus] = useState('');
  const pendingImages = useRef<PlaceholderInfo[] | null>(null);

  const parsed = useMemo(() => parseMarkdown(md), [md]);
  const pages = parsed.book.pages.map((p, i) => ({ ...p, layout: overrides[i] ?? p.layout }));
  const book: BookSpec = { ...parsed.book, pages, direction: (rtl ?? parsed.book.direction === 'rtl') ? 'rtl' : 'ltr' };
  const books = batch ?? (pages.length ? [book] : []);
  const isSlides = editor === 'slides';

  useEffect(() => {
    window.onmessage = async (e: MessageEvent) => {
      const msg = e.data?.pluginMessage as ToUI | undefined;
      if (!msg) return;
      switch (msg.type) {
        case 'init':
          setSettings(msg.settings);
          setEditor(msg.editorType);
          if (msg.editorType === 'slides') setSize('slides');
          break;
        case 'progress':
          setProgress({ done: msg.done, total: msg.total });
          break;
        case 'built':
          setProgress(null);
          setBuilt(msg);
          break;
        case 'error':
          setProgress(null);
          setError(msg.message);
          setImageStatus('');
          break;
        case 'pdf-parts':
          try {
            await downloadPdf(msg.name, msg.parts);
          } catch (err) {
            setError(`Could not build the PDF: ${(err as Error).message}`);
          }
          break;
        case 'placeholders':
          pendingImages.current = msg.items;
          fillNextImage();
          break;
        case 'image-set':
          fillNextImage();
          break;
      }
    };
  });

  const setText = (text: string) => {
    setMd(text);
    setOverrides({});
    setBatch(null);
    setBuilt(null);
  };

  const saveSettings = (next: Settings) => {
    setSettings(next);
    post({ type: 'save-settings', settings: next });
  };

  const runGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      const result = await generateBook(settings, req, setGenStatus);
      setText(toMarkdown(result));
      setSource('paste');
      setGenStatus(`Done: ${result.pages.length} pages. Check the text below, then go to Layout.`);
    } catch (e) {
      setError((e as Error).message);
      setGenStatus('');
    } finally {
      setGenerating(false);
    }
  };

  const useJson = () => {
    setError('');
    const res = parseBookJson(json);
    if (!res.ok) return setError(res.error);
    if (res.value.length === 1) {
      setText(toMarkdown(res.value[0]));
      setSource('paste');
      setStep('layout');
    } else {
      setText('');
      setBatch(res.value);
      setStep('build');
    }
  };

  const create = () => {
    setError('');
    setBuilt(null);
    setProgress({ done: 0, total: books.reduce((n, b) => n + b.pages.length, 0) });
    post({ type: 'build', books: books.map((b) => withFrontMatter(b, { cover, toc })), options: { size, mode } });
  };

  // Placeholders are filled one at a time so a failure keeps the images already made.
  const fillNextImage = async () => {
    const queue = pendingImages.current;
    if (!queue) return;
    const next = queue.shift();
    if (!next) {
      pendingImages.current = null;
      setImageStatus('All images are in place.');
      return;
    }
    const total = queue.length + 1;
    setImageStatus(`Generating image (${total} left): ${next.caption}`);
    try {
      const bytes = await generateImage(settings, next.caption, book.title, next.width, next.height);
      post({ type: 'set-image', id: next.id, bytes });
    } catch (e) {
      pendingImages.current = null;
      setImageStatus('');
      setError((e as Error).message);
    }
  };

  const steps: [Step, string][] = [
    ['write', 'Write'],
    ['layout', 'Layout'],
    ['build', 'Build'],
  ];

  if (showSettings)
    return <SettingsView settings={settings} onSave={(s) => { saveSettings(s); setShowSettings(false); }} onClose={() => setShowSettings(false)} />;

  return (
    <div class="app">
      <nav class="steps" aria-label="Steps">
        {steps.map(([id, label], i) => (
          <button
            key={id}
            aria-current={step === id ? 'step' : undefined}
            class={step === id ? 'step on' : 'step'}
            disabled={id === 'layout' && (batch !== null || pages.length === 0)}
            onClick={() => setStep(id)}
          >
            <span class="num">{i + 1}</span>
            {label}
          </button>
        ))}
        <button class="icon" aria-label="Settings" title="Settings" onClick={() => setShowSettings(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true">
            <path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6" />
            <circle cx="10" cy="4.5" r="1.5" />
            <circle cx="6" cy="11.5" r="1.5" />
          </svg>
        </button>
      </nav>

      {error && (
        <div class="banner error" role="alert">
          <span>{error}</span>
          <button class="link" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {step === 'write' && (
        <main class="body">
          <div class="segmented" role="tablist" aria-label="Input">
            {(['paste', 'generate', 'json'] as Source[]).map((s) => (
              <button key={s} role="tab" aria-selected={source === s} class={source === s ? 'on' : ''} onClick={() => setSource(s)}>
                {s === 'paste' ? 'Paste text' : s === 'generate' ? 'Generate with AI' : 'JSON'}
              </button>
            ))}
          </div>

          {source === 'paste' && (
            <>
              {genStatus && !generating && <p class="note">{genStatus}</p>}
              <label class="sr" for="md">Book text in Markdown</label>
              <textarea
                id="md"
                class="editor"
                value={md}
                spellcheck={false}
                placeholder={'# Chapter title\n\nParagraphs, lists and ![image description](image) lines.\n\nPaste the answer from ChatGPT, Claude or Gemini, or any Markdown.'}
                onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
              />
              <div class="row">
                <button class="secondary" onClick={() => copyText(COPY_PROMPT)}>Copy AI prompt</button>
                {!md && <button class="secondary" onClick={() => setText(EXAMPLE)}>Load example</button>}
                <span class="grow" />
                <span class="meta">
                  {pages.length} page{pages.length === 1 ? '' : 's'}
                  {parsed.warnings.length > 0 && ` · ${parsed.warnings.length} warning${parsed.warnings.length === 1 ? '' : 's'}`}
                </span>
              </div>
              {parsed.warnings.map((w) => (
                <p key={w.line} class="warn">Line {w.line}: {w.message}</p>
              ))}
              <button class="primary block" disabled={pages.length === 0} onClick={() => setStep('layout')}>
                Next: choose layouts
              </button>
            </>
          )}

          {source === 'generate' && (
            <form class="form" onSubmit={(e) => { e.preventDefault(); runGenerate(); }}>
              <label>
                What is the book about?
                <textarea rows={3} required value={req.topic} placeholder="A beginner's guide to sourdough baking at home" onInput={(e) => setReq({ ...req, topic: (e.target as HTMLTextAreaElement).value })} />
              </label>
              <div class="two">
                <label>
                  Readers
                  <input value={req.audience} placeholder="Home bakers" onInput={(e) => setReq({ ...req, audience: (e.target as HTMLInputElement).value })} />
                </label>
                <label>
                  Tone
                  <input value={req.tone} placeholder="Warm, practical" onInput={(e) => setReq({ ...req, tone: (e.target as HTMLInputElement).value })} />
                </label>
              </div>
              <div class="two">
                <label>
                  Language
                  <input value={req.language} onInput={(e) => setReq({ ...req, language: (e.target as HTMLInputElement).value })} />
                </label>
                <label>
                  Chapters
                  <input type="number" min={1} max={20} value={req.chapters} onInput={(e) => setReq({ ...req, chapters: Math.min(20, Math.max(1, Number((e.target as HTMLInputElement).value) || 1)) })} />
                </label>
              </div>
              <p class="meta">
                Uses {settings.provider === 'anthropic' ? 'Claude' : settings.provider === 'openai' ? 'OpenAI' : 'Gemini'} ({settings.models[settings.provider]}) with your own key.{' '}
                <button type="button" class="link" onClick={() => setShowSettings(true)}>
                  {settings.keys[settings.provider] ? 'Change' : 'Add a key'}
                </button>
              </p>
              <button class="primary block" type="submit" disabled={generating || !req.topic.trim()}>
                {generating ? 'Writing…' : 'Write the book'}
              </button>
              {generating && <p class="note" aria-live="polite">{genStatus}</p>}
            </form>
          )}

          {source === 'json' && (
            <>
              <p class="meta">
                One book object or a list of them. Each has <code>title</code> and <code>pages</code>; each page has a <code>layout</code> and <code>blocks</code>. A list builds one section per book.
              </p>
              <label class="sr" for="json">Book JSON</label>
              <textarea id="json" class="editor mono" value={json} spellcheck={false} placeholder={'{ "title": "…", "pages": [ { "layout": "simpletext", "blocks": [ { "type": "heading", "level": 1, "text": "…" } ] } ] }'} onInput={(e) => setJson((e.target as HTMLTextAreaElement).value)} />
              <button class="primary block" disabled={!json.trim()} onClick={useJson}>Use this JSON</button>
            </>
          )}
        </main>
      )}

      {step === 'layout' && (
        <main class="body">
          <div class="row">
            <span class="meta grow">Pick a layout for each page. Long pages continue on new pages automatically.</span>
            <button class="secondary" disabled={Object.keys(overrides).length === 0 && parsed.auto.every(Boolean)} onClick={() => setOverrides(Object.fromEntries(parsed.book.pages.map((p, i) => [i, autoLayout(p.blocks)])))}>
              Auto-assign all
            </button>
          </div>
          <ol class="pages">
            {pages.map((p, i) => (
              <li key={i} class="page-row">
                <LayoutPreview layout={p.layout} />
                <div class="grow">
                  <div class="title">{pageLabel(p.blocks)}</div>
                  <label class="sr" for={`layout-${i}`}>Layout for page {i + 1}</label>
                  <select id={`layout-${i}`} value={p.layout} onChange={(e) => setOverrides({ ...overrides, [i]: (e.target as HTMLSelectElement).value as LayoutId })}>
                    {LAYOUTS.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ol>
          <button class="primary block" onClick={() => setStep('build')}>Next: build</button>
        </main>
      )}

      {step === 'build' && (
        <main class="body">
          {batch && <p class="note">{batch.length} books from JSON. Each becomes its own section.</p>}
          <div class="two">
            <label>
              Page size
              <select value={size} disabled={isSlides} onChange={(e) => setSize((e.target as HTMLSelectElement).value as PageSize)}>
                {(Object.keys(PAGE_SIZES) as PageSize[]).filter((k) => isSlides || k !== 'slides').map((k) => (
                  <option key={k} value={k}>{PAGE_SIZES[k].label}</option>
                ))}
              </select>
            </label>
            <fieldset class="themes">
              <legend>Theme</legend>
              {THEME_MODES.map((m) => (
                <label key={m} class={mode === m ? 'theme on' : 'theme'} title={m}>
                  <input type="radio" name="mode" class="sr" checked={mode === m} onChange={() => setMode(m)} />
                  <span class="swatch" style={{ background: SWATCH[m][0], borderColor: SWATCH[m][1] }}>
                    <span style={{ background: SWATCH[m][1] }} />
                  </span>
                  {m}
                </label>
              ))}
            </fieldset>
          </div>
          <div class="checks">
            <label><input type="checkbox" checked={cover} onChange={() => setCover(!cover)} /> Cover page</label>
            <label><input type="checkbox" checked={toc} onChange={() => setToc(!toc)} /> Contents page</label>
            {!batch && (
              <label><input type="checkbox" checked={book.direction === 'rtl'} onChange={() => setRtl(book.direction !== 'rtl')} /> Right-to-left text</label>
            )}
          </div>
          <p class="meta">
            Colours, fonts and the number and image pieces are created once as variables, text styles and components, so you can restyle every page later.
            The theme is a variable mode: switch it on a page or section to recolour.
          </p>

          <button class="primary block" disabled={books.length === 0 || progress !== null} onClick={create}>
            {progress ? 'Creating…' : `Create ${books.length > 1 ? `${books.length} books` : 'pages'}`}
          </button>
          {progress && (
            <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done} aria-label="Creating pages">
              <div style={{ width: `${(100 * progress.done) / Math.max(1, progress.total)}%` }} />
            </div>
          )}

          {built && (
            <section class="done" aria-live="polite">
              <p>
                Created {built.pages} page{built.pages === 1 ? '' : 's'}{built.books > 1 ? ` in ${built.books} books` : ''}.
              </p>
              {built.warnings.map((w) => <p key={w} class="warn">{w}</p>)}
              <div class="row">
                <button class="secondary" onClick={() => post({ type: 'export-pdf' })}>Export PDF</button>
                <button
                  class="secondary"
                  disabled={imageStatus.startsWith('Generating')}
                  title={settings.keys.openai ? '' : 'Needs an OpenAI key in Settings'}
                  onClick={() => (settings.keys.openai ? (setError(''), post({ type: 'list-placeholders' })) : setShowSettings(true))}
                >
                  Fill images with AI
                </button>
              </div>
              <p class="meta">Export and fill use the selected section or pages, or the last build if nothing is selected.</p>
              {imageStatus && <p class="note">{imageStatus}</p>}
            </section>
          )}
        </main>
      )}
    </div>
  );
}

function SettingsView({ settings, onSave, onClose }: { settings: Settings; onSave: (s: Settings) => void; onClose: () => void }) {
  const [s, setS] = useState(settings);
  const providers = [
    ['anthropic', 'Claude (Anthropic)'],
    ['openai', 'OpenAI'],
    ['gemini', 'Gemini (Google)'],
  ] as const;
  return (
    <form class="app body form" onSubmit={(e) => { e.preventDefault(); onSave(s); }}>
      <h1>Settings</h1>
      <fieldset>
        <legend>Write with</legend>
        {providers.map(([id, label]) => (
          <label key={id} class="radio">
            <input type="radio" name="provider" checked={s.provider === id} onChange={() => setS({ ...s, provider: id })} /> {label}
          </label>
        ))}
      </fieldset>
      {providers.map(([id, label]) => (
        <div key={id} class="two">
          <label>
            {label} key
            <input type="password" autoComplete="off" value={s.keys[id]} onInput={(e) => setS({ ...s, keys: { ...s.keys, [id]: (e.target as HTMLInputElement).value.trim() } })} />
          </label>
          <label>
            Model
            <input value={s.models[id]} onInput={(e) => setS({ ...s, models: { ...s.models, [id]: (e.target as HTMLInputElement).value.trim() } })} />
          </label>
        </div>
      ))}
      <label>
        Image model (uses the OpenAI key)
        <input value={s.imageModel} onInput={(e) => setS({ ...s, imageModel: (e.target as HTMLInputElement).value.trim() })} />
      </label>
      <p class="meta">Keys are saved on this computer in Figma's plugin storage and sent only to the provider you use. Writing and images are optional; pasting text needs no key.</p>
      <div class="row">
        <button type="button" class="secondary" onClick={onClose}>Cancel</button>
        <span class="grow" />
        <button type="submit" class="primary">Save</button>
      </div>
    </form>
  );
}

render(<App />, document.getElementById('app')!);
