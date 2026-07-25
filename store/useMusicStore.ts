import { create } from 'zustand';
import { Song } from '@/types/music';

interface MusicStore {
  isPlaying: boolean;
  currentSong: Song | null;
  playlist: Song[];
  volume: number; // 0 to 1
  togglePlay: () => void;
  playSong: (song: Song) => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (vol: number) => void;
}

const defaultSongs: Song[] = [
  {
    id: 'song_1',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    albumCover: '/trang_chu.png',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    durationSeconds: 180,
  },
  {
    id: 'song_2',
    title: 'Nothings Gonna Change My Love For You',
    artist: 'George Benson',
    albumCover: '/hanh_trinh.png',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    durationSeconds: 210,
  },
];

export const useMusicStore = create<MusicStore>((set, get) => ({
  isPlaying: false,
  currentSong: defaultSongs[0],
  playlist: defaultSongs,
  volume: 0.8,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  playSong: (song: Song) => set({ currentSong: song, isPlaying: true }),
  nextSong: () => {
    const { playlist, currentSong } = get();
    if (!currentSong || playlist.length === 0) return;
    const index = playlist.findIndex((s) => s.id === currentSong.id);
    if (index === -1) return;
    const nextIndex = (index + 1) % playlist.length;
    set({ currentSong: playlist[nextIndex], isPlaying: true });
  },
  prevSong: () => {
    const { playlist, currentSong } = get();
    if (!currentSong || playlist.length === 0) return;
    const index = playlist.findIndex((s) => s.id === currentSong.id);
    if (index === -1) return;
    const prevIndex = (index - 1 + playlist.length) % playlist.length;
    set({ currentSong: playlist[prevIndex], isPlaying: true });
  },
  setVolume: (volume: number) => set({ volume }),
}));
