// Bundles the plugin: dist/main.js (sandbox) and dist/ui.html (UI with JS and CSS inlined).
import * as esbuild from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
const common = { bundle: true, minify: !watch, target: 'es2017', logLevel: 'info', loader: { '.md': 'text' } };

const inlineUi = {
  name: 'inline-ui',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length) return;
      const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;
      const css = await readFile('src/ui/style.css', 'utf8');
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="app"></div><script>${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
      await mkdir('dist', { recursive: true });
      await writeFile('dist/ui.html', html);
    });
  },
};

const main = { ...common, entryPoints: ['src/main/main.ts'], outfile: 'dist/main.js' };
const ui = { ...common, entryPoints: ['src/ui/index.tsx'], outfile: 'dist/ui.js', write: false, jsx: 'automatic', jsxImportSource: 'preact', plugins: [inlineUi] };

if (watch) {
  await (await esbuild.context(main)).watch();
  await (await esbuild.context(ui)).watch();
} else {
  await Promise.all([esbuild.build(main), esbuild.build(ui)]);
}
