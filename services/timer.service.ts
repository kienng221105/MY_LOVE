import { apiClient } from './api';

export interface TimerState {
  startAt: string;
  serverNow: string;
  version: number;
  updatedAt: string;
}

export interface TimerSnapshot extends TimerState {
  fetchedAt: number;
}

export class TimerService {
  static async getTimer(): Promise<TimerSnapshot> {
    const res = await apiClient.get('/auth/timer');
    const data: TimerState = res.data?.data;
    if (!data?.startAt || !data?.serverNow) {
      throw new Error('Phản hồi timer không hợp lệ');
    }
    return { ...data, fetchedAt: Date.now() };
  }

  static async resetTimer(): Promise<TimerSnapshot> {
    const res = await apiClient.patch('/auth/timer/reset');
    const data: TimerState = res.data?.data;
    if (!data?.startAt || !data?.serverNow) {
      throw new Error('Phản hồi timer không hợp lệ');
    }
    return { ...data, fetchedAt: Date.now() };
  }
}