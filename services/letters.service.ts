import { LoveLetter } from '@/types/letter';
import { mockLetters } from '@/mock/letters';

let memoryLetters: LoveLetter[] = [...mockLetters];

export class LettersService {
  static async getLetters(): Promise<LoveLetter[]> {
    // TODO: Replace with NestJS endpoint GET /api/letters
    return new Promise((resolve) => setTimeout(() => resolve(memoryLetters), 200));
  }

  static async createLetter(letter: Omit<LoveLetter, 'id'>): Promise<LoveLetter> {
    // TODO: Replace with NestJS endpoint POST /api/letters
    const newLetter: LoveLetter = { ...letter, id: `letter_${Date.now()}` };
    memoryLetters = [newLetter, ...memoryLetters];
    return newLetter;
  }

  static async markAsRead(id: string): Promise<boolean> {
    // TODO: Replace with NestJS endpoint PATCH /api/letters/:id/read
    memoryLetters = memoryLetters.map((l) => (l.id === id ? { ...l, isRead: true } : l));
    return true;
  }
}
