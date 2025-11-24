export enum AppView {
  HOME = 'HOME',
  UPLOAD = 'UPLOAD',
  RECORD = 'RECORD',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  HISTORY = 'HISTORY'
}

export interface SongMetadata {
  title: string;
  artist: string;
  album?: string;
  year?: string;
  genre?: string;
  lyrics: string;
  mood?: string;
  language?: string;
}

export interface HistoryItem extends SongMetadata {
  id: string;
  timestamp: number;
}

export interface ProcessingState {
  isProcessing: boolean;
  message: string;
}

export interface AudioSource {
  type: 'file' | 'recording';
  data: string; // Base64 string
  mimeType: string;
  url?: string; // Blob URL for playback
  fileName?: string;
}