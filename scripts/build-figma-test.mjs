// Dev only: bundles the renderer (with the in-memory data shim) for running inside a Figma file via MCP.
import * as esbuild from 'esbuild';
import path from 'node:path';
const shim = { name: 'shim', setup(b) { b.onResolve({ filter: /\/data$/ }, (a) => a.importer.includes('src/main') ? { path: path.resolve('scripts/data-shim.ts') } : undefined); } };
await esbuild.build({ entryPoints: ['scripts/figma-test-entry.ts'], bundle: true, minify: true, target: 'es2017', format: 'iife', outfile: process.argv[2], plugins: [shim], logLevel: 'warning' });
