'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { resolveReactionBy } from '@/utils/reaction';

export type ReactionBy = 'Kien' | 'Love';

export interface ReactionContext {
  me: ReactionBy;
  partnerName: string;
  myName: string;
}

/**
 * Xác định "me" là Kiên hay Trà dựa trên user đang đăng nhập.
 * Fallback an toàn: nếu không xác định được thì mặc định 'Kien'.
 */
export function useReactionContext(): ReactionContext {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    const me = resolveReactionBy(user?.name || '');
    return {
      me,
      myName: me === 'Kien' ? 'Kiên' : 'Trà',
      partnerName: me === 'Kien' ? 'Trà' : 'Kiên',
    };
  }, [user]);
}