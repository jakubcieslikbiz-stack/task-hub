import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileText,
  DraftingCompass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Grid,
  Layers,
  Check,
  CheckCircle2,
  FileCode,
  Sliders,
} from 'lucide-react';
import {
  parseDwg,
  parseDxf,
  styleSvg,
  exportCadToPdf,
  downloadBlob,
} from '../utils/cadConverter';
import type {
  CadParseResult,
  CadColorStyle,
  PaperSize,
  PaperOrientation,
} from '../utils/cadConverter';

interface CadFileItem {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  status: 'parsing' | 'ready' | 'error';
  errorMessage?: string;
  result?: CadParseResult;
  isConvertingPdf?: boolean;
}

export const DwgConverterView: React.FC = () => {
  const [files, setFiles] = useState<CadFileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Print & PDF Settings
  const [paperSize, setPaperSize] = useState<PaperSize>('a3');
  const [orientation, setOrientation] = useState<PaperOrientation>('landscape');
  const [colorStyle, setColorStyle] = useState<CadColorStyle>('monochrome');
  const [lineWeightMm, setLineWeightMm] = useState<number>(0.25);
  const [marginMm, setMarginMm] = useState<number>(10);

  // Viewport & Canvas Navigation
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [previewBg, setPreviewBg] = useState<'paper' | 'dark' | 'glass'>('paper');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;

  // Process uploaded CAD file (DWG or DXF)
  const processCadFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const newItem: CadFileItem = {
      id,
      file,
      name: file.name,
      sizeFormatted: formatBytes(file.size),
      status: 'parsing',
    };

    setFiles((prev) => [newItem, ...prev]);
    setActiveFileId(id);

    try {
      let result: CadParseResult;
      if (ext === 'dxf') {
        const text = await file.text();
        result = parseDxf(text);
      } else if (ext === 'dwg') {
        const arrayBuf = await file.arrayBuffer();
        result = await parseDwg(new Uint8Array(arrayBuf));
      } else {
        throw new Error('Nieobsługiwany format. Proszę wybrać plik .dwg lub .dxf');
      }

      setFiles((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'ready', result } : item))
      );
    } catch (err: any) {
      console.error('CAD Parsing Error:', err);
      setFiles((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'error', errorMessage: err.message || 'Błąd odczytu pliku CAD' }
            : item
        )
      );
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ext === 'dwg' || ext === 'dxf';
      });

      droppedFiles.forEach((file) => processCadFile(file));
    },
    [processCadFile]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => processCadFile(file));
      e.target.value = '';
    }
  };

  const removeFile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (activeFileId === id) {
        setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  // Viewport interactions (Zoom & Pan with cursor-anchoring)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Mouse coordinates relative to viewport center
    const mouseX = e.clientX - (rect.left + rect.width / 2);
    const mouseY = e.clientY - (rect.top + rect.height / 2);

    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;

    setZoom((prevZoom) => {
      // Allow up to 200x zoom (20,000%) for inspection of tiny architectural details
      const newZoom = Math.min(Math.max(0.02, prevZoom * zoomFactor), 200);
      if (newZoom === prevZoom) return prevZoom;

      // Adjust pan so the exact point under cursor stays in place
      setPan((prevPan) => ({
        x: mouseX - ((mouseX - prevPan.x) / prevZoom) * newZoom,
        y: mouseY - ((mouseY - prevPan.y) / prevZoom) * newZoom,
      }));

      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 0 = Left click, 1 = Middle click (scroll wheel), 2 = Right click
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Double click zooms 2.5x directly toward cursor point
  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - (rect.left + rect.width / 2);
    const mouseY = e.clientY - (rect.top + rect.height / 2);

    setZoom((prevZoom) => {
      const newZoom = Math.min(prevZoom * 2.5, 200);
      setPan((prevPan) => ({
        x: mouseX - ((mouseX - prevPan.x) / prevZoom) * newZoom,
        y: mouseY - ((mouseY - prevPan.y) / prevZoom) * newZoom,
      }));
      return newZoom;
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export current file to PDF
  const handleExportPdf = async (item: CadFileItem) => {
    if (!item.result) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, isConvertingPdf: true } : f))
    );

    try {
      const pdfBlob = await exportCadToPdf(item.result.svg, item.result.viewBox, {
        paperSize,
        orientation,
        colorStyle,
        lineWeightMm,
        marginMm,
        fileName: item.name,
      });

      const outName = item.name.replace(/\.[^/.]+$/, '') + '.pdf';
      downloadBlob(pdfBlob, outName);
    } catch (err: any) {
      alert(`Błąd eksportu do PDF: ${err.message || 'Wystąpił nieoczekiwany problem'}`);
    } finally {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, isConvertingPdf: false } : f))
      );
    }
  };

  // Download raw SVG
  const handleExportSvg = (item: CadFileItem) => {
    if (!item.result) return;
    const styled = styleSvg(item.result.svg, colorStyle, lineWeightMm);
    const blob = new Blob([styled], { type: 'image/svg+xml;charset=utf-8' });
    const outName = item.name.replace(/\.[^/.]+$/, '') + '.svg';
    downloadBlob(blob, outName);
  };

  // Direct print
  const handlePrint = async (item: CadFileItem) => {
    if (!item.result) return;
    const styled = styleSvg(item.result.svg, colorStyle, lineWeightMm);
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Zezwól na wyskakujące okienka (pop-up), aby wydrukować projekt.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${item.name} - Druk CAD JC Studio</title>
          <style>
            @page {
              size: ${paperSize === 'auto' ? 'auto' : paperSize.toUpperCase()} ${orientation};
              margin: ${marginMm}mm;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #fff;
            }
            svg {
              width: 100%;
              height: 100%;
              max-width: 100vw;
              max-height: 100vh;
            }
          </style>
        </head>
        <body>
          ${styled}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Compute live styled SVG for active drawing viewport
  const activeSvgStyled = activeFile?.result
    ? styleSvg(activeFile.result.svg, colorStyle, lineWeightMm)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Bar with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#140f0c] border border-[#2e231c]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2a1e16] border border-[#3d2c20] flex items-center justify-center text-[#d99b5a]">
            <DraftingCompass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-[#f5ede4]">Konwerter DWG & DXF → PDF</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7ec29a]/15 text-[#9ee2b9] border border-[#7ec29a]/30 font-mono">
                100% Offline WASM
              </span>
            </div>
            <p className="text-xs text-[#9e8f82]">
              Lokalna konwersja rzutów i rysunków architektonicznych bez wysyłania plików na serwery
            </p>
          </div>
        </div>

        {/* Action button to trigger file picker */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".dwg,.dxf"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5ede4] hover:bg-white text-[#120e0a] font-medium text-xs shadow-lg active:scale-95 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Wybierz pliki DWG / DXF
          </button>
        </div>
      </div>

      {/* Main Dropzone when no files are loaded */}
      {files.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[360px] ${
            isDragging
              ? 'border-[#d99b5a] bg-[#2a1e16]/60 shadow-[0_0_30px_rgba(217,155,90,0.2)]'
              : 'border-[#382b20] bg-[#140f0c]/60 hover:border-[#4d3a2a] hover:bg-[#1a1410]'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#221812] border border-[#3d2c20] flex items-center justify-center text-[#d99b5a] mb-4 shadow-xl">
            <DraftingCompass className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-medium text-[#f5ede4] mb-1">
            Przeciągnij i upuść pliki AutoCAD (.dwg, .dxf)
          </h3>
          <p className="text-xs text-[#9e8f82] max-w-md mb-6">
            Obsługuje rzuty, przekroje, schematy CAD od AutoCAD Release 14 aż po wersje 2024+.
            Konwersja odbywa się błyskawicznie w Twojej przeglądarce za pomocą silnika LibreDWG WebAssembly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#7a6b5e]">
            <span className="px-2.5 py-1 rounded-lg bg-[#1c1510] border border-[#2e231c]">
              Wektorowy PDF bez utraty ostrości
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#1c1510] border border-[#2e231c]">
              Formaty A4, A3, A2, A1 lub Auto
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#1c1510] border border-[#2e231c]">
              Styl monochromatyczny lub kolory CAD
            </span>
          </div>
        </div>
      )}

      {/* Main Workspace when files are loaded */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: File Tabs & Viewport (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* File Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer border transition-all whitespace-nowrap ${
                    activeFileId === file.id
                      ? 'bg-[#2a1e16] border-[#d99b5a]/60 text-[#f5ede4] shadow-md'
                      : 'bg-[#140f0c] border-[#2e231c] text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#1a1410]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-[#d99b5a]" />
                  <span className="font-medium max-w-[150px] truncate">{file.name}</span>
                  <span className="text-[10px] text-[#7a6b5e] font-mono">{file.sizeFormatted}</span>
                  {file.status === 'parsing' && (
                    <RefreshCw className="w-3 h-3 text-[#d99b5a] animate-spin" />
                  )}
                  {file.status === 'ready' && (
                    <CheckCircle2 className="w-3 h-3 text-[#7ec29a]" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-3 h-3 text-[#e57373]" />
                  )}
                  <button
                    onClick={(e) => removeFile(file.id, e)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[#382b20] text-[#7a6b5e] hover:text-[#e57373] transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add more button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-[#140f0c] border border-[#2e231c] text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#1a1410] transition-colors whitespace-nowrap"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Dodaj kolejny
              </button>
            </div>

            {/* Active File CAD Viewport */}
            {activeFile && (
              <div
                className={`relative rounded-3xl border border-[#2e231c] overflow-hidden flex flex-col transition-all ${
                  isFullscreen ? 'fixed inset-4 z-50 bg-[#0c0907] shadow-2xl' : 'h-[620px] bg-[#140f0c]'
                }`}
              >
                {/* Viewport Floating Top Controls */}
                <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                  {/* File meta badge */}
                  <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0907]/80 backdrop-blur-md border border-[#2e231c] text-xs text-[#f5ede4]">
                    <span className="font-medium truncate max-w-[200px]">{activeFile.name}</span>
                    {activeFile.result && (
                      <>
                        <span className="text-[#3d2c20]">|</span>
                        <span className="text-[11px] text-[#9e8f82] font-mono">
                          {activeFile.result.version}
                        </span>
                        <span className="text-[#3d2c20]">|</span>
                        <span className="text-[11px] text-[#7ec29a]">
                          {activeFile.result.entityCount} obiektów
                        </span>
                      </>
                    )}
                  </div>

                  {/* Viewport theme & grid pills */}
                  <div className="pointer-events-auto flex items-center gap-1.5 bg-[#0c0907]/80 backdrop-blur-md border border-[#2e231c] p-1 rounded-xl">
                    <button
                      onClick={() => setPreviewBg('paper')}
                      title="Podgląd wydruku na białym papierze"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        previewBg === 'paper'
                          ? 'bg-[#f5ede4] text-[#120e0a]'
                          : 'text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                    >
                      Biały arkusz
                    </button>
                    <button
                      onClick={() => setPreviewBg('dark')}
                      title="Ciemny motyw AutoCAD"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        previewBg === 'dark'
                          ? 'bg-[#2a1e16] text-[#d99b5a] border border-[#3d2c20]'
                          : 'text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                    >
                      AutoCAD Dark
                    </button>
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      title="Przełącz siatkę milimetrową"
                      className={`p-1.5 rounded-lg text-[11px] transition-all ${
                        showGrid ? 'text-[#d99b5a] bg-[#221812]' : 'text-[#7a6b5e] hover:text-[#f5ede4]'
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      title={isFullscreen ? 'Zmniejsz okno' : 'Pełny ekran'}
                      className="p-1.5 rounded-lg text-[#9e8f82] hover:text-[#f5ede4] transition-colors"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Viewport Content Area */}
                <div
                  ref={viewportRef}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onDoubleClick={handleDoubleClick}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center select-none ${
                    previewBg === 'paper'
                      ? 'bg-[#ffffff]'
                      : previewBg === 'dark'
                      ? 'bg-[#121212]'
                      : 'bg-[#0e0a08]'
                  }`}
                  style={{
                    backgroundImage: showGrid
                      ? previewBg === 'paper'
                        ? 'radial-gradient(#dddddd 1px, transparent 1px)'
                        : 'radial-gradient(#262626 1px, transparent 1px)'
                      : 'none',
                    backgroundSize: '24px 24px',
                  }}
                >
                  {/* Parsing state spinner */}
                  {activeFile.status === 'parsing' && (
                    <div className="flex flex-col items-center gap-3 text-center p-6 bg-[#0c0907]/90 rounded-2xl border border-[#2e231c] z-30">
                      <RefreshCw className="w-8 h-8 text-[#d99b5a] animate-spin" />
                      <p className="text-sm font-medium text-[#f5ede4]">
                        Przetwarzanie bazy CAD przez WebAssembly...
                      </p>
                      <span className="text-xs text-[#9e8f82]">
                        Dekodowanie struktur wektorowych DWG/DXF
                      </span>
                    </div>
                  )}

                  {/* Error State */}
                  {activeFile.status === 'error' && (
                    <div className="flex flex-col items-center gap-3 text-center p-6 bg-[#1f1212] rounded-2xl border border-[#e57373]/30 max-w-md z-30">
                      <AlertCircle className="w-8 h-8 text-[#e57373]" />
                      <p className="text-sm font-medium text-[#ffcdd2]">
                        Nie udało się załadować pliku CAD
                      </p>
                      <p className="text-xs text-[#ef9a9a]">
                        {activeFile.errorMessage || 'Plik może być uszkodzony lub zawierać nieobsługiwane obiekty 3D.'}
                      </p>
                    </div>
                  )}

                  {/* Rendered CAD SVG Canvas */}
                  {activeFile.status === 'ready' && activeSvgStyled && (
                    <div
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isPanning ? 'none' : 'transform 0.05s ease-out',
                      }}
                      className="relative w-full h-full flex items-center justify-center pointer-events-none"
                    >
                      {/* Sheet Simulation Box (Visual paper border) */}
                      <div
                        className={`relative shadow-2xl transition-shadow ${
                          previewBg === 'paper'
                            ? 'border border-[#d0d0d0] bg-[#ffffff]'
                            : 'border border-[#333333] bg-[#141414]'
                        }`}
                        style={{
                          width: '92%',
                          height: '92%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          className="w-full h-full flex items-center justify-center p-4 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                          dangerouslySetInnerHTML={{ __html: activeSvgStyled }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Viewport Floating Bottom Navigation Controls */}
                <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                  {/* Left: Layers Button */}
                  <div className="pointer-events-auto">
                    {activeFile.result?.layers && activeFile.result.layers.length > 0 && (
                      <button
                        onClick={() => setShowLayers(!showLayers)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md border transition-all ${
                          showLayers
                            ? 'bg-[#2a1e16] text-[#d99b5a] border-[#d99b5a]/40 shadow-lg'
                            : 'bg-[#0c0907]/80 text-[#9e8f82] hover:text-[#f5ede4] border-[#2e231c]'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Warstwy ({activeFile.result.layers.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Zoom controls & Reset */}
                  <div className="pointer-events-auto flex items-center gap-1 bg-[#0c0907]/80 backdrop-blur-md border border-[#2e231c] p-1 rounded-xl">
                    <button
                      onClick={() => setZoom((z) => Math.max(0.02, z * 0.75))}
                      title="Oddal (Kółko myszy w dół)"
                      className="p-1.5 rounded-lg text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221812] transition-colors"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-[#f5ede4] px-2 min-w-[55px] text-center">
                      {zoom >= 100 ? `${(zoom * 100).toLocaleString('pl-PL')}%` : `${Math.round(zoom * 100)}%`}
                    </span>
                    <button
                      onClick={() => setZoom((z) => Math.min(200, z * 1.35))}
                      title="Przybliż (Kółko myszy w górę)"
                      className="p-1.5 rounded-lg text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221812] transition-colors"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick zoom presets */}
                    <div className="w-[1px] h-4 bg-[#2e231c] mx-0.5" />
                    <button
                      onClick={() => {
                        setZoom(5);
                        setPan({ x: 0, y: 0 });
                      }}
                      title="Przybliżenie 500%"
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#221812] transition-colors"
                    >
                      5x
                    </button>
                    <button
                      onClick={() => {
                        setZoom(20);
                        setPan({ x: 0, y: 0 });
                      }}
                      title="Przybliżenie 2000%"
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#221812] transition-colors"
                    >
                      20x
                    </button>
                    <button
                      onClick={() => {
                        setZoom(50);
                        setPan({ x: 0, y: 0 });
                      }}
                      title="Maksymalny detal 5000%"
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#9e8f82] hover:text-[#d99b5a] hover:bg-[#221812] transition-colors"
                    >
                      50x
                    </button>

                    <div className="w-[1px] h-4 bg-[#2e231c] mx-0.5" />
                    <button
                      onClick={resetView}
                      title="Dopasuj widok do ekranu (100%)"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221812] transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Dopasuj</span>
                    </button>
                  </div>
                </div>

                {/* Popover Layer List Drawer */}
                {showLayers && activeFile.result?.layers && (
                  <div className="absolute bottom-14 left-3 z-30 w-72 max-h-60 overflow-y-auto rounded-2xl bg-[#140f0c]/95 backdrop-blur-xl border border-[#382b20] p-3 shadow-2xl space-y-1.5 scrollbar-thin">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#2e231c] text-xs font-medium text-[#f5ede4]">
                      <span>Wykryte warstwy CAD</span>
                      <span className="text-[10px] text-[#9e8f82] font-mono">
                        {activeFile.result.layers.length}
                      </span>
                    </div>
                    <div className="space-y-1 pt-1">
                      {activeFile.result.layers.map((layer, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-[#d1c4b7] bg-[#1c1510] border border-[#2e231c]/50 truncate"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#d99b5a]" />
                          <span className="truncate">{layer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Print & PDF Settings Panel (1 col) */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-[#140f0c] border border-[#2e231c] space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#2e231c]">
                <Sliders className="w-4 h-4 text-[#d99b5a]" />
                <h3 className="text-sm font-medium text-[#f5ede4]">Ustawienia wydruku & PDF</h3>
              </div>

              {/* Sheet Format */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-[#9e8f82] uppercase tracking-wider block">
                  Format arkusza
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'auto', label: 'Dopasuj (Auto)' },
                    { id: 'a4', label: 'A4 (297x210)' },
                    { id: 'a3', label: 'A3 (420x297)' },
                    { id: 'a2', label: 'A2 (594x420)' },
                    { id: 'a1', label: 'A1 (841x594)' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setPaperSize(fmt.id as PaperSize)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        paperSize === fmt.id
                          ? 'bg-[#2a1e16] border-[#d99b5a] text-[#f5ede4] shadow-md'
                          : 'bg-[#1c1510] border-[#2e231c] text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221812]'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sheet Orientation */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-[#9e8f82] uppercase tracking-wider block">
                  Orientacja strony
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      orientation === 'landscape'
                        ? 'bg-[#2a1e16] border-[#d99b5a] text-[#f5ede4] shadow-md'
                        : 'bg-[#1c1510] border-[#2e231c] text-[#9e8f82] hover:text-[#f5ede4]'
                    }`}
                  >
                    Pozioma (Landscape)
                  </button>
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      orientation === 'portrait'
                        ? 'bg-[#2a1e16] border-[#d99b5a] text-[#f5ede4] shadow-md'
                        : 'bg-[#1c1510] border-[#2e231c] text-[#9e8f82] hover:text-[#f5ede4]'
                    }`}
                  >
                    Pionowa (Portrait)
                  </button>
                </div>
              </div>

              {/* Color Scheme */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-[#9e8f82] uppercase tracking-wider block">
                  Kolorystyka rysunku
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'monochrome',
                      title: 'Monochromatyczny',
                      desc: 'Czarny tusz techniczny na białym tle (Standard)',
                    },
                    {
                      id: 'cad_layers',
                      title: 'Kolory warstw CAD',
                      desc: 'Oryginalne barwy AutoCAD (czerwony, żółty, cyjan itp.)',
                    },
                    {
                      id: 'autocad_dark',
                      title: 'AutoCAD Dark',
                      desc: 'Ciemne tło robocze z kontrastowymi liniami',
                    },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setColorStyle(style.id as CadColorStyle)}
                      className={`w-full p-2.5 rounded-xl text-left border transition-all ${
                        colorStyle === style.id
                          ? 'bg-[#2a1e16] border-[#d99b5a] text-[#f5ede4] shadow-md'
                          : 'bg-[#1c1510] border-[#2e231c] text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#221812]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{style.title}</span>
                        {colorStyle === style.id && <Check className="w-3.5 h-3.5 text-[#d99b5a]" />}
                      </div>
                      <p className="text-[10px] text-[#7a6b5e] mt-0.5">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#9e8f82]">
                  <span className="uppercase tracking-wider">Grubość linii</span>
                  <span className="text-[#f5ede4]">{lineWeightMm.toFixed(2)} mm</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 0.15, label: '0.15 mm' },
                    { val: 0.25, label: '0.25 mm' },
                    { val: 0.5, label: '0.50 mm' },
                  ].map((lw) => (
                    <button
                      key={lw.val}
                      onClick={() => setLineWeightMm(lw.val)}
                      className={`py-1.5 rounded-xl text-xs font-mono border text-center transition-all ${
                        lineWeightMm === lw.val
                          ? 'bg-[#2a1e16] border-[#d99b5a] text-[#f5ede4]'
                          : 'bg-[#1c1510] border-[#2e231c] text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                    >
                      {lw.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-[#9e8f82] uppercase tracking-wider block">
                  Marginesy arkusza
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 0, label: '0 mm' },
                    { val: 10, label: '10 mm' },
                    { val: 20, label: '20 mm' },
                  ].map((m) => (
                    <button
                      key={m.val}
                      onClick={() => setMarginMm(m.val)}
                      className={`py-1.5 rounded-xl text-xs font-mono border text-center transition-all ${
                        marginMm === m.val
                          ? 'bg-[#2a1e16] border-[#d99b5a] text-[#f5ede4]'
                          : 'bg-[#1c1510] border-[#2e231c] text-[#9e8f82] hover:text-[#f5ede4]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2 border-t border-[#2e231c]">
                {/* PDF Primary Download */}
                <button
                  disabled={!activeFile || activeFile.status !== 'ready' || activeFile.isConvertingPdf}
                  onClick={() => activeFile && handleExportPdf(activeFile)}
                  className="w-full py-3 px-4 rounded-xl bg-[#f5ede4] hover:bg-white text-[#120e0a] font-medium text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {activeFile?.isConvertingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#120e0a]" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Pobierz wektorowy PDF</span>
                </button>

                {/* Secondary Actions: SVG download and Print */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!activeFile || activeFile.status !== 'ready'}
                    onClick={() => activeFile && handleExportSvg(activeFile)}
                    className="py-2 px-3 rounded-xl bg-[#1c1510] hover:bg-[#241a14] text-[#d1c4b7] hover:text-[#f5ede4] border border-[#2e231c] text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#d99b5a]" />
                    <span>Zapisz SVG</span>
                  </button>

                  <button
                    disabled={!activeFile || activeFile.status !== 'ready'}
                    onClick={() => activeFile && handlePrint(activeFile)}
                    className="py-2 px-3 rounded-xl bg-[#1c1510] hover:bg-[#241a14] text-[#d1c4b7] hover:text-[#f5ede4] border border-[#2e231c] text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#7ec29a]" />
                    <span>Drukuj</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
