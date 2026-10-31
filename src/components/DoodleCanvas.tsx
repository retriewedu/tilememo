import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, RotateCcw, Upload, Trash2, Palette, Sparkles } from 'lucide-react';

interface DoodleCanvasProps {
  initialImage?: string;
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

const PRESET_COLORS = [
  '#0f172a', // dark slate / black
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
];

const STAMPS = [
  { label: '❤️ Hati', svg: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' },
  { label: '⭐ Bintang', svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  { label: '⚡ Petir', svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
  { label: '🛡️ Perisai', svg: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>' },
  { label: '⚔️ Pedang', svg: '<path d="M14.5 17.5L3 6V3h3l11.5 11.5-3 3z M13 19l2 2 4-4-2-2-4 4z M19 5l2 2-2 2-2-2 2-2z"/>' },
  { label: '💎 Permata', svg: '<polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/>' },
];

export const DoodleCanvas: React.FC<DoodleCanvasProps> = ({
  initialImage,
  onSave,
  width = 280,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0f172a');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize canvas with clean white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        saveState();
      };
      img.src = initialImage;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      saveState();
    }
  }, [width, height]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, width, height);
    setHistory((prev) => [...prev.slice(-15), imgData]);
    onSave(canvas.toDataURL('image/png'));
  }, [width, height, onSave]);

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop();
    const previous = newHistory[newHistory.length - 1];
    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setHistory(newHistory);
      onSave(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    saveState();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const scale = Math.min(width / img.width, height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (width - w) / 2;
        const y = (height - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        saveState();
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyStamp = (stampSvgPath: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="${encodeURIComponent(
      color
    )}">${stampSvgPath}</svg>`;

    const img = new Image();
    img.onload = () => {
      const x = (width - 100) / 2;
      const y = (height - 100) / 2;
      ctx.drawImage(img, x, y, 100, 100);
      saveState();
    };
    img.src = 'data:image/svg+xml;utf8,' + svgString;
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Canvas */}
      <div className="flex justify-center items-center bg-slate-100 p-2 rounded-xl border border-slate-200">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="rounded-lg border border-slate-300 shadow-2xs cursor-crosshair touch-none bg-white"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
        {/* Colors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Palette className="w-3.5 h-3.5 text-slate-500" />
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-md border transition-transform ${
                color === c && !isEraser ? 'scale-120 border-slate-900 shadow-2xs' : 'border-slate-300'
              }`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setIsEraser(false);
            }}
            className="w-5 h-5 rounded cursor-pointer border border-slate-300 bg-transparent"
          />
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500">Tebal:</span>
            {[2, 4, 8].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setBrushSize(sz)}
                className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                  brushSize === sz ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsEraser(!isEraser)}
            className={`p-1.5 rounded border transition-colors ${
              isEraser ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Penghapus"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={undo}
            disabled={history.length <= 1}
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={clearCanvas}
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
            title="Hapus Kanvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-medium text-xs shadow-2xs transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span>Upload Foto</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Preset Stamps */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
        <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-amber-500" /> Stempel:
        </span>
        {STAMPS.map((stamp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyStamp(stamp.svg)}
            className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] whitespace-nowrap shadow-2xs transition-colors"
          >
            {stamp.label}
          </button>
        ))}
      </div>
    </div>
  );
};
