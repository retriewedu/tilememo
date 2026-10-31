import React, { useState, useEffect } from 'react';
import { Board, TileData } from './types/memo';
import {
  loadBoards,
  saveBoards,
  getActiveBoardId,
  setActiveBoardId,
  createDefaultBoard,
  createInitialTile,
  exportBoardAsJson,
} from './utils/storage';
import { soundFx } from './utils/sound';
import { GridView } from './components/GridView';
import { TileEditor } from './components/TileEditor';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { Settings } from 'lucide-react';

export default function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardIdState, setActiveBoardIdState] = useState<string>('');
  const [editingTile, setEditingTile] = useState<TileData | null>(null);
  const [editingFace, setEditingFace] = useState<'front' | 'back'>('front');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showToolbar, setShowToolbar] = useState(false); // Default: hidden!

  // Initialize from LocalStorage
  useEffect(() => {
    const loaded = loadBoards();
    setBoards(loaded);
    const activeId = getActiveBoardId();
    if (activeId && loaded.some((b) => b.id === activeId)) {
      setActiveBoardIdState(activeId);
    } else if (loaded.length > 0) {
      setActiveBoardIdState(loaded[0].id);
      setActiveBoardId(loaded[0].id);
    }
  }, []);

  const activeBoard = boards.find((b) => b.id === activeBoardIdState) || boards[0];

  // Persist boards on changes
  const updateActiveBoard = (updater: (prev: Board) => Board) => {
    if (!activeBoard) return;
    const updated = updater(activeBoard);
    const newBoards = boards.map((b) => (b.id === updated.id ? updated : b));
    setBoards(newBoards);
    saveBoards(newBoards);
  };

  // Reset to single initial tile
  const handleResetBoard = () => {
    if (confirm('Mulai ulang papan dengan 1 tile awal? Semua tile lain akan dibersihkan.')) {
      const reset = createDefaultBoard('Peta Memo');
      const newBoards = [reset];
      setBoards(newBoards);
      saveBoards(newBoards);
      setActiveBoardIdState(reset.id);
      setActiveBoardId(reset.id);
      setEditingTile(null);
      soundFx.playSave();
    }
  };

  // Toggle Sound FX
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
    if (next) soundFx.playSelect();
  };

  // Add adjacent tile via (+) button on top, bottom, left, or right
  const handleAddAdjacent = (row: number, col: number) => {
    const key = `${row}_${col}`;
    updateActiveBoard((prev) => {
      if (prev.tiles[key]) return prev;
      const newTile = createInitialTile(row, col);
      return {
        ...prev,
        tiles: {
          ...prev.tiles,
          [key]: newTile,
        },
        updatedAt: Date.now(),
      };
    });
    soundFx.playSave();
  };

  // Delete a specific tile (as long as at least 1 tile remains)
  const handleDeleteTile = (row: number, col: number) => {
    const key = `${row}_${col}`;
    updateActiveBoard((prev) => {
      if (Object.keys(prev.tiles).length <= 1) return prev;
      const newTiles = { ...prev.tiles };
      delete newTiles[key];
      return {
        ...prev,
        tiles: newTiles,
        updatedAt: Date.now(),
      };
    });
    if (editingTile?.row === row && editingTile?.col === col) {
      setEditingTile(null);
    }
  };

  // Quick Tile Flip (Toggles front / back cleanly without S1/S2 label)
  const handleQuickFlip = (row: number, col: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${row}_${col}`;
    updateActiveBoard((prev) => {
      const existing = prev.tiles[key];
      if (!existing) return prev;
      return {
        ...prev,
        tiles: {
          ...prev.tiles,
          [key]: {
            ...existing,
            isFlipped: !existing.isFlipped,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  // Toggle Lock
  const handleToggleLock = (row: number, col: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const key = `${row}_${col}`;
    updateActiveBoard((prev) => {
      const existing = prev.tiles[key];
      if (!existing) return prev;
      return {
        ...prev,
        tiles: {
          ...prev.tiles,
          [key]: {
            ...existing,
            isLocked: !existing.isLocked,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  // Flip All Tiles
  const handleFlipAll = () => {
    soundFx.playFlip();
    updateActiveBoard((prev) => {
      const values = Object.values(prev.tiles);
      const flippedCount = values.filter((t) => t.isFlipped).length;
      const targetFlip = flippedCount <= values.length / 2;

      const newTiles: Record<string, TileData> = {};
      for (const [k, t] of Object.entries(prev.tiles)) {
        newTiles[k] = {
          ...t,
          isFlipped: targetFlip,
          updatedAt: Date.now(),
        };
      }
      return { ...prev, tiles: newTiles };
    });
  };

  // Drag-and-drop Swap between two existing tiles
  const handleSwapDrop = (r1: number, c1: number, r2: number, c2: number) => {
    const key1 = `${r1}_${c1}`;
    const key2 = `${r2}_${c2}`;

    updateActiveBoard((prev) => {
      const tile1 = prev.tiles[key1];
      const tile2 = prev.tiles[key2];

      if (!tile1 || !tile2) return prev;
      if (tile1.isLocked || tile2.isLocked) return prev;

      const swapped1: TileData = {
        ...tile2,
        id: `tile_${r1}_${c1}_${Date.now()}`,
        row: r1,
        col: c1,
        updatedAt: Date.now(),
      };

      const swapped2: TileData = {
        ...tile1,
        id: `tile_${r2}_${c2}_${Date.now()}`,
        row: r2,
        col: c2,
        updatedAt: Date.now(),
      };

      return {
        ...prev,
        tiles: {
          ...prev.tiles,
          [key1]: swapped1,
          [key2]: swapped2,
        },
      };
    });
  };

  // Save Tile from Editor
  const handleSaveTile = (updated: TileData) => {
    const key = `${updated.row}_${updated.col}`;
    updateActiveBoard((prev) => ({
      ...prev,
      tiles: {
        ...prev.tiles,
        [key]: updated,
      },
    }));
  };

  // Import JSON Backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.tiles) {
          const importedBoard: Board = {
            ...parsed,
            id: 'board_' + Date.now(),
            title: parsed.title ? `${parsed.title} (Impor)` : 'Papan Impor',
          };
          const newBoards = [importedBoard, ...boards];
          setBoards(newBoards);
          saveBoards(newBoards);
          setActiveBoardIdState(importedBoard.id);
          setActiveBoardId(importedBoard.id);
          soundFx.playSave();
        } else {
          alert('Format berkas JSON tidak sesuai untuk TileMemo.');
        }
      } catch (err) {
        alert('Gagal membaca berkas: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const totalTilesCount = activeBoard ? Object.keys(activeBoard.tiles).length : 0;

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-white text-slate-900 font-sans">
      {/* 1. TOP BAR: Ultra clean, calm, and distraction-free */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            TileMemo
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-medium">
            {totalTilesCount} Tile Aktif
          </span>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          💡 Klik tile untuk langsung mengedit konten · Klik (+) untuk menambah tile · Drag untuk swap posisi
        </div>
      </header>

      {/* 2. MAIN ORGANIC GRID VIEW */}
      {activeBoard && (
        <main className="flex-1 relative overflow-hidden bg-white">
          <GridView
            board={activeBoard}
            showToolbar={showToolbar}
            onEditTile={(tile) => {
              setEditingTile(tile);
              setEditingFace(tile.isFlipped ? 'back' : 'front');
            }}
            onQuickFlip={handleQuickFlip}
            onToggleLock={handleToggleLock}
            onDeleteTile={handleDeleteTile}
            onAddAdjacent={handleAddAdjacent}
            onSwapDrop={handleSwapDrop}
            onFlipAll={handleFlipAll}
          />
        </main>
      )}

      {/* 3. FLOATING SETTINGS GEAR BUTTON (Bottom-Right, as requested) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="w-11 h-11 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Pengaturan & Data (Ekspor, Impor, Reset, Toolbar)"
        >
          <Settings className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* 4. SETTINGS MODAL (Toolbar toggle, Ekspor, Impor, Reset, Suara) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExport={() => exportBoardAsJson(activeBoard)}
        onImport={handleImportJson}
        onResetBoard={handleResetBoard}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        showToolbar={showToolbar}
        onToggleShowToolbar={() => setShowToolbar(!showToolbar)}
        onOpenHelp={() => setIsHelpOpen(true)}
        totalTiles={totalTilesCount}
      />

      {/* 5. TILE EDITOR MODAL (Directly opened on tile click!) */}
      {editingTile && (
        <TileEditor
          tile={editingTile}
          initialFace={editingFace}
          onSave={handleSaveTile}
          onClose={() => setEditingTile(null)}
        />
      )}

      {/* 6. HELP MODAL */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
