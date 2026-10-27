// Book writing and image generation with the user's own API key. Calls go straight from the plugin UI to the provider.
import Anthropic from '@anthropic-ai/sdk';
import type { Settings } from '../messages';
import { type BookSpec, LAYOUTS, OUTLINE_SCHEMA, PAGES_SCHEMA, validateBook } from '../spec';

async function anthropicJson(s: Settings, system: string, user: string, schema: object): Promise<unknown> {
  const client = new Anthropic({ apiKey: s.keys.anthropic, dangerouslyAllowBrowser: true });
  const msg = await client.beta.messages
    .stream({
      model: s.models.anthropic,
      max_tokens: 32000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: schema as Record<string, unknown> } },
    })
    .finalMessage();
  if (msg.stop_reason === 'refusal') throw new Error('The model declined to write this. Try a different topic or wording.');
  if (msg.stop_reason === 'max_tokens') throw new Error('The answer was cut off. Ask for fewer chapters or shorter chapters.');
  const text = msg.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('The model returned no text.');
  return JSON.parse(text.text);
}

async function openaiJson(s: Settings, system: string, user: string, schema: object, name: string): Promise<unknown> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.keys.openai}` },
    body: JSON.stringify({
      model: s.models.openai,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_schema', json_schema: { name, schema, strict: true } },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI: ${data?.error?.message ?? res.statusText}`);
  return JSON.parse(data.choices[0].message.content);
}

async function geminiJson(s: Settings, system: string, user: string, schema: object): Promise<unknown> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(s.models.gemini)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': s.keys.gemini },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini: ${data?.error?.message ?? res.statusText}`);
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

function askJson(s: Settings, system: string, user: string, schema: object, name: string) {
  if (!s.keys[s.provider]) throw new Error('Add an API key in Settings first.');
  if (s.provider === 'openai') return openaiJson(s, system, user, schema, name);
  if (s.provider === 'gemini') return geminiJson(s, system, user, schema);
  return anthropicJson(s, system, user, schema);
}

export interface BookRequest {
  topic: string;
  audience: string;
  tone: string;
  chapters: number;
  language: string;
}

const SYSTEM = `You write practical, well-organised non-fiction ebooks for a page-layout tool.
Write for the stated audience in the stated language and tone. Be concrete: examples, steps and numbers beat general advice.
Inline formatting: only **bold** and *italic*. No Markdown headings or lists inside text fields.`;

const LAYOUT_GUIDE = LAYOUTS.filter((l) => l.id !== 'cover' && l.id !== 'toc')
  .map((l) => `- ${l.id}: ${l.hint}`)
  .join('\n');

export async function generateBook(s: Settings, req: BookRequest, onProgress: (label: string) => void): Promise<BookSpec> {
  onProgress('Planning chapters');
  const outline = (await askJson(
    s,
    SYSTEM,
    `Plan an ebook.
Topic: ${req.topic}
Audience: ${req.audience || 'general readers'}
Tone: ${req.tone || 'friendly and clear'}
Language: ${req.language || 'English'}
Chapters: exactly ${req.chapters}
Give a short title, a one-line subtitle, and for each chapter a title and a two-sentence summary.`,
    OUTLINE_SCHEMA,
    'outline',
  )) as { title: string; subtitle: string; chapters: { title: string; summary: string }[] };

  const chapters = outline.chapters.slice(0, req.chapters);
  const pages: unknown[] = [];
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    onProgress(`Writing chapter ${i + 1} of ${chapters.length}: ${ch.title}`);
    const res = (await askJson(
      s,
      SYSTEM,
      `Book: "${outline.title}". Chapters: ${chapters.map((c) => c.title).join('; ')}.
Write chapter ${i + 1}, "${ch.title}": ${ch.summary}
Language: ${req.language || 'English'}. Audience: ${req.audience || 'general readers'}. Tone: ${req.tone || 'friendly and clear'}.

Split it into 2 to 4 pages of at most 220 words each. Start the first page with a level-1 heading of the chapter title; other pages start with a level-2 heading.
Pick a layout for each page that suits its content:
${LAYOUT_GUIDE}
Use a "numbered" block for steps or key points (each item: short title + one or two sentence body), and "image" blocks whose text describes a photo or illustration that would suit the page. Layouts with an image need one image block.`,
      PAGES_SCHEMA,
      'pages',
    )) as { pages: unknown[] };
    pages.push(...res.pages);
  }

  const rtl = /farsi|persian|arabic|hebrew|urdu|فارسی|عربی/i.test(req.language);
  const checked = validateBook({ title: outline.title, subtitle: outline.subtitle, direction: rtl ? 'rtl' : 'ltr', pages });
  if (!checked.ok) throw new Error(`The model's answer did not match the book format: ${checked.error}`);
  return checked.value;
}

// Returns PNG bytes for a placeholder; picks the closest supported aspect ratio.
export async function generateImage(s: Settings, caption: string, bookTitle: string, width: number, height: number): Promise<Uint8Array> {
  if (!s.keys.openai) throw new Error('Image generation uses an OpenAI key. Add one in Settings.');
  const ratio = width / height;
  const size = ratio > 1.2 ? '1536x1024' : ratio < 0.83 ? '1024x1536' : '1024x1024';
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.keys.openai}` },
    body: JSON.stringify({
      model: s.imageModel,
      prompt: `${caption}. Editorial illustration for the book "${bookTitle}". No text, letters or logos in the image.`,
      size,
      n: 1,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI images: ${data?.error?.message ?? res.statusText}`);
  const b64: string = data.data[0].b64_json;
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export const COPY_PROMPT = `Write an ebook about: [YOUR TOPIC]

Format the answer as Markdown so it can be pasted into the Ebook Frame Creator Figma plugin:
- Start each chapter with "# Chapter title". Use "## Section title" for a new page inside a chapter.
- Keep each page under about 220 words.
- Use numbered lists ("1. **Point:** explanation") for steps or key points, and "- " for short bullet lists.
- Use "> " for one memorable quote or tip per chapter.
- Where a picture would help, add a line like ![A short description of the image](image)
- Optional: put a layout hint on its own line before a page, e.g. <!-- layout: two-column-1 -->
  Layouts: ${LAYOUTS.map((l) => l.id).join(', ')}
- Only use **bold** and *italic* for emphasis. No tables or code blocks.`;
