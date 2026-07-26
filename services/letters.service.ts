import { apiClient } from './api';
import { LoveLetter } from '@/types/letter';

export class LettersService {
  static async getLetters(): Promise<LoveLetter[]> {
    try {
      const res = await apiClient.get('/letters');
      return res.data?.data || [];
    } catch {
      return [];
    }
  }

  static async createLetter(letter: Omit<LoveLetter, 'id'>): Promise<LoveLetter | null> {
    try {
      const res = await apiClient.post('/letters', letter);
      return res.data?.data || null;
    } catch {
      return null;
    }
  }

  static async markAsRead(id: string): Promise<boolean> {
    try {
      await apiClient.patch(`/letters/${id}/read`);
      return true;
    } catch {
      return false;
    }
  }
}
