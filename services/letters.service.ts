import { apiClient } from './api';
import { LoveLetter } from '@/types/letter';

export class LettersApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LettersApiError';
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
  throw new LettersApiError(
    Array.isArray(message) ? message[0] : message,
    status
  );
}

export class LettersService {
  static async getLetters(me: 'Kien' | 'Love' = 'Kien'): Promise<LoveLetter[]> {
    try {
      const res = await apiClient.get('/letters', { params: { me } });
      return res.data?.data || [];
    } catch (err) {
      unwrapError(err, 'Không tải được danh sách thư yêu');
    }
  }

  static async createLetter(
    letter: Omit<LoveLetter, 'id'>,
    me: 'Kien' | 'Love' = 'Kien'
  ): Promise<LoveLetter> {
    try {
      const res = await apiClient.post('/letters', letter, { params: { me } });
      if (!res.data?.data) {
        throw new LettersApiError('Phản hồi lưu thư không hợp lệ');
      }
      return res.data.data;
    } catch (err) {
      unwrapError(err, 'Không gửi được thư yêu, vui lòng thử lại');
    }
  }

  static async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/letters/${id}/read`);
    } catch (err) {
      unwrapError(err, 'Không đánh dấu đã đọc được');
    }
  }
}