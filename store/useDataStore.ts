import { create } from 'zustand';
import { Photo, Album } from '@/types/gallery';
import { MemoryMilestone } from '@/types/memory';
import { LoveLetter } from '@/types/letter';
import { DiaryEntry } from '@/types/diary';
import { GalleryService } from '@/services/gallery.service';
import { MemoriesService } from '@/services/memories.service';
import { LettersService } from '@/services/letters.service';
import { DiaryService } from '@/services/diary.service';

interface DataStore {
  photos: Photo[];
  albums: Album[];
  memories: MemoryMilestone[];
  letters: LoveLetter[];
  diaryEntries: DiaryEntry[];

  // Actions
  addPhoto: (photo: Omit<Photo, 'id'>) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  addMemory: (memory: Omit<MemoryMilestone, 'id'>) => Promise<void>;
  toggleFavoriteMemory: (id: string) => void;

  addLetter: (letter: Omit<LoveLetter, 'id'>) => Promise<void>;
  markLetterRead: (id: string) => Promise<void>;

  addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => Promise<void>;
  deleteDiaryEntry: (id: string) => Promise<void>;

  initData: () => Promise<void>;
  clearLocalCache: () => void;
}

const STORAGE_KEY = 'ourspace_app_data';

export const useDataStore = create<DataStore>((set, get) => ({
  photos: [],
  albums: [{ id: 'all', name: 'Tất cả kỷ niệm', coverUrl: '', photoCount: 0 }],
  memories: [],
  letters: [],
  diaryEntries: [],

  initData: async () => {
    // Fetch directly from Neon Database Cloud API (Single Source of Truth)
    try {
      const [apiPhotos, apiMemories, apiLetters, apiDiary] = await Promise.all([
        GalleryService.getPhotos(),
        MemoriesService.getMemories(),
        LettersService.getLetters(),
        DiaryService.getEntries(),
      ]);

      set({
        photos: apiPhotos,
        memories: apiMemories,
        letters: apiLetters,
        diaryEntries: apiDiary,
      });

      saveToStorage({
        photos: apiPhotos,
        memories: apiMemories,
        letters: apiLetters,
        diaryEntries: apiDiary,
      });
    } catch (e) {
      console.warn('Backend API offline, falling back to LocalStorage');
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            set({
              photos: parsed.photos || [],
              memories: parsed.memories || [],
              letters: parsed.letters || [],
              diaryEntries: parsed.diaryEntries || [],
            });
          } catch (err) {}
        }
      }
    }
  },

  clearLocalCache: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('ourspace_app_data');
      localStorage.removeItem('ourspace_auth');
      localStorage.removeItem('ourspace_token');
      localStorage.removeItem('ourspace_magic_phrase');
    }
    set({
      photos: [],
      memories: [],
      letters: [],
      diaryEntries: [],
    });
  },

  addPhoto: async (photoData) => {
    const apiResult = await GalleryService.addPhoto(photoData);
    if (apiResult) {
      const updated = [apiResult, ...get().photos];
      set({ photos: updated });
      saveToStorage(get());
    }
  },

  deletePhoto: async (id) => {
    const updated = get().photos.filter((p) => p.id !== id);
    set({ photos: updated });
    saveToStorage(get());
    await GalleryService.deletePhoto(id);
  },

  addMemory: async (memoryData) => {
    const apiResult = await MemoriesService.addMemory(memoryData);
    if (apiResult) {
      const updated = [apiResult, ...get().memories];
      set({ memories: updated });
      saveToStorage(get());
    }
  },

  toggleFavoriteMemory: (id) => {
    const updated = get().memories.map((m) =>
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    );
    set({ memories: updated });
    saveToStorage(get());
  },

  addLetter: async (letterData) => {
    const apiResult = await LettersService.createLetter(letterData);
    if (apiResult) {
      const updated = [apiResult, ...get().letters];
      set({ letters: updated });
      saveToStorage(get());
    }
  },

  markLetterRead: async (id) => {
    const updated = get().letters.map((l) =>
      l.id === id ? { ...l, isRead: true } : l
    );
    set({ letters: updated });
    saveToStorage(get());
    await LettersService.markAsRead(id);
  },

  addDiaryEntry: async (entryData) => {
    const apiResult = await DiaryService.createEntry(entryData);
    if (apiResult) {
      const updated = [apiResult, ...get().diaryEntries];
      set({ diaryEntries: updated });
      saveToStorage(get());
    }
  },

  deleteDiaryEntry: async (id) => {
    const updated = get().diaryEntries.filter((d) => d.id !== id);
    set({ diaryEntries: updated });
    saveToStorage(get());
    await DiaryService.deleteEntry(id);
  },
}));

function saveToStorage(state: {
  photos: Photo[];
  memories: MemoryMilestone[];
  letters: LoveLetter[];
  diaryEntries: DiaryEntry[];
}) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        photos: state.photos,
        memories: state.memories,
        letters: state.letters,
        diaryEntries: state.diaryEntries,
      })
    );
  }
}
