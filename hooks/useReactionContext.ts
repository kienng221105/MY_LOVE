'use client';

import { useMemo } from 'react';
import { useIdentityStore, IDENTITIES, IdentityId } from '@/store/useIdentityStore';

export type ReactionBy = IdentityId;

export interface ReactionContext {
  me: ReactionBy;
  partnerName: string;
  myName: string;
  partner: ReactionBy;
}

/**
 * Xác định "me" là Kiên hay Trà dựa trên IdentityStore (người dùng chọn).
 * Có thể chuyển đổi qua lại bất kỳ lúc nào bằng IdentitySwitcher.
 */
export function useReactionContext(): ReactionContext {
  const me = useIdentityStore((s) => s.identity);

  return useMemo(() => {
    const partner: ReactionBy = me === 'Kien' ? 'Love' : 'Kien';
    return {
      me,
      myName: IDENTITIES[me].displayName,
      partnerName: IDENTITIES[partner].displayName,
      partner,
    };
  }, [me]);
}