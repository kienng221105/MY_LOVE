import { DiaryEntry } from '@/types/diary';
import { mockDiaryEntries } from '@/mock/diary';

let memoryDiary: DiaryEntry[] = [...mockDiaryEntries];

export class DiaryService {
  static async getEntries(): Promise<DiaryEntry[]> {
    // TODO: Replace with NestJS endpoint GET /api/diary
    return new Promise((resolve) => setTimeout(() => resolve(memoryDiary), 200));
  }

  static async createEntry(entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
    // TODO: Replace with NestJS endpoint POST /api/diary
    const newEntry: DiaryEntry = { ...entry, id: `diary_${Date.now()}` };
    memoryDiary = [newEntry, ...memoryDiary];
    return newEntry;
  }

  static async deleteEntry(id: string): Promise<boolean> {
    // TODO: Replace with NestJS endpoint DELETE /api/diary/:id
    memoryDiary = memoryDiary.filter((e) => e.id !== id);
    return true;
  }
}
