import { apiClient } from './api';
import { MemoryMilestone } from '@/types/memory';

export class MemoriesApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'MemoriesApiError';
    this.status = status;
  }
}

function unwrapError(err: any, fallback: string): never {
  const status = err?.response?.status;
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.errors?.[0] ||
    err?.message ||
    fallback;
  throw new MemoriesApiError(
    Array.isArray(message) ? message[0] : message,
    status
  );
}

export class MemoriesService {
  static async getMemories(): Promise<MemoryMilestone[]> {
    try {
      const res = await apiClient.get('/memories');
      return res.data?.data || [];
    } catch (err) {
      unwrapError(err, 'Không tải được hành trình');
    }
  }

  static async addMemory(
    memory: Omit<MemoryMilestone, 'id'>
  ): Promise<MemoryMilestone> {
    try {
      const res = await apiClient.post('/memories', memory);
      if (!res.data?.data) {
        throw new MemoriesApiError('Phản hồi lưu cột mốc không hợp lệ');
      }
      return res.data.data;
    } catch (err) {
      unwrapError(err, 'Không lưu được cột mốc, vui lòng thử lại');
    }
  }
}