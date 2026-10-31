import React, { useRef } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetBoard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showToolbar: boolean;
  onToggleShowToolbar: () => void;
  onOpenHelp: () => void;
  totalTiles: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
  onResetBoard,
  soundEnabled,
  onToggleSound,
  showToolbar,
  onToggleShowToolbar,
  onOpenHelp,
  totalTiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-4 sm:p-6 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col mb-14 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">Pengaturan &amp; Data</span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">{totalTiles} Tile</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 flex flex-col gap-2 bg-white">
          {/* 1. Toggle Toolbar (Pencarian, Balik Semua, Zoom) */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Bilah Pencarian &amp; Zoom</div>
                <div className="text-[11px] text-slate-500">
                  {showToolbar ? 'Ditampilkan di atas' : 'Disembunyikan (Default)'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleShowToolbar}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                showToolbar
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {showToolbar ? 'TAMPIL' : 'SEMBUNYI'}
            </button>
          </div>

          {/* 2. Ekspor Data */}
          <button
            type="button"
            onClick={() => {
              onExport();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Ekspor Data (JSON)</div>
                <div className="text-[11px] text-slate-500">Unduh cadangan seluruh tile memo</div>
              </div>
            </div>
          </button>

          {/* 3. Impor Data */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Impor Data (JSON)</div>
                <div className="text-[11px] text-slate-500">Pulihkan berkas cadangan tilememo</div>
              </div>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              onImport(e);
              onClose();
            }}
            accept=".json"
            className="hidden"
          />

          {/* 4. Audio Sound Toggle */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Efek Suara Audio</div>
                <div className="text-[11px] text-slate-500">{soundEnabled ? 'Aktif (On)' : 'Bisu (Mute)'}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                soundEnabled
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 5. Panduan Penggunaan */}
          <button
            type="button"
            onClick={() => {
              onOpenHelp();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Panduan Fitur</div>
                <div className="text-[11px] text-slate-500">Petunjuk swap, voice, dan ekspansi tile</div>
              </div>
            </div>
          </button>

          {/* 6. Reset Papan */}
          <div className="pt-2 border-t border-slate-100 mt-1">
            <button
              type="button"
              onClick={() => {
                onResetBoard();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-rose-700">Mulai Ulang (Reset Papan)</div>
                  <div className="text-[11px] text-rose-500">Kembali ke 1 buah tile awal</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Data Lokal di Browser
          </span>
          <span>v3.1</span>
        </div>
      </div>
    </div>
  );
};
