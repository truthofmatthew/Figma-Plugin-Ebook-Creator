// Plugin sandbox entry: routes UI messages to the renderer.
import { DEFAULT_SETTINGS, type Settings, type ToMain, type ToUI } from '../messages';
import { buildBooks, exportPdf, listPlaceholders, setImage } from './render';

const send = (msg: ToUI) => figma.ui.postMessage(msg);

figma.showUI(__html__, { width: 380, height: 640, themeColors: true });

(async () => {
  const saved = (await figma.clientStorage.getAsync('settings')) as Partial<Settings> | undefined;
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...saved,
    keys: { ...DEFAULT_SETTINGS.keys, ...saved?.keys },
    models: { ...DEFAULT_SETTINGS.models, ...saved?.models },
  };
  send({ type: 'init', settings, editorType: figma.editorType });
})();

let busy = false;

figma.ui.onmessage = async (msg: ToMain) => {
  try {
    switch (msg.type) {
      case 'build': {
        if (busy) return;
        busy = true;
        try {
          const res = await buildBooks(msg.books, msg.options, (done, total) => send({ type: 'progress', done, total }));
          send({ type: 'built', ...res });
          figma.notify(`Created ${res.pages} page${res.pages === 1 ? '' : 's'}${res.books > 1 ? ` in ${res.books} books` : ''}.`);
        } finally {
          busy = false;
        }
        break;
      }
      case 'export-pdf': {
        const { name, parts } = await exportPdf();
        send({ type: 'pdf-parts', name, parts });
        break;
      }
      case 'list-placeholders':
        send({ type: 'placeholders', items: await listPlaceholders() });
        break;
      case 'set-image':
        await setImage(msg.id, msg.bytes);
        send({ type: 'image-set', id: msg.id });
        break;
      case 'save-settings':
        await figma.clientStorage.setAsync('settings', msg.settings);
        break;
      case 'notify':
        figma.notify(msg.message, { error: msg.error });
        break;
      case 'resize':
        figma.ui.resize(Math.max(320, msg.width), Math.max(420, msg.height));
        break;
    }
  } catch (e) {
    const message = (e as Error).message || String(e);
    send({ type: 'error', message });
    figma.notify(message, { error: true });
  }
};
