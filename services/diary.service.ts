import { apiClient } from './api';
import { DiaryEntry } from '@/types/diary';

export class DiaryApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DiaryApiError';
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
  throw new DiaryApiError(
    Array.isArray(message) ? message[0] : message,
    status
  );
}

export class DiaryService {
  static async getEntries(): Promise<DiaryEntry[]> {
    try {
      const res = await apiClient.get('/diary');
      return res.data?.data || [];
    } catch (err) {
      unwrapError(err, 'Không tải được nhật ký');
    }
  }

  static async createEntry(
    entry: Omit<DiaryEntry, 'id'>
  ): Promise<DiaryEntry> {
    try {
      const res = await apiClient.post('/diary', entry);
      if (!res.data?.data) {
        throw new DiaryApiError('Phản hồi lưu nhật ký không hợp lệ');
      }
      return res.data.data;
    } catch (err) {
      unwrapError(err, 'Không lưu được nhật ký, vui lòng thử lại');
    }
  }

  static async deleteEntry(id: string): Promise<void> {
    try {
      await apiClient.delete(`/diary/${id}`);
    } catch (err) {
      unwrapError(err, 'Không xóa được nhật ký');
    }
  }
}