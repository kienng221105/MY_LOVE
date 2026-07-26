import { create } from 'zustand';
import { Photo, Album } from '@/types/gallery';
import { MemoryMilestone } from '@/types/memory';
import { LoveLetter } from '@/types/letter';
import { DiaryEntry } from '@/types/diary';
import { ReactionSummary, emptyReactionSummary } from '@/types/reaction';
import { GalleryService } from '@/services/gallery.service';
import { MemoriesService } from '@/services/memories.service';
import { LettersService } from '@/services/letters.service';
import { DiaryService } from '@/services/diary.service';
import { useIdentityStore, IdentityId } from '@/store/useIdentityStore';
import { resolveReactionBy } from '@/utils/reaction';

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
  toggleFavoriteMemory: (id: string) => Promise<void>;

  addLetter: (letter: Omit<LoveLetter, 'id'>) => Promise<void>;
  markLetterRead: (id: string) => Promise<void>;
  updateLetterReactions: (id: string, summary: ReactionSummary) => void;

  addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => Promise<void>;
  deleteDiaryEntry: (id: string) => Promise<void>;
  updateDiaryReactions: (id: string, summary: ReactionSummary) => void;

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
    const tasks = await Promise.allSettled([
      GalleryService.getPhotos(),
      MemoriesService.getMemories(),
      LettersService.getLetters(getCurrentMe()),
      DiaryService.getEntries(getCurrentMe()),
    ]);

    const [photosResult, memoriesResult, lettersResult, diaryResult] = tasks;

    const fallback = readCacheFromStorage();
    const photos = pickValue(photosResult, fallback.photos);
    const memories = pickValue(memoriesResult, fallback.memories);
    // Với letters/diary: cache cũ có thể thiếu reactions → tự bổ sung fallback
    const letters = normalizeLetterReactions(
      pickValue(lettersResult, fallback.letters)
    );
    const diaryEntries = normalizeDiaryReactions(
      pickValue(diaryResult, fallback.diaryEntries)
    );

    set({ photos, memories, letters, diaryEntries });
    saveToStorage({ photos, memories, letters, diaryEntries });

    const failures = tasks
      .map((task, idx) => ({ task, idx }))
      .filter(({ task }) => task.status === 'rejected')
      .map(({ idx }) => idx);
    if (failures.length > 0) {
      console.warn(
        `Một số API không phản hồi (${failures.join(', ')}); đang dùng cache cũ.`
      );
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
    const created = await GalleryService.addPhoto(photoData);
    const updated = [created, ...get().photos];
    set({ photos: updated });
    saveToStorage(get());
  },

  deletePhoto: async (id) => {
    const updated = get().photos.filter((p) => p.id !== id);
    set({ photos: updated });
    saveToStorage(get());
    await GalleryService.deletePhoto(id);
  },

  addMemory: async (memoryData) => {
    const created = await MemoriesService.addMemory(memoryData);
    const updated = [created, ...get().memories];
    set({ memories: updated });
    saveToStorage(get());
  },

  toggleFavoriteMemory: async (id) => {
    const target = get().memories.find((m) => m.id === id);
    if (!target) return;
    const updated = get().memories.map((m) =>
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    );
    set({ memories: updated });
    saveToStorage(get());
    try {
      await MemoriesService.addMemory({ ...target, isFavorite: !target.isFavorite });
    } catch (err) {
      console.warn('Failed to sync memory favorite, rolling back', err);
      set({
        memories: get().memories.map((m) =>
          m.id === id ? target : m
        ),
      });
      saveToStorage(get());
      throw err;
    }
  },

  addLetter: async (letterData) => {
    const created = await LettersService.createLetter(letterData, getCurrentMe());
    const updated = [created, ...get().letters];
    set({ letters: updated });
    saveToStorage(get());
  },

  markLetterRead: async (id) => {
    const previous = get().letters.find((l) => l.id === id);
    const updated = get().letters.map((l) =>
      l.id === id ? { ...l, isRead: true } : l
    );
    set({ letters: updated });
    saveToStorage(get());
    try {
      await LettersService.markAsRead(id);
    } catch (err) {
      console.warn('Failed to sync mark-as-read, rolling back', err);
      if (previous) {
        set({
          letters: get().letters.map((l) =>
            l.id === id ? previous : l
          ),
        });
        saveToStorage(get());
      }
      throw err;
    }
  },

  updateLetterReactions: (id, summary) => {
    const updated = get().letters.map((l) =>
      l.id === id ? { ...l, reactions: summary } : l
    );
    set({ letters: updated });
    saveToStorage(get());
  },

  addDiaryEntry: async (entryData) => {
    const created = await DiaryService.createEntry(entryData, getCurrentMe());
    const updated = [created, ...get().diaryEntries];
    set({ diaryEntries: updated });
    saveToStorage(get());
  },

  deleteDiaryEntry: async (id) => {
    const previous = get().diaryEntries;
    const updated = previous.filter((d) => d.id !== id);
    set({ diaryEntries: updated });
    saveToStorage(get());
    try {
      await DiaryService.deleteEntry(id);
    } catch (err) {
      console.warn('Failed to delete diary entry, rolling back', err);
      set({ diaryEntries: previous });
      saveToStorage(get());
      throw err;
    }
  },

  updateDiaryReactions: (id, summary) => {
    const updated = get().diaryEntries.map((d) =>
      d.id === id ? { ...d, reactions: summary } : d
    );
    set({ diaryEntries: updated });
    saveToStorage(get());
  },
}));

function getCurrentMe(): IdentityId {
  // Ưu tiên IdentityStore (sync trong memory)
  try {
    const storeId = useIdentityStore.getState().identity;
    if (storeId) return storeId;
  } catch {}
  // Fallback localStorage
  if (typeof window === 'undefined') return 'Kien';
  try {
    const stored = localStorage.getItem('ourspace_identity');
    if (stored === 'Kien' || stored === 'Love') return stored;
    const userName = localStorage.getItem('ourspace_user_name');
    if (userName) return resolveReactionBy(userName);
  } catch {}
  return 'Kien';
}

function pickValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === 'fulfilled') return result.value;
  return fallback;
}

/**
 * Cache cũ có thể không có field `reactions`. Bổ sung giá trị rỗng
 * để ReactionPicker không crash khi đọc grouped.
 */
function normalizeLetterReactions(items: LoveLetter[]): LoveLetter[] {
  return items.map((item) => ({
    ...item,
    reactions: item.reactions ?? emptyReactionSummary(),
  }));
}

function normalizeDiaryReactions(items: DiaryEntry[]): DiaryEntry[] {
  return items.map((item) => ({
    ...item,
    reactions: item.reactions ?? emptyReactionSummary(),
  }));
}

function readCacheFromStorage() {
  if (typeof window === 'undefined') {
    return { photos: [], memories: [], letters: [], diaryEntries: [] };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { photos: [], memories: [], letters: [], diaryEntries: [] };
    }
    const parsed = JSON.parse(stored);
    return {
      photos: parsed.photos || [],
      memories: parsed.memories || [],
      letters: parsed.letters || [],
      diaryEntries: parsed.diaryEntries || [],
    };
  } catch {
    return { photos: [], memories: [], letters: [], diaryEntries: [] };
  }
}

function saveToStorage(state: {
  photos: Photo[];
  memories: MemoryMilestone[];
  letters: LoveLetter[];
  diaryEntries: DiaryEntry[];
}) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          photos: state.photos,
          memories: state.memories,
          letters: state.letters,
          diaryEntries: state.diaryEntries,
        })
      );
    } catch (err) {
      console.warn('Failed to persist app cache', err);
    }
  }
}