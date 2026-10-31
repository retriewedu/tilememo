import { Board, TileData, DEFAULT_STYLE_FRONT, DEFAULT_STYLE_BACK } from '../types/memo';

const STORAGE_KEY = 'tilememo_boards_organic_v3';
const ACTIVE_BOARD_KEY = 'tilememo_active_board_id_v3';

export function createInitialTile(row: number, col: number, title: string = '', text: string = ''): TileData {
  return {
    id: `tile_${row}_${col}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    row,
    col,
    front: {
      type: 'text',
      title,
      text,
    },
    back: {
      type: 'text',
      title: '',
      text: '',
    },
    frontStyle: { ...DEFAULT_STYLE_FRONT },
    backStyle: { ...DEFAULT_STYLE_BACK },
    isFlipped: false,
    isLocked: false,
    updatedAt: Date.now(),
  };
}

export function createDefaultBoard(title: string = 'Peta Memo'): Board {
  const tiles: Record<string, TileData> = {};

  // ONLY ONE INITIAL TILE at (0, 0)
  tiles['0_0'] = createInitialTile(
    0,
    0,
    'Mulai Catatan Anda',
    'Klik tile untuk langsung mengisi/mengedit konten. Klik tanda (+) di atas/bawah/kiri/kanan untuk menambah tile baru.'
  );

  return {
    id: 'board_' + Date.now(),
    title,
    tiles,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadBoards(): Board[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultBoard('Papan Memo');
      saveBoards([initial]);
      setActiveBoardId(initial.id);
      return [initial];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = createDefaultBoard('Papan Memo');
      saveBoards([initial]);
      setActiveBoardId(initial.id);
      return [initial];
    }
    return parsed;
  } catch {
    const initial = createDefaultBoard('Papan Memo');
    return [initial];
  }
}

export function saveBoards(boards: Board[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
  } catch (err) {
    console.error('Failed to save boards to localStorage:', err);
  }
}

export function getActiveBoardId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_BOARD_KEY);
  } catch {
    return null;
  }
}

export function setActiveBoardId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_BOARD_KEY, id);
  } catch {
    // Ignore
  }
}

export function exportBoardAsJson(board: Board): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(board, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `tilememo_${board.title.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
