import React, { useState } from 'react';
import { TileData, TileFaceContent, TileStyle } from '../types/memo';
import { EquationRenderer } from './EquationRenderer';
import { soundFx } from '../utils/sound';
import {
  Plus,
  Repeat,
  Lock,
  Unlock,
  Trash2,
  Image as ImageIcon,
  Sigma,
  FileText,
  Mic,
  Play,
  Pause,
  Copy,
  Check,
  ListTodo,
  CheckSquare,
  Square,
  Link as LinkIcon,
  ExternalLink,
  Paperclip,
  Download,
  File,
} from 'lucide-react';

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i] || 'MB'}`;
}

interface TileProps {
  tile: TileData;
  row: number;
  col: number;
  tileSize?: number;
  canDelete?: boolean;
  hasTopNeighbor?: boolean;
  hasBottomNeighbor?: boolean;
  hasLeftNeighbor?: boolean;
  hasRightNeighbor?: boolean;
  onEditTile: (tile: TileData) => void;
  onQuickFlip: (row: number, col: number, e: React.MouseEvent) => void;
  onToggleLock: (row: number, col: number, e: React.MouseEvent) => void;
  onDeleteTile: (row: number, col: number, e: React.MouseEvent) => void;
  onAddAdjacent: (row: number, col: number, e: React.MouseEvent) => void;
  onSwapDrop: (srcRow: number, srcCol: number, targetRow: number, targetCol: number) => void;
  isHighlighted?: boolean;
}

function renderLineWithLinks(line: string) {
  // Regex to match markdown links: [label](url) OR standalone URLs: https?://\S+
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      elements.push(line.substring(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Markdown link [label](url)
      const label = match[1];
      const url = match[2];
      elements.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sky-600 hover:text-sky-800 underline decoration-sky-400 font-medium z-10 cursor-pointer inline-flex items-center gap-0.5"
          title={url}
        >
          <span>{label}</span>
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      );
    } else if (match[3]) {
      // Direct URL
      const url = match[3];
      elements.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sky-600 hover:text-sky-800 underline decoration-sky-400 font-medium z-10 cursor-pointer inline-flex items-center gap-0.5"
          title={url}
        >
          <span>{url.replace(/^https?:\/\//, '')}</span>
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    elements.push(line.substring(lastIndex));
  }

  return elements.length > 0 ? elements : line;
}

export const Tile: React.FC<TileProps> = ({
  tile,
  row,
  col,
  tileSize = 120,
  canDelete = false,
  hasTopNeighbor = false,
  hasBottomNeighbor = false,
  hasLeftNeighbor = false,
  hasRightNeighbor = false,
  onEditTile,
  onQuickFlip,
  onToggleLock,
  onDeleteTile,
  onAddAdjacent,
  onSwapDrop,
  isHighlighted = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingSelf, setIsDraggingSelf] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const isFlipped = tile.isFlipped ?? false;
  const isLocked = tile.isLocked ?? false;

  const currentFace: TileFaceContent = isFlipped ? tile.back : tile.front;
  const currentStyle: TileStyle = isFlipped ? tile.backStyle : tile.frontStyle;

  const hasContent = Boolean(
    currentFace.title ||
      currentFace.text ||
      currentFace.equation ||
      currentFace.image ||
      currentFace.audio ||
      currentFace.linkUrl ||
      currentFace.fileData
  );

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    let copyText = '';
    if (currentFace.type === 'equation') {
      copyText = currentFace.equation || '';
    } else if (currentFace.type === 'text') {
      copyText = `${currentFace.title ? currentFace.title + '\n' : ''}${currentFace.text || ''}`;
      if (currentFace.linkUrl) {
        copyText += (copyText ? '\n' : '') + currentFace.linkUrl;
      }
      if (currentFace.fileName) {
        copyText += (copyText ? '\n' : '') + `[Lampiran: ${currentFace.fileName}]`;
      }
    } else if (currentFace.type === 'file') {
      copyText = `${currentFace.title ? currentFace.title + '\n' : ''}[Lampiran: ${currentFace.fileName || 'Berkas'}]`;
    } else if (currentFace.title) {
      copyText = currentFace.title + (currentFace.linkUrl ? '\n' + currentFace.linkUrl : '');
      if (currentFace.fileName) {
        copyText += (copyText ? '\n' : '') + `[Lampiran: ${currentFace.fileName}]`;
      }
    } else if (currentFace.linkUrl) {
      copyText = currentFace.linkUrl;
    } else if (currentFace.fileName) {
      copyText = `[Lampiran: ${currentFace.fileName}]`;
    }
    if (copyText) {
      navigator.clipboard.writeText(copyText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    setIsDraggingSelf(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDraggingSelf(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isLocked) return;
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLocked) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const src = JSON.parse(dataStr);
      if (typeof src.row === 'number' && typeof src.col === 'number') {
        if (src.row !== row || src.col !== col) {
          soundFx.playSwap();
          onSwapDrop(src.row, src.col, row, col);
        }
      }
    } catch {
      // Ignore invalid drag
    }
  };

  // Clicking tile opens TileEditor directly without preview!
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playSelect();
    onEditTile(tile);
  };

  const getBorderCss = (style?: TileStyle) => {
    if (!style) {
      return { borderWidth: '1px', borderStyle: 'solid', borderColor: '#e2e8f0' };
    }
    return {
      borderWidth: `${style.borderWidth}px`,
      borderStyle: style.borderStyle === 'pixel' ? 'solid' : style.borderStyle,
      borderColor: style.borderColor,
    };
  };

  return (
    <div
      style={{
        width: `${tileSize}px`,
        height: `${tileSize}px`,
      }}
      className="relative group select-none flex items-center justify-center m-3"
    >
      {/* 1. TOP PLUS BUTTON (Click to add tile above) */}
      {!hasTopNeighbor && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            soundFx.playSelect();
            onAddAdjacent(row - 1, col, e);
          }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-white hover:bg-slate-900 text-slate-600 hover:text-white border border-slate-300 shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Tambah tile di atas"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 2. BOTTOM PLUS BUTTON (Click to add tile below) */}
      {!hasBottomNeighbor && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            soundFx.playSelect();
            onAddAdjacent(row + 1, col, e);
          }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-white hover:bg-slate-900 text-slate-600 hover:text-white border border-slate-300 shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Tambah tile di bawah"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 3. LEFT PLUS BUTTON (Click to add tile to the left) */}
      {!hasLeftNeighbor && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            soundFx.playSelect();
            onAddAdjacent(row, col - 1, e);
          }}
          className="absolute top-1/2 -left-3 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white hover:bg-slate-900 text-slate-600 hover:text-white border border-slate-300 shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Tambah tile di kiri"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 4. RIGHT PLUS BUTTON (Click to add tile to the right) */}
      {!hasRightNeighbor && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            soundFx.playSelect();
            onAddAdjacent(row, col + 1, e);
          }}
          className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white hover:bg-slate-900 text-slate-600 hover:text-white border border-slate-300 shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Tambah tile di kanan"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}

      {/* MAIN TILE CARD */}
      <div
        draggable={!isLocked}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          backgroundColor: currentStyle.backgroundColor || '#ffffff',
          color: currentStyle.textColor || '#0f172a',
          fontFamily: currentStyle.fontFamily || 'Plus Jakarta Sans',
          borderRadius: `${currentStyle.borderRadius ?? 8}px`,
          textAlign: currentStyle.textAlign || 'center',
          ...getBorderCss(currentStyle),
        }}
        className={`w-full h-full p-2.5 flex flex-col justify-between overflow-hidden shadow-xs cursor-pointer transition-all duration-150 relative ${
          isDraggingSelf
            ? 'opacity-30 scale-95 border-2 border-dashed border-slate-400'
            : isDragOver
            ? 'scale-105 ring-2 ring-indigo-500 ring-offset-2 shadow-md bg-indigo-50/60'
            : isHighlighted
            ? 'ring-2 ring-amber-500 shadow-md'
            : 'hover:shadow-md hover:scale-[1.02]'
        }`}
        title="Klik untuk Edit Langsung · Drag untuk Swap"
      >
        {/* Top Header: Lock Icon if locked, NO Sisi 1 / Sisi 2 label! */}
        <div className="flex items-center justify-end w-full text-[10px] leading-none min-h-[12px]">
          {isLocked && <Lock className="w-3 h-3 text-amber-600" />}
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center my-1 overflow-hidden w-full">
          {hasContent ? (
            <>
              {currentFace.title && (
                <div
                  className="font-bold text-xs w-full truncate mb-0.5 leading-tight"
                  style={{ color: currentStyle.textColor }}
                >
                  {currentFace.title}
                </div>
              )}

              {/* Dedicated Tile Hyperlink Chip */}
              {currentFace.linkUrl && (
                <a
                  href={currentFace.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 border border-sky-200 text-[10px] font-medium max-w-[95%] truncate transition-colors z-10"
                  title={currentFace.linkUrl}
                >
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">
                    {currentFace.linkTitle || currentFace.linkUrl.replace(/^https?:\/\//, '')}
                  </span>
                </a>
              )}

              {/* Dedicated Tile File Attachment Chip (shown when with text or other content) */}
              {currentFace.fileData && (currentFace.text || currentFace.type !== 'file') && (
                <a
                  href={currentFace.fileData}
                  download={currentFace.fileName || 'berkas'}
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playSelect();
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-950 border border-emerald-200 text-[10px] font-medium max-w-[95%] truncate transition-colors z-10 group/file"
                  title={`Unduh berkas: ${currentFace.fileName || 'berkas'} ${currentFace.fileSize ? `(${formatFileSize(currentFace.fileSize)})` : ''}`}
                >
                  <Paperclip className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {currentFace.fileName || 'Berkas Terlampir'}
                  </span>
                  <Download className="w-2.5 h-2.5 text-emerald-500 opacity-60 group-hover/file:opacity-100 shrink-0" />
                </a>
              )}

              {/* Dedicated File Tile View (when tile is primarily a file) */}
              {currentFace.type === 'file' && currentFace.fileData && !currentFace.text && (
                <div className="w-full flex flex-col items-center justify-center p-1 gap-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                    <File className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 line-clamp-1 max-w-[95%] truncate" title={currentFace.fileName}>
                    {currentFace.fileName || 'Berkas'}
                  </span>
                  {currentFace.fileSize ? (
                    <span className="text-[9px] text-slate-400 font-mono">
                      {formatFileSize(currentFace.fileSize)}
                    </span>
                  ) : null}
                  <a
                    href={currentFace.fileData}
                    download={currentFace.fileName || 'berkas'}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playSelect();
                    }}
                    className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-medium shadow-2xs transition-colors"
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>Unduh</span>
                  </a>
                </div>
              )}

              {/* Equation */}
              {currentFace.type === 'equation' && currentFace.equation && (
                <div className="w-full flex items-center justify-center max-h-full overflow-hidden text-center scale-90 origin-center">
                  <EquationRenderer equation={currentFace.equation} displayMode={false} />
                </div>
              )}

              {/* Image */}
              {currentFace.type === 'image' && currentFace.image && (
                <div className="w-full h-full flex items-center justify-center p-0.5">
                  <img
                    src={currentFace.image}
                    alt={currentFace.title || 'Tile image'}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>
              )}

              {/* Text */}
              {currentFace.type === 'text' && currentFace.text && (
                (() => {
                  const lines = currentFace.text.split('\n').filter(Boolean).slice(0, 3);
                  const hasList = lines.some((l) => /^(\[[ xX]\]|\d+\.)\s/.test(l));

                  if (!hasList) {
                    return (
                      <p
                        className="text-[11px] line-clamp-3 leading-tight w-full break-words opacity-90"
                        style={{ color: currentStyle.textColor }}
                      >
                        {renderLineWithLinks(currentFace.text)}
                      </p>
                    );
                  }

                  return (
                    <div className="w-full flex flex-col gap-0.5 text-left text-[10px] leading-tight overflow-hidden">
                      {lines.map((line, idx) => {
                        const checkMatch = line.match(/^(\[[ xX]\])\s(.*)$/);
                        if (checkMatch) {
                          const isDone = checkMatch[1].toLowerCase() === '[x]';
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-1 w-full truncate ${
                                isDone ? 'line-through opacity-50' : 'opacity-90'
                              }`}
                              style={{ color: currentStyle.textColor }}
                            >
                              {isDone ? (
                                <CheckSquare className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <Square className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              )}
                              <span className="truncate">{renderLineWithLinks(checkMatch[2])}</span>
                            </div>
                          );
                        }

                        const numMatch = line.match(/^(\d+\.)\s(.*)$/);
                        if (numMatch) {
                          return (
                            <div
                              key={idx}
                              className="flex items-start gap-1 w-full truncate opacity-90"
                              style={{ color: currentStyle.textColor }}
                            >
                              <span className="font-semibold text-slate-400 text-[9px] shrink-0 mt-0.5">
                                {numMatch[1]}
                              </span>
                              <span className="truncate">{renderLineWithLinks(numMatch[2])}</span>
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="truncate opacity-90" style={{ color: currentStyle.textColor }}>
                            {renderLineWithLinks(line)}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}

              {/* Voice Memo */}
              {currentFace.type === 'voice' && (
                <div className="w-full flex flex-col items-center justify-center p-1">
                  {currentFace.audio ? (
                    <>
                      <audio
                        ref={audioRef}
                        src={currentFace.audio}
                        onEnded={() => setIsPlayingAudio(false)}
                      />
                      <button
                        type="button"
                        onClick={handlePlayAudio}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 shadow-2xs active:scale-95 transition-all"
                      >
                        {isPlayingAudio ? (
                          <Pause className="w-3.5 h-3.5 fill-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        )}
                        <span>{isPlayingAudio ? 'Jeda' : 'Putar Voice'}</span>
                      </button>
                      {currentFace.audioDuration ? (
                        <span className="text-[10px] font-mono text-slate-500 mt-1">
                          0:{currentFace.audioDuration < 10 ? '0' : ''}{currentFace.audioDuration}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Belum ada rekaman</span>
                    </div>
                  )}

                  {currentFace.text && (
                    <p className="text-[10px] line-clamp-2 mt-1 opacity-80 text-center">
                      {renderLineWithLinks(currentFace.text)}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-400 group-hover:text-slate-600 text-xs italic">
              Klik untuk mengedit
            </div>
          )}
        </div>

        {/* Bottom Actions: Type icon & quick buttons: LOCK, FLIP, COPY, DELETE */}
        <div className="flex items-center justify-between w-full text-[10px] pt-0.5 opacity-80">
          <div className="flex items-center gap-1 text-slate-400">
            {currentFace.type === 'equation' && <Sigma className="w-3 h-3" />}
            {currentFace.type === 'image' && <ImageIcon className="w-3 h-3" />}
            {currentFace.type === 'voice' && <Mic className="w-3 h-3 text-slate-700" />}
            {currentFace.type === 'file' && <Paperclip className="w-3 h-3 text-emerald-600" />}
            {currentFace.type === 'text' && hasContent && (
              currentFace.text?.includes('[ ]') || currentFace.text?.includes('[x]') ? (
                <ListTodo className="w-3 h-3 text-slate-600" />
              ) : (
                <FileText className="w-3 h-3" />
              )
            )}
            {Boolean(
              currentFace.linkUrl ||
              (currentFace.text && (/https?:\/\//i.test(currentFace.text) || /\[.+\]\(.+\)/.test(currentFace.text)))
            ) && (
              <span title="Memiliki hyperlink">
                <LinkIcon className="w-3 h-3 text-sky-500" />
              </span>
            )}
            {Boolean(currentFace.fileData && currentFace.type !== 'file') && (
              <span title={`Memiliki lampiran: ${currentFace.fileName || 'berkas'}`}>
                <Paperclip className="w-3 h-3 text-emerald-600" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* 1. Lock button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playSelect();
                onToggleLock(row, col, e);
              }}
              title={isLocked ? 'Buka Kunci' : 'Kunci Tile'}
              className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              {isLocked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3" />}
            </button>

            {/* 2. Quick Flip button (NO SISI 1 / SISI 2 TEXT) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playFlip();
                onQuickFlip(row, col, e);
              }}
              title="Balik Sisi Tile"
              className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Repeat className="w-3 h-3" />
            </button>

            {/* 3. Salin (Copy) button right beside Lock and Flip */}
            {hasContent && (
              <button
                type="button"
                onClick={handleCopy}
                title="Salin Konten Tile"
                className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}

            {/* 4. Delete button (only if canDelete) */}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTile(row, col, e);
                }}
                title="Hapus Tile Ini"
                className="p-1 rounded bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
