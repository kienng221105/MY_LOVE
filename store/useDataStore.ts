import { create } from 'zustand';
import { Photo, Album } from '@/types/gallery';
import { MemoryMilestone } from '@/types/memory';
import { LoveLetter } from '@/types/letter';
import { DiaryEntry } from '@/types/diary';

interface DataStore {
  photos: Photo[];
  albums: Album[];
  memories: MemoryMilestone[];
  letters: LoveLetter[];
  diaryEntries: DiaryEntry[];

  // Actions
  addPhoto: (photo: Omit<Photo, 'id'>) => void;
  deletePhoto: (id: string) => void;

  addMemory: (memory: Omit<MemoryMilestone, 'id'>) => void;
  toggleFavoriteMemory: (id: string) => void;

  addLetter: (letter: Omit<LoveLetter, 'id'>) => void;
  markLetterRead: (id: string) => void;

  addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => void;
  deleteDiaryEntry: (id: string) => void;

  initData: () => void;
}

const STORAGE_KEY = 'ourspace_app_data';

export const useDataStore = create<DataStore>((set, get) => ({
  photos: [],
  albums: [{ id: 'all', name: 'Tất cả kỷ niệm', coverUrl: '', photoCount: 0 }],
  memories: [],
  letters: [],
  diaryEntries: [],

  initData: () => {
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
        } catch (e) {}
      }
    }
  },

  addPhoto: (photoData) => {
    const newPhoto: Photo = {
      ...photoData,
      id: `photo_${Date.now()}`,
    };
    const updated = [newPhoto, ...get().photos];
    set({ photos: updated });
    saveToStorage(get());
  },

  deletePhoto: (id) => {
    const updated = get().photos.filter((p) => p.id !== id);
    set({ photos: updated });
    saveToStorage(get());
  },

  addMemory: (memoryData) => {
    const newMemory: MemoryMilestone = {
      ...memoryData,
      id: `memory_${Date.now()}`,
    };
    const updated = [newMemory, ...get().memories];
    set({ memories: updated });
    saveToStorage(get());
  },

  toggleFavoriteMemory: (id) => {
    const updated = get().memories.map((m) =>
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    );
    set({ memories: updated });
    saveToStorage(get());
  },

  addLetter: (letterData) => {
    const newLetter: LoveLetter = {
      ...letterData,
      id: `letter_${Date.now()}`,
    };
    const updated = [newLetter, ...get().letters];
    set({ letters: updated });
    saveToStorage(get());
  },

  markLetterRead: (id) => {
    const updated = get().letters.map((l) =>
      l.id === id ? { ...l, isRead: true } : l
    );
    set({ letters: updated });
    saveToStorage(get());
  },

  addDiaryEntry: (entryData) => {
    const newEntry: DiaryEntry = {
      ...entryData,
      id: `diary_${Date.now()}`,
    };
    const updated = [newEntry, ...get().diaryEntries];
    set({ diaryEntries: updated });
    saveToStorage(get());
  },

  deleteDiaryEntry: (id) => {
    const updated = get().diaryEntries.filter((d) => d.id !== id);
    set({ diaryEntries: updated });
    saveToStorage(get());
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
