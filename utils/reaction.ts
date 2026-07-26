import { IdentityId, IDENTITIES } from '@/store/useIdentityStore';

export type ReactionBy = IdentityId;

/**
 * Helper fallback cho code không dùng được hook (vd: helper trong store).
 * Trả về 'Kien' | 'Love' — đúng với giá trị reactionBy trong DB.
 * Trong code thông thường hãy dùng `useReactionContext()` thay thế.
 */
export function resolveReactionBy(displayName: string): IdentityId {
  const normalized = (displayName || '').trim().toLowerCase();
  if (normalized === 'trà' || normalized === 'tra') return 'Love';
  return 'Kien';
}

export { IDENTITIES };
export type { IdentityId };