# Figma Community listing

Copy for the plugin's Community page. Images are in `docs/screenshots/` (1920 × 1080).

## Name

Ebook Frame Creator

## Tagline

Turn Markdown or AI-written text into styled, editable ebook pages, then export a PDF.

## Description

Paste a chapter, or write a whole book with your own AI key, and get laid-out pages in seconds.

**How it works**
1. Paste Markdown or text from ChatGPT, Claude or Gemini. Or describe the book and let AI write it with your own key, or paste book JSON.
2. Each page gets a layout: cover, contents, intro, numbered points, image and text, highlight card, five two-column styles and more. The plugin picks one from what is on the page, and you can change any of them.
3. Choose a page size (A4, US Letter, 6 × 9 in, square) and a theme, then create. Long chapters continue onto new pages by themselves.
4. Export the whole book as one PDF.

**Everything stays editable**
Pages use auto layout. Colours are variables with Cream, Teal and Night modes, so switching the mode on a section recolours the book. Type uses text styles, and the number badges and image placeholders are components. Change one and every page follows.

**Also**
• Fill image placeholders with AI-generated pictures (OpenAI key)
• Right-to-left text for Persian, Arabic and Hebrew, with mirrored layouts
• Works in Figma Slides: one slide per page
• Batch mode: paste a list of books as JSON and get one section per book
• No account and no tracking. Keys stay in Figma's plugin storage on your computer. Free and open source.

Source and issues: https://github.com/truthofmatthew/Figma-Plugin-Ebook-Creator

## Tags

ebook, pdf, markdown, book, ai, layout, publishing, chatgpt, rtl, slides

## Network access note (shown on the listing)

Optional AI writing and image generation with the user's own API key. Requests go straight from the plugin to the provider the user picks: api.anthropic.com, api.openai.com, generativelanguage.googleapis.com.

## Images, in order

| File | Use | On-image headline |
|------|-----|-------------------|
| `00-cover.png` | Cover image | Text in. Book out. |
| `02-paste.png` | Carousel 1 | Paste Markdown or AI text |
| `03-generate.png` | Carousel 2 | Or write the whole book with AI |
| `04-layouts.png` | Carousel 3 | Choose a layout per page |
| `05-gallery.png` | Carousel 4 | A layout for every kind of page |
| `06-themes.png` | Carousel 5 | One click to re-theme the book |
| `07-rtl.png` | Carousel 6 | Right-to-left ready |
| `08-export.png` | Carousel 7 | Export the whole book as a PDF |

Every page in these images was rendered by the plugin itself from `examples/small-brand-playbook.md`, and the panels are captures of the real UI. The image placeholders are left empty because no image key was used.

Still to make: the plugin icon (check the size the Publish dialog asks for) and an optional 10–15 second video of paste → layout → create → export.
