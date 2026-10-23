// Dev only: the renderer without the UI, so it can run inside a Figma file (books injected as BOOKS).
import { buildBooks } from '../src/main/render';
declare const BOOKS: any[], OPTIONS: any;
(globalThis as any).__run = () => buildBooks(BOOKS, OPTIONS, () => {});
