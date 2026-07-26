import { IDENTITIES, IdentityId } from '@/store/useIdentityStore';

export type ReactionTypeValue = 'HEART' | 'CRY' | 'LAUGH' | 'ANGRY' | 'HUG';

export type ReactionTargetValue = 'LETTER' | 'DIARY';

export interface ReactionUser {
  id: IdentityId;
  name: string;
  short: string;
  color: 'blue' | 'pink';
}

export interface ReactionGroup {
  total: number;
  mine: boolean;
  partner: boolean;
  /** Danh sách người đã thả reaction này (theo thứ tự thả) */
  users: ReactionUser[];
}

export interface ReactionSummary {
  total: number;
  byMe: ReactionTypeValue | null;
  byPartner: ReactionTypeValue | null;
  grouped: Record<ReactionTypeValue, ReactionGroup>;
  /** Danh sách người đã thả bất kỳ reaction nào trên target */
  reactors: ReactionUser[];
}

export interface ToggleReactionRequest {
  type: ReactionTypeValue;
  targetType: ReactionTargetValue;
  targetId: string;
  reactionBy: 'Kien' | 'Love';
}

export interface ToggleReactionResponse {
  action: 'created' | 'updated' | 'removed';
  emoji: string;
  summary: ReactionSummary;
}

export const REACTION_OPTIONS: {
  type: ReactionTypeValue;
  emoji: string;
  label: string;
}[] = [
  { type: 'HEART', emoji: '❤️', label: 'Yêu thương' },
  { type: 'HUG', emoji: '🤗', label: 'Ôm ấm áp' },
  { type: 'LAUGH', emoji: '😂', label: 'Cười vui' },
  { type: 'CRY', emoji: '😢', label: 'Xúc động' },
  { type: 'ANGRY', emoji: '😡', label: 'Giận hờn' },
];

/** Map ngược từ ReactionType ra config (label, emoji) */
export const REACTION_META: Record<
  ReactionTypeValue,
  { emoji: string; label: string }
> = REACTION_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.type]: { emoji: opt.emoji, label: opt.label } }),
  {} as Record<ReactionTypeValue, { emoji: string; label: string }>
);

/** Helper tạo user object từ identity key */
export function userFromIdentity(id: IdentityId): ReactionUser {
  const info = IDENTITIES[id];
  return {
    id,
    name: info.displayName,
    short: info.shortLabel,
    color: info.color,
  };
}

export function emptyReactionSummary(): ReactionSummary {
  return {
    total: 0,
    byMe: null,
    byPartner: null,
    grouped: {
      HEART: { total: 0, mine: false, partner: false, users: [] },
      CRY: { total: 0, mine: false, partner: false, users: [] },
      LAUGH: { total: 0, mine: false, partner: false, users: [] },
      ANGRY: { total: 0, mine: false, partner: false, users: [] },
      HUG: { total: 0, mine: false, partner: false, users: [] },
    },
    reactors: [],
  };
}