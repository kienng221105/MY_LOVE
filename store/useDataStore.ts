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
}

const STORAGE_KEY = 'ourspace_app_data';

export const useDataStore = create<DataStore>((set, get) => ({
  photos: [],
  albums: [{ id: 'all', name: 'Tất cả kỷ niệm', coverUrl: '', photoCount: 0 }],
  memories: [],
  letters: [],
  diaryEntries: [],

  initData: async () => {
    // 1. Fast initial load from LocalStorage cache
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

    // 2. Sync and Auto-migrate local data to Neon Database Cloud API
    try {
      const [apiPhotos, apiMemories, apiLetters, apiDiary] = await Promise.all([
        GalleryService.getPhotos(),
        MemoriesService.getMemories(),
        LettersService.getLetters(),
        DiaryService.getEntries(),
      ]);

      const currentLocal = get();

      // Auto-migrate photos if Cloud DB is empty
      if (apiPhotos.length === 0 && currentLocal.photos.length > 0) {
        for (const p of currentLocal.photos) {
          if (p.url && !p.url.startsWith('blob:')) {
            await GalleryService.addPhoto({
              url: p.url,
              title: p.title || 'Kỷ niệm',
              date: p.date || new Date().toISOString().split('T')[0],
              caption: p.caption || '',
            });
          }
        }
      }

      // Auto-migrate letters if Cloud DB is empty
      if (apiLetters.length === 0 && currentLocal.letters.length > 0) {
        for (const l of currentLocal.letters) {
          await LettersService.createLetter({
            sender: l.sender || 'Kiên',
            recipient: l.recipient || 'Trà',
            title: l.title || '',
            content: l.content || '',
            sentDate: l.sentDate || new Date().toISOString().split('T')[0],
            isRead: l.isRead ?? false,
            bgStyle: l.bgStyle || 'pink',
          });
        }
      }

      // Auto-migrate diary entries if Cloud DB is empty
      if (apiDiary.length === 0 && currentLocal.diaryEntries.length > 0) {
        for (const d of currentLocal.diaryEntries) {
          await DiaryService.createEntry({
            title: d.title || '',
            content: d.content || '',
            mood: d.mood || 'romantic',
            weather: d.weather || 'sunny',
            author: d.author || 'Kien',
            date: d.date || new Date().toISOString().split('T')[0],
            imageUrls: d.imageUrls || [],
          });
        }
      }

      // Auto-migrate memories if Cloud DB is empty
      if (apiMemories.length === 0 && currentLocal.memories.length > 0) {
        for (const m of currentLocal.memories) {
          await MemoriesService.addMemory({
            title: m.title || 'Cột mốc mới',
            date: m.date || new Date().toISOString().split('T')[0],
            description: m.description || '',
            location: m.location || '',
            category: m.category || 'special',
            imageUrl: m.imageUrl || '',
          });
        }
      }

      // Final fetch from Cloud DB
      const [finalPhotos, finalMemories, finalLetters, finalDiary] = await Promise.all([
        GalleryService.getPhotos(),
        MemoriesService.getMemories(),
        LettersService.getLetters(),
        DiaryService.getEntries(),
      ]);

      set({
        photos: finalPhotos.length > 0 ? finalPhotos : currentLocal.photos,
        memories: finalMemories.length > 0 ? finalMemories : currentLocal.memories,
        letters: finalLetters.length > 0 ? finalLetters : currentLocal.letters,
        diaryEntries: finalDiary.length > 0 ? finalDiary : currentLocal.diaryEntries,
      });

      saveToStorage(get());
    } catch (e) {
      console.warn('Backend API offline, operating in LocalStorage mode');
    }
  },

  addPhoto: async (photoData) => {
    const localPhoto: Photo = {
      ...photoData,
      id: `photo_${Date.now()}`,
    };
    const updated = [localPhoto, ...get().photos];
    set({ photos: updated });
    saveToStorage(get());

    // Sync to Cloud DB
    const apiResult = await GalleryService.addPhoto(photoData);
    if (apiResult) {
      const synced = get().photos.map((p) => (p.id === localPhoto.id ? apiResult : p));
      set({ photos: synced });
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
    const localMemory: MemoryMilestone = {
      ...memoryData,
      id: `memory_${Date.now()}`,
    };
    const updated = [localMemory, ...get().memories];
    set({ memories: updated });
    saveToStorage(get());

    // Sync to Cloud DB
    const apiResult = await MemoriesService.addMemory(memoryData);
    if (apiResult) {
      const synced = get().memories.map((m) => (m.id === localMemory.id ? apiResult : m));
      set({ memories: synced });
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
    const localLetter: LoveLetter = {
      ...letterData,
      id: `letter_${Date.now()}`,
    };
    const updated = [localLetter, ...get().letters];
    set({ letters: updated });
    saveToStorage(get());

    // Sync to Cloud DB
    const apiResult = await LettersService.createLetter(letterData);
    if (apiResult) {
      const synced = get().letters.map((l) => (l.id === localLetter.id ? apiResult : l));
      set({ letters: synced });
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
    const localEntry: DiaryEntry = {
      ...entryData,
      id: `diary_${Date.now()}`,
    };
    const updated = [localEntry, ...get().diaryEntries];
    set({ diaryEntries: updated });
    saveToStorage(get());

    // Sync to Cloud DB
    const apiResult = await DiaryService.createEntry(entryData);
    if (apiResult) {
      const synced = get().diaryEntries.map((d) => (d.id === localEntry.id ? apiResult : d));
      set({ diaryEntries: synced });
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
