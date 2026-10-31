import React, { useState } from 'react';
import {
  TileData,
  TileFaceContent,
  TileStyle,
  FontChoice,
  BorderStyleChoice,
} from '../types/memo';
import { EquationRenderer, EQUATION_TEMPLATES, MATH_SYMBOLS } from './EquationRenderer';
import { DoodleCanvas } from './DoodleCanvas';
import { VoiceRecorder } from './VoiceRecorder';
import { soundFx } from '../utils/sound';
import {
  X,
  Sigma,
  Image as ImageIcon,
  Mic,
  Palette,
  Type,
  Lock,
  Unlock,
  Repeat,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  ListTodo,
  ListOrdered,
  CheckSquare,
  Square,
  Link as LinkIcon,
  ExternalLink,
  Globe,
} from 'lucide-react';

interface TileEditorProps {
  tile: TileData;
  initialFace?: 'front' | 'back';
  onSave: (updatedTile: TileData) => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Putih Bersih', hex: '#ffffff' },
  { name: 'Krem Hangat', hex: '#fefce8' },
  { name: 'Biru Lembut', hex: '#eff6ff' },
  { name: 'Hijau Mint', hex: '#f0fdf4' },
  { name: 'Merah Muda', hex: '#fff1f2' },
  { name: 'Ungu Lavender', hex: '#faf5ff' },
  { name: 'Abu Slate', hex: '#f8fafc' },
  { name: 'Kuning Amber', hex: '#fffbeb' },
  { name: 'Cyan Es', hex: '#ecfeff' },
  { name: 'Gelap Elegan', hex: '#0f172a' },
];

const BORDER_COLOR_PRESETS = [
  '#e2e8f0', // slate light
  '#cbd5e1', // slate medium
  '#94a3b8', // slate dark
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // purple
];

const FONTS: { value: FontChoice; label: string; preview: string }[] = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', preview: 'Modern' },
  { value: 'Press Start 2P', label: 'Press Start 2P', preview: '8-Bit Retro' },
  { value: 'VT323', label: 'VT323', preview: 'Arcade CRT' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', preview: 'Kode / Formula' },
  { value: 'Cinzel', label: 'Cinzel', preview: 'Serif Klasik' },
  { value: 'Patrick Hand', label: 'Patrick Hand', preview: 'Tulisan Tangan' },
];

export const TileEditor: React.FC<TileEditorProps> = ({
  tile,
  initialFace = 'front',
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'front' | 'back'>(initialFace);
  const [isLocked, setIsLocked] = useState<boolean>(tile.isLocked ?? false);

  const [frontFace, setFrontFace] = useState<TileFaceContent>({ ...tile.front });
  const [backFace, setBackFace] = useState<TileFaceContent>({ ...tile.back });
  const [frontStyle, setFrontStyle] = useState<TileStyle>({ ...tile.frontStyle });
  const [backStyle, setBackStyle] = useState<TileStyle>({ ...tile.backStyle });

  // Toggles for bottom options: formula, image, voice, link, styling
  const [showEquation, setShowEquation] = useState<boolean>(Boolean(tile.front.equation || tile.back.equation));
  const [showImage, setShowImage] = useState<boolean>(Boolean(tile.front.image || tile.back.image));
  const [showVoice, setShowVoice] = useState<boolean>(Boolean(tile.front.audio || tile.back.audio));
  const [showLink, setShowLink] = useState<boolean>(Boolean(tile.front.linkUrl || tile.back.linkUrl));
  const [showStylePanel, setShowStylePanel] = useState<boolean>(false);
  const [linkInputUrl, setLinkInputUrl] = useState<string>('');
  const [linkInputTitle, setLinkInputTitle] = useState<string>('');
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Sync link inputs when activeTab changes
  React.useEffect(() => {
    const face = activeTab === 'front' ? frontFace : backFace;
    if (face.linkUrl) {
      setLinkInputUrl(face.linkUrl);
      setLinkInputTitle(face.linkTitle || '');
    } else {
      setLinkInputUrl('');
      setLinkInputTitle('');
    }
  }, [activeTab]);

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleAttachTileLink = () => {
    if (!linkInputUrl.trim()) return;
    const cleanUrl = normalizeUrl(linkInputUrl);
    setFace((prev) => ({
      ...prev,
      linkUrl: cleanUrl,
      linkTitle: linkInputTitle.trim() || undefined,
    }));
    soundFx.playSave();
  };

  const handleInsertLinkToText = () => {
    if (!linkInputUrl.trim()) return;
    const cleanUrl = normalizeUrl(linkInputUrl);
    const label = linkInputTitle.trim() || cleanUrl.replace(/^https?:\/\//, '');
    const markdownLink = `[${label}](${cleanUrl})`;

    soundFx.playSelect();
    const textarea = textareaRef.current;
    const currentText = currentFace.text || '';

    if (!textarea) {
      const nextText = currentText ? `${currentText} ${markdownLink}` : markdownLink;
      setFace((prev) => ({ ...prev, text: nextText }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentText.slice(0, start);
    const after = currentText.slice(end);
    const nextText = before + markdownLink + after;
    setFace((prev) => ({ ...prev, text: nextText }));
    setTimeout(() => {
      textarea.focus();
      const newPos = start + markdownLink.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const currentFace = activeTab === 'front' ? frontFace : backFace;
  const setFace = (updater: (prev: TileFaceContent) => TileFaceContent) => {
    if (activeTab === 'front') {
      setFrontFace(updater);
    } else {
      setBackFace(updater);
    }
  };

  const currentStyle = activeTab === 'front' ? frontStyle : backStyle;
  const setStyle = (updater: (prev: TileStyle) => TileStyle) => {
    if (activeTab === 'front') {
      setFrontStyle(updater);
    } else {
      setBackStyle(updater);
    }
  };

  // Checklist insertion helper
  const handleInsertChecklist = () => {
    soundFx.playSelect();
    const textarea = textareaRef.current;
    const currentText = currentFace.text || '';

    if (!textarea) {
      const nextText = currentText ? `${currentText}\n[ ] ` : '[ ] ';
      setFace((prev) => ({ ...prev, text: nextText }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      const beforeCursor = currentText.slice(0, start);
      const lastNewline = beforeCursor.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const currentLine = currentText.slice(lineStart, start);

      if (currentLine.trim() === '') {
        const nextText = currentText.slice(0, lineStart) + '[ ] ' + currentText.slice(lineStart);
        setFace((prev) => ({ ...prev, text: nextText }));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(lineStart + 4, lineStart + 4);
        }, 0);
      } else {
        const afterCursor = currentText.slice(start);
        const insert = currentText.length > 0 && !currentText.endsWith('\n') && start === currentText.length ? '\n[ ] ' : '[ ] ';
        const nextText = beforeCursor + insert + afterCursor;
        setFace((prev) => ({ ...prev, text: nextText }));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + insert.length, start + insert.length);
        }, 0);
      }
    } else {
      const before = currentText.slice(0, start);
      const selected = currentText.slice(start, end);
      const after = currentText.slice(end);
      const lines = selected.split('\n');
      const toggled = lines
        .map((l) => {
          if (l.startsWith('[ ] ')) return l.slice(4);
          if (l.startsWith('[x] ') || l.startsWith('[X] ')) return l.slice(4);
          return '[ ] ' + l;
        })
        .join('\n');
      const nextText = before + toggled + after;
      setFace((prev) => ({ ...prev, text: nextText }));
    }
  };

  // Numbering insertion helper
  const handleInsertNumbering = () => {
    soundFx.playSelect();
    const textarea = textareaRef.current;
    const currentText = currentFace.text || '';

    if (!textarea) {
      const nextText = currentText ? `${currentText}\n1. ` : '1. ';
      setFace((prev) => ({ ...prev, text: nextText }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      const beforeCursor = currentText.slice(0, start);
      const linesBefore = beforeCursor.split('\n');
      let nextNum = 1;
      for (let i = linesBefore.length - 1; i >= 0; i--) {
        const match = linesBefore[i].match(/^(\d+)\.\s/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
          break;
        }
      }

      const lastNewline = beforeCursor.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const currentLine = currentText.slice(lineStart, start);

      if (currentLine.trim() === '') {
        const prefix = `${nextNum}. `;
        const nextText = currentText.slice(0, lineStart) + prefix + currentText.slice(lineStart);
        setFace((prev) => ({ ...prev, text: nextText }));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
        }, 0);
      } else {
        const afterCursor = currentText.slice(start);
        const prefix = (start > 0 && !beforeCursor.endsWith('\n') ? '\n' : '') + `${nextNum}. `;
        const nextText = beforeCursor + prefix + afterCursor;
        setFace((prev) => ({ ...prev, text: nextText }));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }, 0);
      }
    } else {
      const before = currentText.slice(0, start);
      const selected = currentText.slice(start, end);
      const after = currentText.slice(end);
      const lines = selected.split('\n');
      const numbered = lines
        .map((l, idx) => {
          const cleaned = l.replace(/^(\d+)\.\s/, '');
          return `${idx + 1}. ${cleaned}`;
        })
        .join('\n');
      const nextText = before + numbered + after;
      setFace((prev) => ({ ...prev, text: nextText }));
    }
  };

  // Smart keyboard Enter continuation for checklist and numbering
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const currentText = currentFace.text || '';
      const start = textarea.selectionStart;
      const beforeCursor = currentText.slice(0, start);
      const lastNewline = beforeCursor.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const currentLine = currentText.slice(lineStart, start);

      // Checklist continuation
      const checkMatch = currentLine.match(/^(\[[ xX]\])\s(.*)$/);
      if (checkMatch) {
        e.preventDefault();
        const content = checkMatch[2];
        if (!content.trim()) {
          const nextText = currentText.slice(0, lineStart) + currentText.slice(start);
          setFace((prev) => ({ ...prev, text: nextText }));
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          const insert = '\n[ ] ';
          const nextText = beforeCursor + insert + currentText.slice(start);
          setFace((prev) => ({ ...prev, text: nextText }));
          setTimeout(() => {
            textarea.setSelectionRange(start + insert.length, start + insert.length);
          }, 0);
        }
        return;
      }

      // Numbering continuation
      const numMatch = currentLine.match(/^(\d+)\.\s(.*)$/);
      if (numMatch) {
        e.preventDefault();
        const num = parseInt(numMatch[1], 10);
        const content = numMatch[2];
        if (!content.trim()) {
          const nextText = currentText.slice(0, lineStart) + currentText.slice(start);
          setFace((prev) => ({ ...prev, text: nextText }));
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          const insert = `\n${num + 1}. `;
          const nextText = beforeCursor + insert + currentText.slice(start);
          setFace((prev) => ({ ...prev, text: nextText }));
          setTimeout(() => {
            textarea.setSelectionRange(start + insert.length, start + insert.length);
          }, 0);
        }
        return;
      }
    }
  };

  // Checklist interactive toggle helpers
  const hasChecklistItems = Boolean(
    currentFace.text && /\[[ xX]\]\s/.test(currentFace.text)
  );

  const getChecklistItems = (text: string) => {
    const lines = text.split('\n');
    const items: { rawIndex: number; isDone: boolean; content: string }[] = [];
    lines.forEach((line, idx) => {
      const match = line.match(/^(\[[ xX]\])\s(.*)$/);
      if (match) {
        items.push({
          rawIndex: idx,
          isDone: match[1].toLowerCase() === '[x]',
          content: match[2],
        });
      }
    });
    return items;
  };

  const toggleChecklistItem = (lineIndex: number) => {
    soundFx.playSelect();
    const lines = (currentFace.text || '').split('\n');
    if (lines[lineIndex] !== undefined) {
      const line = lines[lineIndex];
      if (line.startsWith('[ ] ')) {
        lines[lineIndex] = '[x] ' + line.slice(4);
      } else if (line.startsWith('[x] ') || line.startsWith('[X] ')) {
        lines[lineIndex] = '[ ] ' + line.slice(4);
      }
      setFace((prev) => ({ ...prev, text: lines.join('\n') }));
    }
  };

  const handleSaveAndClose = () => {
    soundFx.playSave();
    // Derive primary content type cleanly
    const deriveType = (face: TileFaceContent) => {
      if (face.audio) return 'voice';
      if (face.image) return 'image';
      if (face.equation) return 'equation';
      return 'text';
    };

    const updatedTile: TileData = {
      ...tile,
      front: { ...frontFace, type: deriveType(frontFace) },
      back: { ...backFace, type: deriveType(backFace) },
      frontStyle,
      backStyle,
      isLocked,
      updatedAt: Date.now(),
    };
    onSave(updatedTile);
    onClose();
  };

  const insertLatex = (latex: string) => {
    setFace((prev) => ({
      ...prev,
      equation: (prev.equation ? prev.equation + ' ' : '') + latex,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/35 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleSaveAndClose}
    >
      <div
        style={{
          fontFamily: currentStyle.fontFamily || 'Plus Jakarta Sans',
        }}
        className="flex flex-col w-full max-w-xl max-h-[90vh] bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. QUIET HEADER: Balik Sisi, Kunci, dan Tombol Selesai */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            {/* Flip Side Toggle */}
            <button
              type="button"
              onClick={() => {
                soundFx.playFlip();
                setActiveTab(activeTab === 'front' ? 'back' : 'front');
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Balik Sisi Tile"
            >
              <Repeat className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeTab === 'front' ? 'Sisi Depan' : 'Sisi Belakang'}</span>
            </button>

            {/* Lock Toggle */}
            <button
              type="button"
              onClick={() => {
                soundFx.playSelect();
                setIsLocked(!isLocked);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isLocked
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="Kunci Tile"
            >
              {isLocked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3" />}
              <span>{isLocked ? 'Terkunci' : 'Kunci'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="flex items-center gap-1 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </button>
        </div>

        {/* 2. NOTE PAPER BODY (Natural note sheet: borderless title & text without form boxes) */}
        <div
          style={{
            backgroundColor: currentStyle.backgroundColor || '#ffffff',
            color: currentStyle.textColor || '#0f172a',
          }}
          className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3 transition-colors"
        >
          {/* Judul Catatan (Frameless, clean, like a real note) */}
          <input
            type="text"
            value={currentFace.title || ''}
            onChange={(e) => setFace((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Judul Catatan..."
            style={{ color: currentStyle.textColor || '#0f172a' }}
            className="w-full text-xl sm:text-2xl font-bold placeholder:text-slate-300 border-none outline-none focus:outline-none focus:ring-0 bg-transparent px-0 py-0.5 leading-snug"
          />

          {/* Isi Catatan (Frameless textarea, flows naturally) */}
          <textarea
            ref={textareaRef}
            value={currentFace.text || ''}
            onChange={(e) => setFace((prev) => ({ ...prev, text: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Tulis catatan di sini... (Gunakan tombol Checklist atau Numbering di bawah)"
            rows={showEquation || showImage || showVoice ? 3 : 7}
            style={{
              color: currentStyle.textColor || '#334155',
              textAlign: currentStyle.textAlign || 'left',
              fontSize: currentStyle.fontSize === 'xs' ? '12px' : currentStyle.fontSize === 'sm' ? '14px' : currentStyle.fontSize === 'lg' ? '18px' : '15px',
            }}
            className="w-full placeholder:text-slate-300 border-none outline-none focus:outline-none focus:ring-0 bg-transparent px-0 py-1 leading-relaxed resize-none"
          />

          {/* CHECKLIST INTERAKTIF (Bila ada item checklist di teks catatan) */}
          {hasChecklistItems && (
            <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col gap-1.5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Checklist Interaktif (Klik kotak untuk centang/batal)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {getChecklistItems(currentFace.text || '').filter((i) => i.isDone).length}/
                  {getChecklistItems(currentFace.text || '').length} Selesai
                </span>
              </div>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                {getChecklistItems(currentFace.text || '').map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleChecklistItem(item.rawIndex)}
                    className="flex items-start gap-2 text-left p-1.5 rounded-lg hover:bg-white text-xs transition-colors group cursor-pointer"
                  >
                    {item.isDone ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-slate-700 break-words leading-tight ${
                        item.isDone ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {item.content || <em className="text-slate-300 italic">Item kosong</em>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INLINE EXPANDED BLOCK 1: RUMUS / EQUATION */}
          {(showEquation || currentFace.equation) && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Sigma className="w-4 h-4 text-slate-600" /> Rumus Matematika (LaTeX)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFace((prev) => ({ ...prev, equation: undefined }));
                    setShowEquation(false);
                  }}
                  className="text-slate-400 hover:text-rose-600 p-0.5"
                  title="Hapus Rumus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* KaTeX Live Render Preview */}
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center min-h-[50px]">
                <EquationRenderer equation={currentFace.equation || 'x = \\dots'} displayMode={true} />
              </div>

              {/* LaTeX Input */}
              <input
                type="text"
                value={currentFace.equation || ''}
                onChange={(e) => setFace((prev) => ({ ...prev, equation: e.target.value }))}
                placeholder="Contoh: E = m c^2 atau \\int_a^b f(x) dx"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />

              {/* Quick Math Symbols */}
              <div className="flex flex-wrap gap-1">
                {MATH_SYMBOLS.slice(0, 10).map((sym, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertLatex(sym.latex)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200 shadow-2xs"
                  >
                    {sym.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INLINE EXPANDED BLOCK 2: GAMBAR / DOODLE */}
          {(showImage || currentFace.image) && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-600" /> Sketsa / Gambar
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFace((prev) => ({ ...prev, image: undefined }));
                    setShowImage(false);
                  }}
                  className="text-slate-400 hover:text-rose-600 p-0.5"
                  title="Hapus Gambar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <DoodleCanvas
                initialImage={currentFace.image}
                onSave={(dataUrl) => setFace((prev) => ({ ...prev, image: dataUrl }))}
                width={280}
                height={180}
              />
            </div>
          )}

          {/* INLINE EXPANDED BLOCK 3: VOICE MEMO */}
          {(showVoice || currentFace.audio) && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-slate-600" /> Voice Memo
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFace((prev) => ({ ...prev, audio: undefined, audioDuration: undefined }));
                    setShowVoice(false);
                  }}
                  className="text-slate-400 hover:text-rose-600 p-0.5"
                  title="Hapus Voice Memo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <VoiceRecorder
                audioUrl={currentFace.audio}
                audioDuration={currentFace.audioDuration}
                onSaveAudio={(dataUrl, duration) => {
                  setFace((prev) => ({ ...prev, audio: dataUrl, audioDuration: duration }));
                }}
                onDeleteAudio={() => {
                  setFace((prev) => ({ ...prev, audio: undefined, audioDuration: undefined }));
                  setShowVoice(false);
                }}
              />
            </div>
          )}

          {/* INLINE EXPANDED BLOCK 4: HYPERLINK / TAUTAN */}
          {(showLink || currentFace.linkUrl) && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-sky-600" /> Hyperlink / Tautan Web
                </span>
                <div className="flex items-center gap-1">
                  {currentFace.linkUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFace((prev) => ({ ...prev, linkUrl: undefined, linkTitle: undefined }));
                      }}
                      className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      title="Hapus Tautan Tile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowLink(false)}
                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    title="Tutup Panel Tautan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tautan Tile yang Tersimpan */}
              {currentFace.linkUrl && (
                <div className="flex items-center justify-between p-2.5 bg-white border border-sky-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 block truncate">
                        {currentFace.linkTitle || currentFace.linkUrl}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block truncate">
                        {currentFace.linkUrl}
                      </span>
                    </div>
                  </div>
                  <a
                    href={currentFace.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded-md text-xs shrink-0 transition-colors"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Input Form URL & Label */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={linkInputUrl}
                    onChange={(e) => setLinkInputUrl(e.target.value)}
                    placeholder="URL Web (contoh: https://google.com atau github.com)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="w-full sm:w-44">
                  <input
                    type="text"
                    value={linkInputTitle}
                    onChange={(e) => setLinkInputTitle(e.target.value)}
                    placeholder="Label Tautan (opsional)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAttachTileLink}
                  disabled={!linkInputUrl.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:hover:bg-sky-600 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Simpan sebagai tombol tautan utama tile"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Jadikan Tautan Tile</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertLinkToText}
                  disabled={!linkInputUrl.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sisipkan format [Label](URL) ke dalam teks catatan pada kursor"
                >
                  <span>Sisipkan ke Catatan [Label](URL)</span>
                </button>
              </div>
            </div>
          )}

          {/* INLINE EXPANDED BLOCK 4: KUSTOMISASI TEKS & WARNA */}
          {showStylePanel && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-slate-600" /> Kustomisasi Tampilan &amp; Font
                </span>
                <button
                  type="button"
                  onClick={() => setShowStylePanel(false)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Warna Background */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Warna Background</span>
                  <span className="font-mono text-[10px] text-slate-400">{currentStyle.backgroundColor}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setStyle((prev) => ({ ...prev, backgroundColor: p.hex }))}
                      style={{ backgroundColor: p.hex }}
                      className={`w-6 h-6 rounded-md border transition-transform ${
                        currentStyle.backgroundColor === p.hex
                          ? 'scale-120 border-slate-900 shadow-xs ring-1 ring-slate-900'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                      title={p.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={currentStyle.backgroundColor}
                    onChange={(e) => setStyle((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-300 bg-transparent"
                    title="Warna Khusus"
                  />
                </div>
              </div>

              {/* Warna Border & Ketebalan */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Warna Border &amp; Tebal</span>
                  <span className="font-mono text-[10px] text-slate-400">{currentStyle.borderWidth}px</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {BORDER_COLOR_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setStyle((prev) => ({ ...prev, borderColor: hex }))}
                        style={{ backgroundColor: hex }}
                        className={`w-5 h-5 rounded-md border transition-transform ${
                          currentStyle.borderColor === hex
                            ? 'scale-120 border-slate-900 shadow-xs ring-1 ring-slate-900'
                            : 'border-slate-300'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {[1, 2, 3, 4].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setStyle((prev) => ({ ...prev, borderWidth: w }))}
                        className={`px-1.5 py-0.5 text-xs font-mono rounded ${
                          currentStyle.borderWidth === w
                            ? 'bg-slate-900 text-white font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {w}px
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pilihan Font */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-slate-500" /> Jenis Font
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {FONTS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setStyle((prev) => ({ ...prev, fontFamily: f.value }))}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        currentStyle.fontFamily === f.value
                          ? 'bg-white border-slate-900 ring-1 ring-slate-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div style={{ fontFamily: f.value }} className="text-xs font-semibold text-slate-800 truncate">
                        {f.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{f.preview}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warna Teks & Perataan */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span>Warna Teks:</span>
                  <input
                    type="color"
                    value={currentStyle.textColor}
                    onChange={(e) => setStyle((prev) => ({ ...prev, textColor: e.target.value }))}
                    className="w-5 h-5 rounded cursor-pointer border border-slate-300 bg-transparent"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setStyle((prev) => ({ ...prev, textAlign: align }))}
                      className={`px-2 py-0.5 rounded text-[11px] capitalize ${
                        currentStyle.textAlign === align
                          ? 'bg-slate-200 text-slate-900 font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. BOTTOM TOOLBAR: Pilihan Tambah Konten Khusus & Kustomisasi */}
        <div className="px-5 py-2.5 bg-slate-50/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Checklist */}
            <button
              type="button"
              onClick={handleInsertChecklist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs transition-colors cursor-pointer"
              title="Tambah baris Checklist [ ]"
            >
              <ListTodo className="w-3.5 h-3.5 text-slate-600" />
              <span>Checklist</span>
            </button>

            {/* Numbering */}
            <button
              type="button"
              onClick={handleInsertNumbering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs transition-colors cursor-pointer"
              title="Tambah penomoran 1., 2., dst."
            >
              <ListOrdered className="w-3.5 h-3.5 text-slate-600" />
              <span>Numbering</span>
            </button>

            {/* + Rumus */}
            <button
              type="button"
              onClick={() => {
                setShowEquation(!showEquation);
                soundFx.playSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showEquation || currentFace.equation
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>Rumus</span>
            </button>

            {/* + Gambar */}
            <button
              type="button"
              onClick={() => {
                setShowImage(!showImage);
                soundFx.playSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showImage || currentFace.image
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gambar</span>
            </button>

            {/* + Voice */}
            <button
              type="button"
              onClick={() => {
                setShowVoice(!showVoice);
                soundFx.playSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showVoice || currentFace.audio
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>

            {/* + Tautan (Hyperlink) */}
            <button
              type="button"
              onClick={() => {
                setShowLink(!showLink);
                soundFx.playSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showLink || currentFace.linkUrl
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Tambah hyperlink atau tautan web"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Tautan</span>
            </button>

            {/* Gaya & Warna */}
            <button
              type="button"
              onClick={() => {
                setShowStylePanel(!showStylePanel);
                soundFx.playSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showStylePanel
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Gaya &amp; Warna</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
