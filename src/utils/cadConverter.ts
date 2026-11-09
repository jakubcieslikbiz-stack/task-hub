import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import DxfParser from 'dxf-parser';

export const AUTOCAD_VERSIONS: Record<string, string> = {
  AC1006: 'AutoCAD R10',
  AC1009: 'AutoCAD R11 / R12',
  AC1012: 'AutoCAD R13',
  AC1014: 'AutoCAD R14',
  AC1015: 'AutoCAD 2000 / 2002',
  AC1018: 'AutoCAD 2004 / 2006',
  AC1021: 'AutoCAD 2007 / 2009',
  AC1024: 'AutoCAD 2010 / 2012',
  AC1027: 'AutoCAD 2013 / 2017',
  AC1032: 'AutoCAD 2018 / 2024+',
};

// Standard AutoCAD Color Index (ACI) 1-9 palette
export const ACI_COLORS: Record<number, string> = {
  1: '#ff0000', // Red
  2: '#ffff00', // Yellow
  3: '#00ff00', // Green
  4: '#00ffff', // Cyan
  5: '#0000ff', // Blue
  6: '#ff00ff', // Magenta
  7: '#ffffff', // White (Dark background) or Black (Light background)
  8: '#808080', // Dark gray
  9: '#c0c0c0', // Light gray
};

export type CadColorStyle = 'monochrome' | 'cad_layers' | 'autocad_dark';
export type PaperSize = 'auto' | 'a4' | 'a3' | 'a2' | 'a1';
export type PaperOrientation = 'landscape' | 'portrait';

export interface CadParseResult {
  svg: string;
  version: string;
  viewBox: { x: number; y: number; width: number; height: number };
  entityCount: number;
  layers: string[];
  sourceFormat: 'dwg' | 'dxf';
}

export interface PdfExportOptions {
  paperSize: PaperSize;
  orientation: PaperOrientation;
  colorStyle: CadColorStyle;
  lineWeightMm: number; // e.g. 0.25
  marginMm: number;     // e.g. 10
  fileName: string;
}

// Singleton for LibreDWG instance
let libreDwgInstance: any = null;
let wasmInitPromise: Promise<any> | null = null;

export async function getLibreDwgInstance(): Promise<any> {
  if (libreDwgInstance) return libreDwgInstance;
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      const mod = await import('@mlightcad/libredwg-web');
      // In browser, locateFile will fetch /libredwg-web.wasm from root
      const basePath = typeof window !== 'undefined' ? window.location.origin : '';
      libreDwgInstance = await mod.LibreDwg.create(basePath);
      return libreDwgInstance;
    } finally {
      // Done initializing
    }
  })();

  return wasmInitPromise;
}

/**
 * Detect AutoCAD version from binary magic header or DXF header string
 */
export function detectCadVersion(buffer: Uint8Array | string): string {
  if (typeof buffer === 'string') {
    const match = buffer.match(/\$ACADVER\s+1\s+(AC\d{4})/i);
    if (match && AUTOCAD_VERSIONS[match[1]]) {
      return AUTOCAD_VERSIONS[match[1]] + ` (${match[1]})`;
    }
    return 'AutoCAD DXF';
  }

  // Binary DWG: first 6 bytes contains ASCII version code (e.g. AC1021, AC1027)
  if (buffer.length >= 6) {
    let headerStr = '';
    for (let i = 0; i < 6; i++) {
      headerStr += String.fromCharCode(buffer[i]);
    }
    if (AUTOCAD_VERSIONS[headerStr]) {
      return AUTOCAD_VERSIONS[headerStr] + ` (${headerStr})`;
    }
    if (headerStr.startsWith('AC')) {
      return `AutoCAD DWG (${headerStr})`;
    }
  }

  return 'AutoCAD DWG';
}

/**
 * Parse DWG file buffer to SVG using LibreDWG WebAssembly
 */
export async function parseDwg(buffer: Uint8Array): Promise<CadParseResult> {
  const version = detectCadVersion(buffer);
  const inst = await getLibreDwgInstance();
  const { Dwg_File_Type } = await import('@mlightcad/libredwg-web');

  const ptr = inst.dwg_read_data(buffer, Dwg_File_Type.DWG);
  if (!ptr) {
    throw new Error('Nie udało się odczytać pliku DWG. Plik może być uszkodzony lub zabezpieczony.');
  }

  try {
    const db = inst.convert(ptr);
    if (!db) {
      throw new Error('Błąd konwersji wewnętrznej bazy DWG.');
    }

    const svg = inst.dwg_to_svg(db);
    if (!svg || svg.length < 50) {
      throw new Error('Nie wygenerowano wektorów SVG z pliku DWG.');
    }

    // Extract viewBox
    const vbMatch = svg.match(/viewBox=["']([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)["']/);
    const viewBox = vbMatch
      ? {
          x: parseFloat(vbMatch[1]),
          y: parseFloat(vbMatch[2]),
          width: Math.abs(parseFloat(vbMatch[3])),
          height: Math.abs(parseFloat(vbMatch[4])),
        }
      : { x: 0, y: 0, width: 1000, height: 800 };

    // Extract layers and entity count from db
    const layers: string[] = [];
    if (db.tables && db.tables.layer) {
      layers.push(...Object.keys(db.tables.layer));
    }

    const entityCount = Array.isArray(db.entities) ? db.entities.length : 0;

    return {
      svg,
      version,
      viewBox,
      entityCount: entityCount || (svg.match(/<(line|path|circle|polyline|text)/g) || []).length,
      layers: layers.length > 0 ? layers : ['Warstwa główna (0)'],
      sourceFormat: 'dwg',
    };
  } finally {
    inst.dwg_free(ptr);
  }
}

/**
 * Parse DXF text to SVG using dxf-parser and vector path generator
 */
export function parseDxf(dxfText: string): CadParseResult {
  const version = detectCadVersion(dxfText);
  const parser = new DxfParser();
  const parsed = parser.parseSync(dxfText);

  if (!parsed || !parsed.entities || parsed.entities.length === 0) {
    throw new Error('Plik DXF nie zawiera żadnych odczytywalnych obiektów wektorowych.');
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const updateBounds = (x: number, y: number) => {
    if (isFinite(x) && isFinite(y)) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  };

  const layersSet = new Set<string>();
  const svgElements: string[] = [];

  // Convert DXF entities to SVG
  for (const ent of (parsed.entities as any[])) {
    const layer = ent.layer || '0';
    layersSet.add(layer);

    let color = '#222222';
    if (ent.color !== undefined && ACI_COLORS[ent.color]) {
      color = ACI_COLORS[ent.color];
    }

    switch (ent.type) {
      case 'LINE': {
        const v = ent.vertices;
        if (v && v.length >= 2) {
          updateBounds(v[0].x, v[0].y);
          updateBounds(v[1].x, v[1].y);
          svgElements.push(
            `<line x1="${v[0].x}" y1="${-v[0].y}" x2="${v[1].x}" y2="${-v[1].y}" stroke="${color}" stroke-width="1" vector-effect="non-scaling-stroke" />`
          );
        }
        break;
      }
      case 'LWPOLYLINE':
      case 'POLYLINE': {
        const v = ent.vertices;
        if (v && v.length > 0) {
          const pts = v
            .map((p: any) => {
              updateBounds(p.x, p.y);
              return `${p.x},${-p.y}`;
            })
            .join(' ');
          const isClosed = ent.shape || ent.closed;
          svgElements.push(
            isClosed
              ? `<polygon points="${pts}" fill="none" stroke="${color}" stroke-width="1" vector-effect="non-scaling-stroke" />`
              : `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1" vector-effect="non-scaling-stroke" />`
          );
        }
        break;
      }
      case 'CIRCLE': {
        const c = ent.center;
        const r = ent.radius;
        if (c && r > 0) {
          updateBounds(c.x - r, c.y - r);
          updateBounds(c.x + r, c.y + r);
          svgElements.push(
            `<circle cx="${c.x}" cy="${-c.y}" r="${r}" fill="none" stroke="${color}" stroke-width="1" vector-effect="non-scaling-stroke" />`
          );
        }
        break;
      }
      case 'ARC': {
        const c = ent.center;
        const r = ent.radius;
        if (c && r > 0) {
          updateBounds(c.x - r, c.y - r);
          updateBounds(c.x + r, c.y + r);
          // startAngle and endAngle in radians or degrees
          const sAngle = ent.startAngle || 0;
          const eAngle = ent.endAngle || 0;
          const x1 = c.x + r * Math.cos(sAngle);
          const y1 = -(c.y + r * Math.sin(sAngle));
          const x2 = c.x + r * Math.cos(eAngle);
          const y2 = -(c.y + r * Math.sin(eAngle));
          let diff = eAngle - sAngle;
          if (diff < 0) diff += Math.PI * 2;
          const largeArc = diff > Math.PI ? 1 : 0;
          svgElements.push(
            `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="1" vector-effect="non-scaling-stroke" />`
          );
        }
        break;
      }
      case 'TEXT':
      case 'MTEXT': {
        const pos = ent.startPoint || ent.position;
        const text = ent.text || ent.string || '';
        const height = ent.textHeight || 10;
        if (pos && text) {
          updateBounds(pos.x, pos.y);
          updateBounds(pos.x + height * text.length * 0.6, pos.y + height);
          const safeText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          svgElements.push(
            `<text x="${pos.x}" y="${-pos.y}" font-size="${height}" fill="${color}" font-family="monospace">${safeText}</text>`
          );
        }
        break;
      }
      case 'SOLID':
      case '3DFACE': {
        const v = ent.vertices;
        if (v && v.length >= 3) {
          const pts = v
            .map((p: any) => {
              updateBounds(p.x, p.y);
              return `${p.x},${-p.y}`;
            })
            .join(' ');
          svgElements.push(
            `<polygon points="${pts}" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="1" vector-effect="non-scaling-stroke" />`
          );
        }
        break;
      }
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    minX = 0;
    minY = 0;
    maxX = 1000;
    maxY = 800;
  }

  const padding = Math.max((maxX - minX) * 0.05, (maxY - minY) * 0.05, 10);
  const vbX = minX - padding;
  const vbY = -maxY - padding;
  const vbW = maxX - minX + padding * 2;
  const vbH = maxY - minY + padding * 2;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="100%" height="100%">
  <g id="dxf-entities">
    ${svgElements.join('\n    ')}
  </g>
</svg>`;

  return {
    svg,
    version,
    viewBox: { x: vbX, y: vbY, width: vbW, height: vbH },
    entityCount: parsed.entities.length,
    layers: Array.from(layersSet),
    sourceFormat: 'dxf',
  };
}

/**
 * Apply architectural styling to SVG (Monochrome Technical, Original CAD colors, or AutoCAD Dark)
 */
export function styleSvg(
  rawSvg: string,
  style: CadColorStyle,
  lineWeightMm: number = 0.25
): string {
  let styled = rawSvg;

  // Ensure stroke-width is calibrated
  const strokeVal = Math.max(0.1, lineWeightMm).toFixed(2);

  if (style === 'monochrome') {
    // Replace all stroke colors with technical deep black #111111
    styled = styled.replace(/stroke="[^"]*"/g, 'stroke="#111111"');
    styled = styled.replace(/stroke:rgb\([^)]*\)/g, 'stroke:#111111');
    styled = styled.replace(/stroke:#[a-fA-F0-9]{3,6}/g, 'stroke:#111111');
    // Ensure texts are black
    styled = styled.replace(/fill="rgb\([^)]*\)"/g, 'fill="#111111"');
  } else if (style === 'autocad_dark') {
    // AutoCAD dark background: ensure light/white lines are visible
    // Any #000000 or black strokes become white/light cream
    styled = styled.replace(/stroke="#000000"/g, 'stroke="#f5ede4"');
    styled = styled.replace(/stroke="#111111"/g, 'stroke="#f5ede4"');
    styled = styled.replace(/stroke="rgb\(0,\s*0,\s*0\)"/g, 'stroke="#f5ede4"');
  }

  // Inject or update global style rules inside SVG
  const styleRule = `
    <style>
      * {
        stroke-linecap: round;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
      }
      line, path, circle, polyline, polygon {
        stroke-width: ${strokeVal}px;
      }
    </style>
  `;

  if (styled.includes('<defs>')) {
    styled = styled.replace('<defs>', `<defs>${styleRule}`);
  } else {
    styled = styled.replace(/<svg[^>]*>/, `$&<defs>${styleRule}</defs>`);
  }

  return styled;
}

/**
 * Render SVG to an HTML5 Canvas for high-resolution fallback or instant preview
 */
export async function svgToCanvas(
  svgString: string,
  width: number,
  height: number,
  backgroundColor?: string
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(100, Math.round(width));
    canvas.height = Math.max(100, Math.round(height));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context unavailable'));
    }

    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Standard paper dimensions in millimeters [width, height] (Landscape orientation)
 */
export const PAPER_DIMENSIONS: Record<PaperSize, [number, number]> = {
  a4: [297, 210],
  a3: [420, 297],
  a2: [594, 420],
  a1: [841, 594],
  auto: [297, 210], // Dynamically overridden in export function
};

/**
 * Export CAD SVG to PDF using jsPDF + svg2pdf (with 300 DPI canvas fallback)
 */
export async function exportCadToPdf(
  rawSvg: string,
  viewBox: { width: number; height: number },
  options: PdfExportOptions
): Promise<Blob> {
  const { paperSize, orientation, colorStyle, lineWeightMm, marginMm } = options;

  // Prepare styled SVG
  const styledSvg = styleSvg(rawSvg, colorStyle, lineWeightMm);

  // Determine sheet dimensions in mm
  let pageWidthMm = 297;
  let pageHeightMm = 210;

  const drawingAspect = viewBox.width / Math.max(1, viewBox.height);

  if (paperSize === 'auto') {
    // Auto-fit paper: match drawing aspect ratio with standard A3/A4 base scale
    const baseDimension = 420; // mm
    if (drawingAspect >= 1) {
      pageWidthMm = baseDimension;
      pageHeightMm = Math.round(baseDimension / drawingAspect) + marginMm * 2;
    } else {
      pageHeightMm = baseDimension;
      pageWidthMm = Math.round(baseDimension * drawingAspect) + marginMm * 2;
    }
  } else {
    const [w, h] = PAPER_DIMENSIONS[paperSize];
    if (orientation === 'landscape') {
      pageWidthMm = Math.max(w, h);
      pageHeightMm = Math.min(w, h);
    } else {
      pageWidthMm = Math.min(w, h);
      pageHeightMm = Math.max(w, h);
    }
  }

  // Calculate printable area
  const printableW = Math.max(10, pageWidthMm - marginMm * 2);
  const printableH = Math.max(10, pageHeightMm - marginMm * 2);

  // Fit drawing within printable area preserving aspect ratio
  const scale = Math.min(printableW / viewBox.width, printableH / viewBox.height);
  const drawWidthMm = viewBox.width * scale;
  const drawHeightMm = viewBox.height * scale;

  // Center on sheet
  const offsetX = marginMm + (printableW - drawWidthMm) / 2;
  const offsetY = marginMm + (printableH - drawHeightMm) / 2;

  // Initialize jsPDF document
  const pdf = new jsPDF({
    orientation: pageWidthMm >= pageHeightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidthMm, pageHeightMm],
    compress: true,
  });

  // If AutoCAD dark theme, fill background with dark charcoal
  if (colorStyle === 'autocad_dark') {
    pdf.setFillColor(20, 20, 20); // #141414
    pdf.rect(0, 0, pageWidthMm, pageHeightMm, 'F');
  }

  // Parse SVG element in browser DOM
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(styledSvg, 'image/svg+xml');
  const svgEl = svgDoc.documentElement as unknown as SVGElement;

  try {
    // Attempt crisp vector PDF rendering
    await svg2pdf(svgEl, pdf, {
      x: offsetX,
      y: offsetY,
      width: drawWidthMm,
      height: drawHeightMm,
    });
  } catch (vectorError) {
    console.warn('Vector PDF generation warning, falling back to 300 DPI rasterization:', vectorError);
    // 300 DPI calculation: 1 mm ≈ 11.81 pixels
    const renderWidthPx = Math.round(drawWidthMm * 11.81);
    const renderHeightPx = Math.round(drawHeightMm * 11.81);
    const canvas = await svgToCanvas(
      styledSvg,
      renderWidthPx,
      renderHeightPx,
      colorStyle === 'autocad_dark' ? '#141414' : undefined
    );
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawWidthMm, drawHeightMm, undefined, 'FAST');
  }

  return pdf.output('blob');
}

/**
 * Trigger file download helper
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
