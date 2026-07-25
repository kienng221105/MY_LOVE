export interface Song {
  id: string;
  title: string;
  artist: string;
  albumCover?: string;
  audioUrl: string;
  durationSeconds: number;
}
