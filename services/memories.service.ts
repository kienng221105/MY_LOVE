import { MemoryMilestone } from '@/types/memory';
import { mockMemories } from '@/mock/memories';

let memoryTimeline: MemoryMilestone[] = [...mockMemories];

export class MemoriesService {
  static async getMemories(): Promise<MemoryMilestone[]> {
    // TODO: Replace with NestJS endpoint GET /api/memories
    return new Promise((resolve) => setTimeout(() => resolve(memoryTimeline), 200));
  }

  static async addMemory(memory: Omit<MemoryMilestone, 'id'>): Promise<MemoryMilestone> {
    // TODO: Replace with NestJS endpoint POST /api/memories
    const newMemory: MemoryMilestone = { ...memory, id: `memory_${Date.now()}` };
    memoryTimeline = [newMemory, ...memoryTimeline];
    return newMemory;
  }
}
