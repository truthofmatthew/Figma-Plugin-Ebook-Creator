import { PDFDocument } from 'pdf-lib';

// Joins one-page PDFs exported from Figma into a single book and starts the download.
export async function downloadPdf(name: string, parts: Uint8Array[]) {
  const book = await PDFDocument.create();
  book.setTitle(name);
  for (const part of parts) {
    const doc = await PDFDocument.load(part);
    for (const page of await book.copyPages(doc, doc.getPageIndices())) book.addPage(page);
  }
  const bytes = await book.save();
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[\\/:*?"<>|]+/g, '').trim() || 'ebook'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
