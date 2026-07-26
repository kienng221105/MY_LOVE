'use client';

import { useEffect, useRef } from 'react';
import { ReactionsService } from '@/services/reactions.service';
import { ReactionBy } from './useReactionContext';
import { ReactionTargetValue, ReactionSummary } from '@/types/reaction';

interface UseReactionSyncOpts {
  targetType: ReactionTargetValue;
  targetIds: string[];
  me: ReactionBy;
  onSync: (id: string, summary: ReactionSummary) => void;
  /** Bỏ qua nếu trang đang ở background (mặc định: true) */
  pauseWhenHidden?: boolean;
  /** Interval polling tính bằng ms (mặc định 8s) */
  intervalMs?: number;
}

/**
 * Đồng bộ reaction summary giữa 2 user:
 * - Polling mỗi intervalMs khi trang visible
 * - Refresh ngay khi tab focus/visible trở lại
 * - Không block UI (chạy async, lỗi âm thầm)
 */
export function useReactionSync({
  targetType,
  targetIds,
  me,
  onSync,
  pauseWhenHidden = true,
  intervalMs = 8000,
}: UseReactionSyncOpts) {
  const idsRef = useRef<string[]>(targetIds);
  const meRef = useRef<ReactionBy>(me);
  const onSyncRef = useRef(onSync);
  idsRef.current = targetIds;
  meRef.current = me;
  onSyncRef.current = onSync;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timer: number | null = null;

    const sync = async () => {
      const ids = idsRef.current;
      if (ids.length === 0) return;
      try {
        const summaries = await ReactionsService.listForTargets(
          targetType,
          ids,
          meRef.current
        );
        for (const id of ids) {
          const next = summaries[id];
          if (next) onSyncRef.current(id, next);
        }
      } catch {
        /* silent */
      }
    };

    const start = () => {
      if (timer !== null) return;
      const tick = () => {
        if (
          pauseWhenHidden &&
          typeof document !== 'undefined' &&
          document.visibilityState !== 'visible'
        ) {
          /* skip tick nếu ẩn */
          return;
        }
        sync();
      };
      tick();
      timer = window.setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();

    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sync();
      }
    };
    const onFocus = () => sync();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [targetType, intervalMs, pauseWhenHidden]);
}