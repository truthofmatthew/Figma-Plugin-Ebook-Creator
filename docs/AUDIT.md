# Ebook Frame Creator: audit and rebuild plan

> The original audit and plan, written before the rebuild. The README describes what shipped in 1.0.0; a few details changed while building it, for example the editable pieces are text styles, colour variables and two components rather than one component per layout.

Repo: https://github.com/truthofmatthew/Figma-Plugin-Ebook-Creator (last commit 2024-06-28)
Local clone: `/Volumes/Datas/Developments/Figma-Plugin-Ebook-Creator`
Audited: 2026-10-23

---

## 1. What the plugin does today

1. The user pastes ChatGPT output into one textarea.
2. Before each page they type a marker such as `#>page-bullet<#`. Clicking a thumbnail inserts the marker.
3. On **Create Frames**, the main thread splits the text by marker and runs one of 14 hard-coded template functions per page.
4. Each template draws an A4 frame (595×842) with absolutely positioned text nodes and grey rectangles for images, placed to the right of the existing frames.
5. The help modal holds a long prompt to paste into ChatGPT so its output matches the regexes the parser expects.

The idea still holds up: turning LLM text into laid-out book pages inside Figma. Most of the build needs replacing.

---

## 2. Bugs found (ranked)

| # | Where | Problem | Effect |
|---|-------|---------|--------|
| 1 | `constants.js` fonts, `textGeneration.js` `loadFonts()` | Every page loads **Roxborough CF**, a paid font, and nothing catches a failed load. | For anyone without that font, `loadFontAsync` rejects and **no page is created**. This probably breaks it for most installs. |
| 2 | `textGeneration.js:276` | `createColumnTextLayers` reads `textDirection`, but it is not a parameter or in scope. | `ReferenceError`: `two-column-1` and `two-column-4` (and `two-column-3` with 5+ lines) crash halfway, leaving a half-built frame. |
| 3 | `frameGeneration.js:82` | An unknown marker (a typo, or `#>page-toc<#` written differently) adds a text group but no template. | Every later page gets the wrong template, and the last one calls `undefined()` and crashes. |
| 4 | `frameGeneration.js:104` | `createImagePlaceholder` returns nothing, but the templates use its return value (`placeholder.height`). In `createTwoColumn_Three.js:68` the `let` shadows the outer variable. | The code that repositions text after the image never runs, so text and images overlap. |
| 5 | `createTwoColumn_Three.js:48` | Checks `texts.length > 3` but then uses `texts[2]`. | The third heading is skipped when a page has exactly 3 lines. |
| 6 | All templates | Absolute y positions with no overflow check. | Long AI text runs off the bottom of the A4 frame. Nothing paginates or warns. |
| 7 | `frameGeneration.js:75` | Text before the first marker is silently dropped. Pasting with no markers does nothing and shows no message. | The plugin looks broken to first-time users. |
| 8 | `ui.html:248` | `requiredHeight` is used outside the function that defines it. | `ReferenceError` on every launch (the UI still works, but the console fills with errors). |
| 9 | `ui.html:134` | `<script type="module" src="dist/main.js">` | Plugin iframes cannot load relative files, and `main.js` is sandbox code anyway. A dead request on every launch. |
| 10 | `textGeneration.js` RTL branch | Sets `textNode.x = 0` for RTL numbered text and only right-aligns the text. No real mirroring. | The RTL output is visibly misaligned. The README already says it is a demo. |
| 11 | `frameGeneration.js:24` | `figma.loadAllPagesAsync()` on every run, which `documentAccess: dynamic-page` exists to avoid. | Slow on large files for no benefit; it only reads `currentPage`. |
| 12 | Thumbnails vs output | The preview images (dark teal two-column, photos) do not match what the code draws (cream background, grey boxes). | Users pick a layout and get something else. |

## 3. Structure problems

- **Committed junk:** `node_modules/` (3,320 files) and `dist/` are committed even though `.gitignore` lists both. Delete them from git.
- **Dead files:** `code.ts` (template comment only), `markDownParser.js` (empty), `myStyle.css` (empty), `uiManager.js` (never imported), `uiHandlers.js` (looks for `#bulletPointStyle`, which no longer exists), `dist/bundle.js`, `dist/ui.js` (stale).
- **Unused deps:** `remark`, `remark-parse`, `unist-util-visit` are installed but never imported. The parser is hand-written regex. Also unused: `imagemin-webpack-plugin`, `url-loader`, `html-loader`, `css-loader`, `mini-css-extract-plugin`, `copy-webpack-plugin`, `webpack-bundle-analyzer`.
- **`ui.html` is 1.3 MB** because 14 PNGs are inlined as base64. The UI is inline HTML and JS, not bundled.
- **Three copies of `identifyTextType` and `loadFonts`** (textGeneration, BulletPointPage, TableOfContents), already drifting apart.
- **No TypeScript in practice:** `@figma/plugin-typings` is set to `"*"` and the code is plain JS, so bug #2 was never caught.
- **Version drift:** `package.json` says 0.1.4, the UI says 0.1.6, the README says "Version 6". The footer links to the old repo `mtkarimi/EbookFrameCreator`.
- **No tests** for the parser, which is the part most likely to break.

## 4. UI/UX problems

- Hard-coded light colours (`#f7f7f7`, `#0275d8`). Ignores Figma's light/dark theme and UI3 look. Uses no `themeColors`.
- `alert()` and a home-made modal instead of `figma.notify` and an inline panel.
- No preview: you only see the result after the frames are drawn.
- No progress indicator while frames are being drawn, and the "Create" button stays enabled, so double-clicks create duplicates.
- New frames land at `y = 0` off to the right. The viewport doesn't move to them and they aren't selected.
- The workflow means memorising marker syntax and a ChatGPT-only prompt that has typos.
- Templates can't be edited (the README says so), and colours and fonts are fixed in `constants.js`.

---

## 5. What changed since 2024 that matters here

**Figma platform**
- **UI3** is the default Figma UI. Plugins should use `figma.showUI(__html__, { themeColors: true })` and the `--figma-color-*` CSS variables so they match light and dark mode.
- **Variables and modes** (colour, number, string) and `setBoundVariable` / `setBoundVariableForPaint` mean a "book theme" can be one variable collection with modes (Cream, Teal, Dark, Brand) instead of hex strings in code.
- **Auto layout** (including wrap, and Grid auto layout since 2025) handles text height for you. All the manual `yPos` arithmetic, and bugs #4–#6, go away.
- **Components with properties** (text, boolean, instance swap). Templates can be real components on a "Templates" page that users restyle, and the plugin instantiates them. That removes the "templates can't be edited" limit.
- **Text styles** for Title, Heading, Body, Callout, so a font swap is one edit.
- **Sections** to group one book's pages, and `exportAsync({ format: 'PDF' })` to export the whole book in one click.
- **New editors:** `editorType` can now include `slides` (Update 119 era; fixed 1920×1080 slides) and `buzz` (template-driven media assets via `figma.buzz`). Buzz fits "make 100 ebooks" well: one template, many generated assets. Figma Draw got text-on-path and transform groups (Update 123).
- **Config 2026 (June):** Generative plugins (prompt a plugin into existence), Figma agent, Weave and Motion. If a generic generative plugin can already do "paste text → frames", the reason to install a published plugin is curated, well-designed book layouts and a reliable pipeline. The plan below leans on that.
- **Figma MCP server:** agents such as Claude Code, Cursor and Codex can now write to files directly (`use_figma`). Exposing a documented JSON "book spec" lets agents drive the plugin's templates.

**AI**
- **Structured outputs / JSON schema** are standard on Claude, GPT and Gemini. Instead of asking the model to emit fragile `**text**:` markdown and parsing it with 7 regexes, ask for JSON matching a `BookSpec` schema. The parsing bugs disappear.
- **Long context and long output:** current models (for example `claude-sonnet-5-5`, `claude-opus-5-5`) can write a whole book outline plus chapters in one structured call, or stream chapter by chapter.
- **Image generation** is cheap and good. Placeholders can become generated images, with the boxes kept as a fallback.
- **Bring-your-own-key** in plugins is common: `networkAccess.allowedDomains` lists the provider APIs, the key is saved with `figma.clientStorage`, and the call is made from the UI iframe.

---

## 6. Rebuild plan

Lazy principle: delete before adding. Keep the 14 layouts as the product, and replace the engine around them.

### Phase 0: Make the current version work (1–2 days, ships as v0.2)
Small fixes so existing users stop seeing crashes while the rebuild happens.
1. Font fallback: try Roxborough CF and DM Sans, fall back to **Inter**, which ships with Figma, via `listAvailableFontsAsync`. Fixes #1.
2. Pass `textDirection` into `createColumnTextLayers`. Fixes #2.
3. Unknown marker → `figma.notify("Unknown layout 'x' on line n")` and stop. No text before the first marker → wrap it in a `simpletext` page. Fixes #3 and #7.
4. Return the rectangle from `createImagePlaceholder`. Fix the `> 3` check and the shadowed `let`. Fixes #4 and #5.
5. Remove `loadAllPagesAsync`, the dead `<script src>` and the stray `requiredHeight`. Fixes #8, #9 and #11.
6. Select the new frames and `scrollAndZoomIntoView` them.
7. Untrack `node_modules` and `dist`, and delete the dead files and unused deps.

### Phase 1: New foundation (about 1 week)
- **Tooling:** TypeScript + `@create-figma-plugin/build` (esbuild; bundles UI and main; inlines assets), or Vite + `vite-plugin-singlefile`. Pin `@figma/plugin-typings`. Run `tsc --noEmit` in CI.
- **Layout:**
  ```
  src/
    main.ts            // message router only
    spec.ts            // BookSpec types + JSON schema (shared by UI, AI and MCP)
    parse/markdown.ts  // standard Markdown -> BookSpec (remark/mdast, already a dep)
    render/            // one file per layout, all using auto layout
    theme.ts           // variables + text styles bootstrap
    ui/                // Preact + @create-figma-plugin/ui (matches UI3)
  test/parse.test.ts   // vitest, fixtures from real AI outputs
  ```
- **One data model**, `BookSpec`: `{ title, theme, pages: [{ layout, blocks: [heading | paragraph | bullets | numbered | quote | image | toc] }] }`. Everything (paste, AI, MCP) converts to this, and the renderers only read it.
- **Input format:** accept **plain Markdown** (`#`, `##`, `-`, `1.`, `>` and `![]()`) plus an optional layout hint `<!-- layout: two-column-1 -->`. Keep reading the old `#>page-x<#` markers so existing users' prompts still work.
- **Auto layout everywhere:** each page is a vertical auto-layout frame with padding 55, and columns are horizontal auto layout. Overflow check: if the content is taller than 842, move the remaining blocks to a new page with the same layout. Fixes #6.
- **Theme:** on first run, create a variable collection called "Ebook" (bg, title, heading, body, accent, number) with modes Cream, Teal and Night, plus four text styles. Every node binds to these. A user changes the whole book by switching the mode.
- **Templates as components:** generate a "📚 Ebook templates" page with one component per layout. Rendering creates instances and fills text properties. Users who edit the component change every page that uses it, which fixes "templates can't be edited".
- **RTL done properly:** mirror the auto-layout direction (`layoutMode` with reversed child order, `textAlignHorizontal: RIGHT`), and default to Vazirmatn or Noto Sans Arabic when the text is RTL.

### Phase 2: New UI (about 1 week)
Three-step flow in one panel, themed with Figma's colour variables:

1. **Write**: two tabs.
   - *Paste*: a Markdown textarea with a live outline on the side ("12 pages · 3 chapters · 2 warnings").
   - *Generate*: topic, audience, tone, chapter count and language → calls the model with the `BookSpec` JSON schema and streams chapters in. Bring your own key (Anthropic, OpenAI or Gemini), stored in `clientStorage`. `allowedDomains` lists those three APIs.
2. **Layout**: a scrollable list of pages, each with a small live preview (SVG drawn from the spec, not a PNG). Click to change a page's layout. Use "Auto-assign" to pick layouts by content (bullets → `bullet`, has image → `image-desc`, long text → `two-column`).
3. **Build**: theme mode picker, page size (A4, US Letter, 6×9 in, square), cover on/off, then **Create**. A progress bar shows page n of N, and the button is disabled while it runs. Afterwards the frames are grouped in a Section, selected and zoomed into, with **Export PDF** as the next button.

Also: drop the 1.3 MB base64 thumbnails (the SVG previews replace them), remove `alert()`, and move the prompt into a "Copy prompt for any AI" button. The prompt now asks for Markdown, not regex-shaped text.

### Phase 3: AI and agent extras (optional, after launch)
- **Cover generator:** title + style → a generated cover image (user's key) placed on the cover layout.
- **Fill image placeholders:** caption → generated image, or leave the placeholder in place.
- **Agent/MCP mode:** publish the `BookSpec` JSON schema in the README so Claude Code or Cursor can write the spec through the Figma MCP server, and the plugin renders it. One "Paste JSON" tab covers this.
- **Slides and Buzz:** add `"slides"` to `editorType` and map each page to a 1920×1080 slide. Buzz for social cards made from book chapters.
- **Batch mode** (the original "100 ebooks" use case): paste or import a JSON array of BookSpecs, and build one Section per book.

### Not worth doing
- An in-house parser for GPT-specific bold/colon patterns. Markdown and JSON schema replace it.
- Payments or accounts. Keep it free and BYOK.
- Server-side proxy. That would need hosting and key custody, so BYOK keeps it static.

---

## 7. New Community listing

**Name:** Ebook Creator: Markdown & AI to Book Pages

**Tagline (≤ 100 chars):** Turn Markdown or AI-written text into styled, editable ebook pages and export a PDF.

**Description:**

> Paste a chapter, or generate a whole book with your own AI key, and get laid-out pages in seconds.
>
> **How it works**
> 1. Paste Markdown or plain text from ChatGPT, Claude or Gemini, or generate a book from a topic.
> 2. Pick a layout per page or let the plugin choose: table of contents, intro, bullet list, two-column, image and caption, highlight, and more (14 layouts).
> 3. Choose a theme and page size (A4, US Letter, 6×9 in), then create. Long text flows onto new pages.
> 4. Export the whole book as a PDF.
>
> **Edit everything after**
> Every page is built from real components, text styles and colour variables. Change a template once and every page updates. Switch the theme mode to recolour the whole book.
>
> **Also**
> • Right-to-left text (Persian, Arabic, Hebrew)
> • Works with any AI: copy the prompt, or use your own API key (stored only in your Figma client)
> • No account, no tracking, free and open source
>
> Source and issues: github.com/truthofmatthew/Figma-Plugin-Ebook-Creator

**Tags:** ebook, pdf, markdown, book, ai, layout, publishing, content, rtl

---

## 8. New screenshots (shot list)

Cover 1920×1080 (safe area 1800×1080), plus up to 9 carousel images at the same size. Make them from the **rebuilt** plugin so they match what users get; mocking them in advance would repeat problem #12.

| # | Frame | What's in it | Caption on image |
|---|-------|--------------|------------------|
| Cover | 3 finished pages fanned over a soft background, with the plugin panel on the right | Real content (e.g. "The Small Brand Playbook"), Cream theme | **Text in. Book out.** |
| 1 | Split: Markdown on the left → 4 laid-out pages on the right | Shows the core change from paste to pages | Paste Markdown or AI text |
| 2 | Plugin "Generate" tab mid-stream, chapters filling in | Topic: "Beginner's Guide to Sourdough" | Generate a full book with your own AI key |
| 3 | Layout step: page list with live previews, one dropdown open | Shows the 14 layouts | Pick a layout per page, or auto-assign |
| 4 | Grid of all 14 layouts (small) | Template gallery | 14 editable layouts |
| 5 | Same spread in Cream / Teal / Night | Variables mode switch visible in the right panel | One click to re-theme the whole book |
| 6 | Template component being edited with the instances updating | Component on the templates page | Edit a template, every page updates |
| 7 | An RTL spread in Persian | Vazirmatn font | Right-to-left ready |
| 8 | Overflow: one long chapter flowing across 3 pages | Page numbers visible | Long text flows onto new pages |
| 9 | Export: Section selected, PDF export dialog | Shows the final step | Export the book as a PDF |

Also: re-record `plugin_preview.gif` as a ~15 s MP4/GIF (paste → layout → create → zoom).

---

## 9. Order of work

1. Phase 0 fixes → publish v0.2 (stops the crashes now).
2. Phase 1 foundation + parser tests.
3. Phase 2 UI.
4. Capture the screenshots, update the listing and README, publish **v1.0**.
5. Phase 3 items one at a time.
