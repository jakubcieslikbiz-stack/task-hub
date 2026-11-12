import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up the PDF.js worker using Vite's asset URL resolution (100% offline & local)
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface PdfPageResult {
  pageNumber: number;
  totalPages: number;
  name: string;
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * Converts a PDF file into high-resolution PNG images (one per page).
 * @param file The PDF File uploaded by the user
 * @param scale Rendering scale (2.0 gives crisp ~200-300 DPI for high-res architectural renders and documents)
 */
export async function convertPdfToPng(
  file: File,
  scale: number = 2.0
): Promise<PdfPageResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const results: PdfPageResult[] = [];

  const baseName = file.name.replace(/\.pdf$/i, '');

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // White background by default for transparent PDF pages
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    });

    const previewUrl = URL.createObjectURL(blob);
    const pageName = totalPages === 1
      ? `${baseName}.png`
      : `${baseName}_strona_${i}.png`;

    results.push({
      pageNumber: i,
      totalPages,
      name: pageName,
      blob,
      previewUrl,
      width: canvas.width,
      height: canvas.height,
    });
  }

  return results;
}
