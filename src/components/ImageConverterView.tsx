import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileImage,
  Layers,
  Sliders,
  Maximize2,
  ArrowRight,
  Eye,
  X
} from 'lucide-react';

export type TargetFormat = 'png' | 'jpeg' | 'webp' | 'bmp' | 'ico';

export interface ImageItem {
  id: string;
  file: File;
  originalName: string;
  originalSize: number;
  originalFormat: string;
  previewUrl: string;
  width: number;
  height: number;
  targetFormat: TargetFormat;
  quality: number; // 0.1 to 1.0
  scale: number; // 0.25, 0.5, 0.75, 1
  status: 'idle' | 'converting' | 'done' | 'error';
  errorMessage?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: number;
  convertedWidth?: number;
  convertedHeight?: number;
}

const FORMAT_CONFIG: Record<
  TargetFormat,
  { label: string; mime: string; ext: string; supportsQuality: boolean; desc: string }
> = {
  png: {
    label: 'PNG',
    mime: 'image/png',
    ext: 'png',
    supportsQuality: false,
    desc: 'Bezstratny, pełne wsparcie przezroczystości (alfa)',
  },
  jpeg: {
    label: 'JPG / JPEG',
    mime: 'image/jpeg',
    ext: 'jpg',
    supportsQuality: true,
    desc: 'Standard fotograficzny, wysoka kompresja',
  },
  webp: {
    label: 'WEBP',
    mime: 'image/webp',
    ext: 'webp',
    supportsQuality: true,
    desc: 'Nowoczesny format webowy: do 3x mniejszy rozmiar z przezroczystością',
  },
  bmp: {
    label: 'BMP',
    mime: 'image/bmp',
    ext: 'bmp',
    supportsQuality: false,
    desc: 'Nieskompresowana mapa bitowa Windows',
  },
  ico: {
    label: 'ICO (Favicon)',
    mime: 'image/x-icon',
    ext: 'ico',
    supportsQuality: false,
    desc: 'Ikona strony internetowej / aplikacji (standard 256x256)',
  },
};

export const ImageConverterView: React.FC = () => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [globalFormat, setGlobalFormat] = useState<TargetFormat>('webp');
  const [globalQuality, setGlobalQuality] = useState<number>(90);
  const [globalScale, setGlobalScale] = useState<number>(1);
  const [bgForJpg, setBgForJpg] = useState<'white' | 'black' | 'transparent'>('white');
  const [isDragging, setIsDragging] = useState(false);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<{ url: string; title: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Add files to queue
  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: Promise<ImageItem>[] = Array.from(files)
      .filter((file) => file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif|bmp|avif|ico)$/i.test(file.name))
      .map(async (file) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);

        // Extract format from extension or mime
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';

        // Read dimensions
        const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
          img.onerror = () => resolve({ width: 0, height: 0 });
          img.src = previewUrl;
        });

        return {
          id,
          file,
          originalName: file.name,
          originalSize: file.size,
          originalFormat: ext.toUpperCase(),
          previewUrl,
          width,
          height,
          targetFormat: globalFormat,
          quality: globalQuality,
          scale: globalScale,
          status: 'idle' as const,
        };
      });

    Promise.all(newItems).then((loadedItems) => {
      setItems((prev) => [...prev, ...loadedItems]);
    });
  }, [globalFormat, globalQuality, globalScale]);

  // Support Clipboard Paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith('image/')) {
          const file = clipboardItems[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        addFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // Convert a single image
  const convertSingleItem = async (item: ImageItem): Promise<ImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetW = Math.max(1, Math.round((img.naturalWidth || img.width || 800) * item.scale));
          const targetH = Math.max(1, Math.round((img.naturalHeight || img.height || 600) * item.scale));

          // For ICO, square sizing (max 256)
          if (item.targetFormat === 'ico') {
            const icoDim = Math.min(256, Math.max(targetW, targetH));
            canvas.width = icoDim;
            canvas.height = icoDim;
          } else {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ ...item, status: 'error', errorMessage: 'Błąd kontekstu Canvas' });
            return;
          }

          // Quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Background fill for JPEG if transparency
          if (item.targetFormat === 'jpeg') {
            ctx.fillStyle = bgForJpg === 'black' ? '#000000' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Draw image
          if (item.targetFormat === 'ico') {
            // Draw centered
            const x = (canvas.width - targetW) / 2;
            const y = (canvas.height - targetH) / 2;
            ctx.drawImage(img, x, y, targetW, targetH);
          } else {
            ctx.drawImage(img, 0, 0, targetW, targetH);
          }

          const mimeType = FORMAT_CONFIG[item.targetFormat].mime;
          const qualityFactor = item.quality / 100;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ ...item, status: 'error', errorMessage: 'Nie udało się wygenerować pliku' });
                return;
              }

              const convertedUrl = URL.createObjectURL(blob);
              resolve({
                ...item,
                status: 'done',
                convertedBlob: blob,
                convertedUrl,
                convertedSize: blob.size,
                convertedWidth: canvas.width,
                convertedHeight: canvas.height,
              });
            },
            mimeType,
            qualityFactor
          );
        } catch (err: any) {
          resolve({ ...item, status: 'error', errorMessage: err?.message || 'Błąd przetwarzania grafiki' });
        }
      };

      img.onerror = () => {
        resolve({ ...item, status: 'error', errorMessage: 'Nie udało się załadować obrazu' });
      };

      img.src = item.previewUrl;
    });
  };

  // Run conversion for a specific item
  const handleConvertItem = async (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'converting', errorMessage: undefined } : it))
    );

    const targetItem = items.find((it) => it.id === id);
    if (!targetItem) return;

    const updated = await convertSingleItem(targetItem);
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
  };

  // Convert all idle or queued items
  const handleConvertAll = async () => {
    setIsConvertingAll(true);
    setItems((prev) =>
      prev.map((it) => ({ ...it, status: 'converting', errorMessage: undefined }))
    );

    const promises = items.map((it) => convertSingleItem(it));
    const results = await Promise.all(promises);

    setItems(results);
    setIsConvertingAll(false);
  };

  // Download converted file
  const handleDownloadItem = (item: ImageItem) => {
    if (!item.convertedUrl) return;

    const baseName = item.originalName.substring(0, item.originalName.lastIndexOf('.')) || item.originalName;
    const targetExt = FORMAT_CONFIG[item.targetFormat].ext;
    const downloadName = `${baseName}.${targetExt}`;

    const link = document.createElement('a');
    link.href = item.convertedUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all converted items sequentially
  const handleDownloadAll = () => {
    const doneItems = items.filter((it) => it.status === 'done' && it.convertedUrl);
    if (doneItems.length === 0) return;

    doneItems.forEach((item, index) => {
      setTimeout(() => {
        handleDownloadItem(item);
      }, index * 300); // 300ms delay between downloads to prevent browser blocking
    });
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  // Clear all items
  const handleClearAll = () => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl);
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    });
    setItems([]);
  };

  // Update global format and apply to all non-converted
  const handleGlobalFormatChange = (fmt: TargetFormat) => {
    setGlobalFormat(fmt);
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        targetFormat: fmt,
        status: it.status === 'done' ? 'idle' : it.status,
      }))
    );
  };

  // Update global quality
  const handleGlobalQualityChange = (q: number) => {
    setGlobalQuality(q);
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        quality: q,
        status: it.status === 'done' ? 'idle' : it.status,
      }))
    );
  };

  // Update global scale
  const handleGlobalScaleChange = (scale: number) => {
    setGlobalScale(scale);
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        scale,
        status: it.status === 'done' ? 'idle' : it.status,
      }))
    );
  };

  // Stats calculation
  const totalOriginalBytes = items.reduce((sum, it) => sum + it.originalSize, 0);
  const doneItems = items.filter((it) => it.status === 'done' && it.convertedSize);
  const totalConvertedBytes = doneItems.reduce((sum, it) => sum + (it.convertedSize || 0), 0);
  const doneOriginalBytes = doneItems.reduce((sum, it) => sum + it.originalSize, 0);
  const savedBytes = doneOriginalBytes > totalConvertedBytes ? doneOriginalBytes - totalConvertedBytes : 0;
  const savingsPercent = doneOriginalBytes > 0 ? Math.round((savedBytes / doneOriginalBytes) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Global Control Bar */}
      <div className="glass-panel border border-[#2b211a] rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#d99b5a]" />
            <span className="text-sm font-medium text-[#f5ede4]">Ustawienia konwersji dla kolejki</span>
          </div>
          {items.length > 0 && (
            <span className="text-xs text-[#9e8f82]">
              W kolejce: <strong className="text-[#f5ede4]">{items.length}</strong> {items.length === 1 ? 'plik' : 'plików'} ({formatBytes(totalOriginalBytes)})
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Format Docelowy */}
          <div>
            <label className="block text-xs font-medium text-[#c4b5a5] mb-1.5 flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5 text-[#d99b5a]" />
              Format wyjściowy
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(Object.keys(FORMAT_CONFIG) as TargetFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleGlobalFormatChange(fmt)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-medium border transition-all ${
                    globalFormat === fmt
                      ? 'bg-[#f5ede4] text-[#120e0a] border-[#f5ede4] shadow-sm font-semibold'
                      : 'bg-[#140f0c] text-[#9e8f82] border-[#2e231c] hover:text-[#f5ede4] hover:bg-[#1f1712]'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#7a6b5e] mt-1.5">
              {FORMAT_CONFIG[globalFormat].desc}
            </p>
          </div>

          {/* Quality Slider (for JPG and WEBP) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#c4b5a5] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#d99b5a]" />
                Jakość kompresji
              </label>
              <span className="text-xs font-mono font-medium text-[#d99b5a]">
                {FORMAT_CONFIG[globalFormat].supportsQuality ? `${globalQuality}%` : 'Bezstratna'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              disabled={!FORMAT_CONFIG[globalFormat].supportsQuality}
              value={globalQuality}
              onChange={(e) => handleGlobalQualityChange(Number(e.target.value))}
              className="w-full accent-[#d99b5a] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-[#7a6b5e] mt-1">
              {FORMAT_CONFIG[globalFormat].supportsQuality
                ? '90% = wzorowy balans wagi i ostrości dla JC Studio'
                : 'Format PNG/BMP zapisuje obraz bez kompresji stratnej'}
            </p>
          </div>

          {/* Scaling / Dimensions */}
          <div>
            <label className="block text-xs font-medium text-[#c4b5a5] mb-1.5 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#7ec29a]" />
              Skalowanie wymiarów
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '100%', val: 1 },
                { label: '75%', val: 0.75 },
                { label: '50%', val: 0.5 },
                { label: '25%', val: 0.25 },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => handleGlobalScaleChange(s.val)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all ${
                    globalScale === s.val
                      ? 'bg-[#7ec29a] text-[#120e0a] border-[#7ec29a] shadow-sm font-semibold'
                      : 'bg-[#140f0c] text-[#9e8f82] border-[#2e231c] hover:text-[#f5ede4] hover:bg-[#1f1712]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#7a6b5e] mt-1.5">
              Zmniejsz wymiary w pikselach, aby zaoszczędzić jeszcze więcej MB
            </p>
          </div>

          {/* Tło dla JPG (White / Black) */}
          <div>
            <label className="block text-xs font-medium text-[#c4b5a5] mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#d99b5a]" />
              Tło dla przezroczystości (JPG)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBgForJpg('white')}
                className={`py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  bgForJpg === 'white'
                    ? 'bg-[#251b14] text-[#f5ede4] border-[#d99b5a] shadow-sm'
                    : 'bg-[#140f0c] text-[#9e8f82] border-[#2e231c] hover:text-[#f5ede4]'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-stone-400" />
                Białe tło
              </button>
              <button
                onClick={() => setBgForJpg('black')}
                className={`py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  bgForJpg === 'black'
                    ? 'bg-[#251b14] text-[#f5ede4] border-[#d99b5a] shadow-sm'
                    : 'bg-[#140f0c] text-[#9e8f82] border-[#2e231c] hover:text-[#f5ede4]'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-black border border-stone-600" />
                Czarne tło
              </button>
            </div>
            <p className="text-[11px] text-[#7a6b5e] mt-1.5">
              Zabezpiecza przed czarnym tłem po konwersji przezroczystych PNG
            </p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-[#d99b5a] bg-[#d99b5a]/10 scale-[0.99] shadow-2xl'
            : 'border-[#2e231c] hover:border-[#d99b5a]/50 bg-[#140f0c]/60 hover:bg-[#18120e]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.svg,.ico,.bmp,.webp,.avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#251b14] border border-[#382b20] flex items-center justify-center text-[#d99b5a] mb-4 shadow-xl group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-light text-[#f5ede4] mb-1">
            Przeciągnij i upuść pliki graficzne tutaj
          </h3>
          <p className="text-xs sm:text-sm text-[#9e8f82] mb-4 font-light">
            lub kliknij, aby wybrać z dysku komputera lub telefonu
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[#7a6b5e]">
            <span className="px-2 py-0.5 rounded bg-[#1e1713] border border-[#2e231c]">PNG</span>
            <span className="px-2 py-0.5 rounded bg-[#1e1713] border border-[#2e231c]">JPG</span>
            <span className="px-2 py-0.5 rounded bg-[#1e1713] border border-[#2e231c]">WEBP</span>
            <span className="px-2 py-0.5 rounded bg-[#1e1713] border border-[#2e231c]">SVG</span>
            <span className="px-2 py-0.5 rounded bg-[#1e1713] border border-[#2e231c]">GIF</span>
            <span className="px-2 py-0.5 rounded bg-[#1e1713] border border-[#2e231c]">BMP</span>
            <span className="px-2 py-0.5 rounded bg-[#1e1713] border border-[#2e231c]">ICO</span>
          </div>

          <p className="text-[11px] text-[#d99b5a]/80 mt-3 font-light">
            💡 Wskazówka: możesz też wcisnąć <strong className="text-[#f5ede4]">Ctrl + V</strong> w dowolnym miejscu, aby wkleić zrzut ekranu!
          </p>
        </div>
      </div>

      {/* Queue & Actions Section */}
      {items.length > 0 && (
        <div className="space-y-4">
          {/* Batch Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel border border-[#2b211a] rounded-2xl p-3.5 sm:p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#f5ede4]">
                Kolejka ({items.length})
              </span>
              {savingsPercent > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#7ec29a]/15 text-[#7ec29a] border border-[#7ec29a]/30">
                  ⚡ Oszczędność: -{savingsPercent}% ({formatBytes(savedBytes)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConvertAll}
                disabled={isConvertingAll || items.every((it) => it.status === 'done')}
                className="px-4 py-2 rounded-xl bg-[#f5ede4] hover:bg-white disabled:opacity-40 text-[#120e0a] text-xs font-medium shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConvertingAll ? 'animate-spin' : ''}`} />
                <span>{isConvertingAll ? 'Konwertowanie...' : 'Konwertuj wszystkie'}</span>
              </button>

              {items.some((it) => it.status === 'done') && (
                <button
                  onClick={handleDownloadAll}
                  className="px-4 py-2 rounded-xl bg-[#7ec29a] hover:bg-[#9ee2b9] text-[#120e0a] text-xs font-medium shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz wszystkie</span>
                </button>
              )}

              <button
                onClick={handleClearAll}
                className="p-2 rounded-xl text-[#9e8f82] hover:text-[#e07a68] hover:bg-[#251b14] transition-colors"
                title="Wyczyść całą listę"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {items.map((item) => {
              const isDone = item.status === 'done';
              const isConverting = item.status === 'converting';
              const isError = item.status === 'error';
              const reduction =
                isDone && item.convertedSize
                  ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    isDone
                      ? 'glass-panel border-[#7ec29a]/30'
                      : isError
                      ? 'bg-[#e07a68]/10 border-[#e07a68]/30'
                      : 'glass-panel border-[#2b211a] hover:border-[#382b20]'
                  }`}
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      onClick={() =>
                        setPreviewModalUrl({
                          url: item.convertedUrl || item.previewUrl,
                          title: item.originalName,
                        })
                      }
                      className="w-14 h-14 rounded-xl bg-[#140f0c] border border-[#2e231c] overflow-hidden flex-shrink-0 cursor-pointer group relative flex items-center justify-center"
                    >
                      <img
                        src={item.convertedUrl || item.previewUrl}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[#0c0907]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-4 h-4 text-[#f5ede4]" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-[#f5ede4] truncate" title={item.originalName}>
                          {item.originalName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1e1713] border border-[#2e231c] text-[#9e8f82]">
                          {item.originalFormat}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#9e8f82]">
                        <span>{formatBytes(item.originalSize)}</span>
                        {item.width > 0 && (
                          <>
                            <span>•</span>
                            <span>{item.width} × {item.height} px</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Target Format & Arrow */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <ArrowRight className="w-4 h-4 text-[#7a6b5e] hidden md:block" />

                    <div className="flex items-center gap-2">
                      <select
                        value={item.targetFormat}
                        onChange={(e) => {
                          const newFmt = e.target.value as TargetFormat;
                          setItems((prev) =>
                            prev.map((it) =>
                              it.id === item.id ? { ...it, targetFormat: newFmt, status: 'idle' } : it
                            )
                          );
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-[#f5ede4] text-xs font-medium focus:outline-none focus:border-[#d99b5a] cursor-pointer"
                      >
                        {(Object.keys(FORMAT_CONFIG) as TargetFormat[]).map((fmt) => (
                          <option key={fmt} value={fmt} className="bg-[#140f0c] text-[#f5ede4]">
                            {fmt.toUpperCase()}
                          </option>
                        ))}
                      </select>

                      {/* Result size & reduction */}
                      {isDone && item.convertedSize && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-[#7ec29a] bg-[#7ec29a]/10 px-2 py-1 rounded-lg border border-[#7ec29a]/20">
                            {formatBytes(item.convertedSize)}
                          </span>
                          {reduction > 0 && (
                            <span className="text-[11px] font-medium text-[#7ec29a]">
                              -{reduction}%
                            </span>
                          )}
                        </div>
                      )}

                      {isConverting && (
                        <span className="text-xs text-[#d99b5a] flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Konwertowanie...
                        </span>
                      )}

                      {isError && (
                        <span className="text-xs text-[#e07a68] flex items-center gap-1" title={item.errorMessage}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Błąd
                        </span>
                      )}
                    </div>

                    {/* Right: Individual Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {isDone ? (
                        <button
                          onClick={() => handleDownloadItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#7ec29a] hover:bg-[#9ee2b9] text-[#120e0a] text-xs font-medium shadow-sm flex items-center gap-1 transition-all active:scale-95"
                          title="Pobierz skonwertowany plik"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Pobierz</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConvertItem(item.id)}
                          disabled={isConverting}
                          className="px-3 py-1.5 rounded-xl bg-[#f5ede4] hover:bg-white disabled:opacity-40 text-[#120e0a] text-xs font-medium shadow-sm flex items-center gap-1 transition-all active:scale-95"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isConverting ? 'animate-spin' : ''}`} />
                          <span>Konwertuj</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-[#9e8f82] hover:text-[#e07a68] hover:bg-[#251b14] transition-colors"
                        title="Usuń z listy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] bg-[#18120e] border border-[#2e231c] rounded-3xl p-4 shadow-2xl flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#2e231c] text-sm font-medium text-[#f5ede4]">
              <span className="truncate">{previewModalUrl.title}</span>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="p-1 rounded-lg hover:bg-[#251b14] text-[#9e8f82] hover:text-[#f5ede4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewModalUrl.url}
                alt="Podgląd"
                className="max-w-full max-h-[70vh] rounded-xl object-contain border border-[#2e231c]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
