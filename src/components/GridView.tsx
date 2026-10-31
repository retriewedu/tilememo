import React, { useRef, useState, useMemo } from 'react';
import { Board, TileData } from '../types/memo';
import { Tile } from './Tile';
import {
  ZoomIn,
  ZoomOut,
  Repeat,
  Search,
  X,
  Target,
} from 'lucide-react';

interface GridViewProps {
  board: Board;
  showToolbar?: boolean;
  onEditTile: (tile: TileData) => void;
  onQuickFlip: (row: number, col: number, e: React.MouseEvent) => void;
  onToggleLock: (row: number, col: number, e: React.MouseEvent) => void;
  onDeleteTile: (row: number, col: number, e: React.MouseEvent) => void;
  onAddAdjacent: (row: number, col: number, e: React.MouseEvent) => void;
  onSwapDrop: (srcRow: number, srcCol: number, targetRow: number, targetCol: number) => void;
  onFlipAll: () => void;
}

export const GridView: React.FC<GridViewProps> = ({
  board,
  showToolbar = false,
  onEditTile,
  onQuickFlip,
  onToggleLock,
  onDeleteTile,
  onAddAdjacent,
  onSwapDrop,
  onFlipAll,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const baseTileSize = 130;
  const currentTileSize = Math.round(baseTileSize * zoomLevel);

  // Compute bounding box for dynamic organic tiles
  const { minRow, maxRow, minCol, maxCol, totalCount } = useMemo(() => {
    const keys = Object.keys(board.tiles);
    if (keys.length === 0) {
      return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0, totalCount: 0 };
    }
    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;

    for (const key of keys) {
      const tile = board.tiles[key];
      if (tile.row < minR) minR = tile.row;
      if (tile.row > maxR) maxR = tile.row;
      if (tile.col < minC) minC = tile.col;
      if (tile.col > maxC) maxC = tile.col;
    }

    return {
      minRow: minR,
      maxRow: maxR,
      minCol: minC,
      maxCol: maxC,
      totalCount: keys.length,
    };
  }, [board.tiles]);

  // Search filter
  const matchingCoords = useMemo(() => {
    const set = new Set<string>();
    if (!searchQuery.trim()) return set;
    const q = searchQuery.toLowerCase().trim();
    for (const [key, t] of Object.entries(board.tiles)) {
      const matchFront =
        t.front.title?.toLowerCase().includes(q) ||
        t.front.text?.toLowerCase().includes(q) ||
        t.front.equation?.toLowerCase().includes(q);
      const matchBack =
        t.back.title?.toLowerCase().includes(q) ||
        t.back.text?.toLowerCase().includes(q) ||
        t.back.equation?.toLowerCase().includes(q);
      if (matchFront || matchBack) {
        set.add(key);
      }
    }
    return set;
  }, [board.tiles, searchQuery]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.6), 1.6));
  };

  const handleCenter = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight, scrollWidth, scrollHeight } = containerRef.current;
    containerRef.current.scrollTo({
      left: (scrollWidth - clientWidth) / 2,
      top: (scrollHeight - clientHeight) / 2,
      behavior: 'smooth',
    });
    setZoomLevel(1);
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-white">
      {/* Search, Flip All, and Zoom Toolbar (HIDDEN BY DEFAULT, toggleable via Settings) */}
      {showToolbar && (
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap z-10 animate-in slide-in-from-top-1 duration-150">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tile..."
                className="pl-8 pr-7 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 w-44 sm:w-56 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <span className="text-xs text-amber-700 font-mono">
                {matchingCoords.size} ditemukan
              </span>
            )}
          </div>

          {/* Controls: Balik Semua & Zoom */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFlipAll}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              title="Balik semua kartu"
            >
              <Repeat className="w-3.5 h-3.5 text-slate-500" />
              <span>Balik Semua</span>
            </button>

            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => handleZoom(-0.15)}
                className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-700 px-1.5 w-11 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.15)}
                className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCenter}
                className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                title="Pusatkan Layar"
              >
                <Target className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organic Grid Viewport Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-12 md:p-20 select-none flex items-center justify-center bg-white"
      >
        <div className="m-auto flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          {Array.from({ length: maxRow - minRow + 1 }).map((_, rIdx) => {
            const r = minRow + rIdx;
            return (
              <div key={r} className="flex items-center justify-center">
                {Array.from({ length: maxCol - minCol + 1 }).map((_, cIdx) => {
                  const c = minCol + cIdx;
                  const key = `${r}_${c}`;
                  const tile = board.tiles[key];

                  // If tile exists at this coordinate, render it!
                  if (tile) {
                    const hasTop = Boolean(board.tiles[`${r - 1}_${c}`]);
                    const hasBottom = Boolean(board.tiles[`${r + 1}_${c}`]);
                    const hasLeft = Boolean(board.tiles[`${r}_${c - 1}`]);
                    const hasRight = Boolean(board.tiles[`${r}_${c + 1}`]);
                    const isSearchMatch = matchingCoords.has(key);

                    return (
                      <Tile
                        key={key}
                        tile={tile}
                        row={r}
                        col={c}
                        tileSize={currentTileSize}
                        canDelete={totalCount > 1}
                        hasTopNeighbor={hasTop}
                        hasBottomNeighbor={hasBottom}
                        hasLeftNeighbor={hasLeft}
                        hasRightNeighbor={hasRight}
                        isHighlighted={isSearchMatch}
                        onEditTile={onEditTile}
                        onQuickFlip={onQuickFlip}
                        onToggleLock={onToggleLock}
                        onDeleteTile={onDeleteTile}
                        onAddAdjacent={onAddAdjacent}
                        onSwapDrop={onSwapDrop}
                      />
                    );
                  }

                  // If empty spatial slot within bounding box
                  return (
                    <div
                      key={key}
                      style={{
                        width: `${currentTileSize}px`,
                        height: `${currentTileSize}px`,
                      }}
                      className="m-3 pointer-events-none"
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
