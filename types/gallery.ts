export interface Photo {
  id: string;
  url: string;
  title: string;
  date: string;
  location?: string;
  albumId?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface Album {
  id: string;
  name: string;
  coverUrl: string;
  photoCount: number;
}
