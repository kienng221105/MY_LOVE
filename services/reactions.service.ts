import { apiClient } from './api';
import {
  ToggleReactionRequest,
  ToggleReactionResponse,
  ReactionSummary,
  ReactionTypeValue,
  ReactionTargetValue,
} from '@/types/reaction';

class ReactionsApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ReactionsApiError';
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
  throw new ReactionsApiError(
    Array.isArray(message) ? message[0] : message,
    status
  );
}

export class ReactionsService {
  static async toggle(
    payload: ToggleReactionRequest
  ): Promise<ToggleReactionResponse> {
    try {
      const res = await apiClient.post('/reactions/toggle', payload);
      if (!res.data?.data) {
        throw new ReactionsApiError('Phản hồi reaction không hợp lệ');
      }
      return res.data.data;
    } catch (err) {
      unwrapError(err, 'Không cập nhật được cảm xúc, vui lòng thử lại');
    }
  }

  static async getSummary(
    targetType: ReactionTargetValue,
    targetId: string,
    me: 'Kien' | 'Love' = 'Kien'
  ): Promise<ReactionSummary> {
    try {
      const res = await apiClient.get(
        `/reactions/${targetType}/${targetId}`,
        { params: { me } }
      );
      return res.data?.data;
    } catch (err) {
      unwrapError(err, 'Không tải được cảm xúc');
    }
  }
}