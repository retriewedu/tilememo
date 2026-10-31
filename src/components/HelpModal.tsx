import React from 'react';
import { X, Layers, Repeat, Move, Sigma, ShieldCheck, Lock } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-slate-900 text-sm">Petunjuk Penggunaan TileMemo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto bg-white">
          {/* Item 1: Catatan Sederhana & Langsung Edit */}
          <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shrink-0 h-fit">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-0.5">Catatan Sederhana, Checklist, &amp; Numbering</div>
              <p className="text-slate-600 leading-relaxed">
                Klik tile mana pun untuk langsung menulis catatan layaknya memo biasa tanpa form kotak kaku. Lengkap dengan checklist interaktif, penomoran otomatis (numbering), rumus KaTeX, gambar coretan, voice memo, dan kustomisasi gaya di bilah bawah.
              </p>
            </div>
          </div>

          {/* Item 2: Tambah Tile Organik (+) */}
          <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shrink-0 h-fit">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-0.5">Ekspansi Tile Organik (+)</div>
              <p className="text-slate-600 leading-relaxed">
                Papan dimulai dari 1 tile awal. Gerakkan kursor ke atas, bawah, kiri, atau kanan tile lalu klik tanda plus (+) untuk memperluas peta memo sesuai kebutuhan Anda.
              </p>
            </div>
          </div>

          {/* Item 3: Drag & Drop Swap */}
          <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shrink-0 h-fit">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-0.5">Drag &amp; Drop untuk Tukar Posisi</div>
              <p className="text-slate-600 leading-relaxed">
                Tarik (drag) tile dan letakkan (drop) langsung di atas tile lain untuk menukar posisi keduanya dengan mudah tanpa tombol khusus.
              </p>
            </div>
          </div>

          {/* Item 4: Balik Sisi, Kunci, & Salin */}
          <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shrink-0 h-fit">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-0.5">Balik Sisi, Kunci, &amp; Salin Cepat</div>
              <p className="text-slate-600 leading-relaxed">
                Setiap tile memiliki 2 sisi (depan &amp; belakang) tanpa teks terbalik. Gunakan ikon gembok untuk mengunci tile agar tidak tergeser, dan ikon salin di sampingnya untuk menyalin konten secara cepat.
              </p>
            </div>
          </div>

          {/* Item 5: Tipe Konten & Privasi Lokal */}
          <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 shrink-0 h-fit">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-0.5">Lampiran Berkas, Tautan, Voice Memo, &amp; Privasi 100%</div>
              <p className="text-slate-600 leading-relaxed">
                Lampirkan berkas (PDF, dokumen, gambar, zip), tautan web (hyperlink), rekaman suara (voice memo), rumus matematika KaTeX, dan sketsa. Seluruh data disimpan lokal di peramban Anda dan dapat diekspor/diimpor via menu pengaturan di pojok kanan bawah.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
