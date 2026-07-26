import { apiClient } from './api';
import { DiaryEntry } from '@/types/diary';

export class DiaryService {
  static async getEntries(): Promise<DiaryEntry[]> {
    try {
      const res = await apiClient.get('/diary');
      return res.data?.data || [];
    } catch {
      return [];
    }
  }

  static async createEntry(entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry | null> {
    try {
      const res = await apiClient.post('/diary', entry);
      return res.data?.data || null;
    } catch {
      return null;
    }
  }

  static async deleteEntry(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/diary/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}
