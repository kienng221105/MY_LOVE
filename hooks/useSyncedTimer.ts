import { useEffect, useRef, useState, useCallback } from 'react';
import { TimerService, TimerSnapshot } from '@/services/timer.service';

export type CountdownSnapshot = TimerSnapshot & {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  serverOffsetMs: number;
  isLoading: boolean;
  error: string | null;
};

interface UseSyncedTimerOptions {
  pollIntervalMs?: number;
  pollOnFocus?: boolean;
  autoStart?: boolean;
}

function diffParts(elapsedMs: number) {
  const safe = Math.max(0, elapsedMs);
  const days = Math.floor(safe / 86_400_000);
  const hours = Math.floor((safe % 86_400_000) / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

export function useSyncedTimer(options: UseSyncedTimerOptions = {}) {
  const {
    pollIntervalMs = 30_000,
    pollOnFocus = true,
    autoStart = true,
  } = options;

  const [snapshot, setSnapshot] = useState<CountdownSnapshot | null>(null);
  const snapshotRef = useRef<TimerSnapshot | null>(null);
  const offsetRef = useRef(0);
  const [tick, setTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<{ version: number; at: number } | null>(null);

  const refresh = useCallback(async (reason: 'mount' | 'focus' | 'poll' = 'mount') => {
    try {
      const data = await TimerService.getTimer();
      lastFetchRef.current = { version: data.version, at: Date.now() };
      const serverNowMs = new Date(data.serverNow).getTime();
      offsetRef.current = serverNowMs - data.fetchedAt;
      snapshotRef.current = data;
      setError(null);
      setIsLoading(false);
      setTick((v) => v + 1);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không đồng bộ được timer';
      setError(message);
      setIsLoading(false);
      if (reason !== 'poll') {
        // surface error only on direct user-triggered fetches
      }
    }
  }, []);

  const reset = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await TimerService.resetTimer();
      const serverNowMs = new Date(data.serverNow).getTime();
      offsetRef.current = serverNowMs - data.fetchedAt;
      snapshotRef.current = data;
      lastFetchRef.current = { version: data.version, at: Date.now() };
      setError(null);
      setIsLoading(false);
      setTick((v) => v + 1);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Không đặt lại được timer';
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    refresh('mount');
  }, [autoStart, refresh]);

  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pollIntervalMs) return;
    const id = setInterval(() => refresh('poll'), pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs, refresh]);

  useEffect(() => {
    if (!pollOnFocus || typeof window === 'undefined') return;
    const onFocus = () => refresh('focus');
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh('focus');
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pollOnFocus, refresh]);

  const state = snapshotRef.current;
  if (!state) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      startAt: null,
      serverNow: null,
      version: null,
      updatedAt: null,
      serverOffsetMs: 0,
      isLoading,
      error,
      refresh,
      reset,
      lastFetchedAt: null,
    };
  }

  const effectiveNow = Date.now() + offsetRef.current;
  const startMs = new Date(state.startAt).getTime();
  const { days, hours, minutes, seconds } = diffParts(effectiveNow - startMs);

  void tick;

  return {
    days,
    hours,
    minutes,
    seconds,
    startAt: state.startAt,
    serverNow: state.serverNow,
    version: state.version,
    updatedAt: state.updatedAt,
    serverOffsetMs: offsetRef.current,
    isLoading,
    error,
    refresh,
    reset,
    lastFetchedAt: lastFetchRef.current?.at ?? null,
  };
}