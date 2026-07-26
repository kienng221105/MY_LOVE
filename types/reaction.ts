export type ReactionTypeValue = 'HEART' | 'CRY' | 'LAUGH' | 'ANGRY' | 'HUG';

export type ReactionTargetValue = 'LETTER' | 'DIARY';

export interface ReactionGroup {
  total: number;
  mine: boolean;
  partner: boolean;
}

export interface ReactionSummary {
  total: number;
  byMe: ReactionTypeValue | null;
  byPartner: ReactionTypeValue | null;
  grouped: Record<ReactionTypeValue, ReactionGroup>;
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

export function emptyReactionSummary(): ReactionSummary {
  return {
    total: 0,
    byMe: null,
    byPartner: null,
    grouped: {
      HEART: { total: 0, mine: false, partner: false },
      CRY: { total: 0, mine: false, partner: false },
      LAUGH: { total: 0, mine: false, partner: false },
      ANGRY: { total: 0, mine: false, partner: false },
      HUG: { total: 0, mine: false, partner: false },
    },
  };
}