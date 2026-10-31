export type ContentType = 'text' | 'equation' | 'image' | 'voice' | 'file';

export type FontChoice =
  | 'Plus Jakarta Sans'
  | 'Press Start 2P'
  | 'VT323'
  | 'JetBrains Mono'
  | 'Cinzel'
  | 'Patrick Hand';

export type BorderStyleChoice = 'solid' | 'dashed' | 'double' | 'pixel';

export interface TileFaceContent {
  type: ContentType;
  title?: string;
  text?: string;
  equation?: string;
  image?: string; // base64 data URL
  audio?: string; // base64 data URL
  audioDuration?: number; // duration in seconds
  linkUrl?: string; // URL web (e.g. https://...)
  linkTitle?: string; // Label tautan
  fileName?: string; // Nama file (misal 'dokumen.pdf', 'data.xlsx')
  fileSize?: number; // Ukuran file dalam bytes
  fileType?: string; // MIME type (misal 'application/pdf')
  fileData?: string; // base64 data URL
}

export interface TileStyle {
  backgroundColor: string;
  borderColor: string;
  borderStyle: BorderStyleChoice;
  borderWidth: number; // in pixels (1 to 6)
  textColor: string;
  fontFamily: FontChoice;
  fontSize: 'xs' | 'sm' | 'base' | 'lg';
  textAlign: 'left' | 'center' | 'right';
  borderRadius: number;
}

export interface TileData {
  id: string;
  row: number; // integer (can be negative or positive)
  col: number; // integer (can be negative or positive)
  front: TileFaceContent;
  back: TileFaceContent;
  frontStyle: TileStyle;
  backStyle: TileStyle;
  isFlipped: boolean; // false = Sisi 1 (Depan), true = Sisi 2 (Belakang)
  isLocked?: boolean; // When locked, cannot be dragged/swapped or edited
  updatedAt: number;
}

export interface Board {
  id: string;
  title: string;
  tiles: Record<string, TileData>; // key: `${row}_${col}`
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_STYLE_FRONT: TileStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderStyle: 'solid',
  borderWidth: 1,
  textColor: '#0f172a',
  fontFamily: 'Plus Jakarta Sans',
  fontSize: 'sm',
  textAlign: 'center',
  borderRadius: 8,
};

export const DEFAULT_STYLE_BACK: TileStyle = {
  backgroundColor: '#f8fafc',
  borderColor: '#cbd5e1',
  borderStyle: 'dashed',
  borderWidth: 1,
  textColor: '#334155',
  fontFamily: 'Plus Jakarta Sans',
  fontSize: 'sm',
  textAlign: 'center',
  borderRadius: 8,
};
