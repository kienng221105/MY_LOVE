import { apiClient } from './api';
import { MemoryMilestone } from '@/types/memory';

export class MemoriesService {
  static async getMemories(): Promise<MemoryMilestone[]> {
    try {
      const res = await apiClient.get('/memories');
      return res.data?.data || [];
    } catch {
      return [];
    }
  }

  static async addMemory(memory: Omit<MemoryMilestone, 'id'>): Promise<MemoryMilestone | null> {
    try {
      const res = await apiClient.post('/memories', memory);
      return res.data?.data || null;
    } catch {
      return null;
    }
  }
}
