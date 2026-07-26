import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ToggleReactionDto,
  ReactionTypeValue,
  ReactionTargetValue,
} from './dto/toggle-reaction.dto';

export interface ReactionUser {
  id: 'Kien' | 'Love';
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

const REACTION_EMOJI: Record<ReactionTypeValue, string> = {
  HEART: '❤️',
  CRY: '😢',
  LAUGH: '😂',
  ANGRY: '😡',
  HUG: '🤗',
};

const PARTNER_OF: Record<'Kien' | 'Love', 'Kien' | 'Love'> = {
  Kien: 'Love',
  Love: 'Kien',
};

const IDENTITY_OF: Record<
  'Kien' | 'Love',
  { name: string; short: string; color: 'blue' | 'pink' }
> = {
  Kien: { name: 'Kiên', short: 'K', color: 'blue' },
  Love: { name: 'Trà', short: 'T', color: 'pink' },
};

function userFor(id: 'Kien' | 'Love'): ReactionUser {
  const info = IDENTITY_OF[id];
  return { id, name: info.name, short: info.short, color: info.color };
}

function emptySummary(): ReactionSummary {
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

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Bật/tắt/đổi reaction:
   * - Cùng emoji → bỏ (xóa)
   * - Emoji khác → cập nhật sang emoji mới
   * - Chưa có → tạo mới
   * Trả về danh sách reaction hiện tại của target + emoji mình vừa chọn (null nếu bỏ).
   */
  async toggleReaction(dto: ToggleReactionDto) {
    await this.ensureTargetExists(dto.targetType, dto.targetId);

    const existing = await this.findMyReaction(
      dto.targetType,
      dto.targetId,
      dto.reactionBy
    );

    let action: 'created' | 'updated' | 'removed';
    if (!existing) {
      await this.prisma.reaction.create({
        data: {
          type: dto.type,
          reactionBy: dto.reactionBy,
          targetType: dto.targetType,
          ...(dto.targetType === 'LETTER'
            ? { letterId: dto.targetId, diaryId: null }
            : { diaryId: dto.targetId, letterId: null }),
        },
      });
      action = 'created';
    } else if (existing.type === dto.type) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      action = 'removed';
    } else {
      await this.prisma.reaction.update({
        where: { id: existing.id },
        data: { type: dto.type },
      });
      action = 'updated';
    }

    const summary = await this.summarize(
      dto.targetType,
      dto.targetId,
      dto.reactionBy
    );

    return {
      action,
      emoji: REACTION_EMOJI[dto.type],
      summary,
    };
  }

  /**
   * Lấy tổng hợp reactions của một target — dùng khi GET letter/diary
   * trả về cùng response, frontend nhúng vào luôn.
   *
   * Sắp xếp reactions theo `createdAt` tăng dần (ai thả trước ở trước)
   */
  async summarize(
    targetType: ReactionTargetValue,
    targetId: string,
    me: 'Kien' | 'Love'
  ): Promise<ReactionSummary> {
    const reactions = await this.prisma.reaction.findMany({
      where: this.whereForTarget(targetType, targetId),
      orderBy: { createdAt: 'asc' },
    });

    const summary = emptySummary();

    for (const r of reactions) {
      const type = r.type as ReactionTypeValue;
      if (!summary.grouped[type]) continue;
      const group = summary.grouped[type];
      const user = userFor(r.reactionBy as 'Kien' | 'Love');
      group.total += 1;
      group.users.push(user);
      summary.total += 1;
      // Track người đã thả bất kỳ reaction nào (unique)
      if (!summary.reactors.find((u) => u.id === user.id)) {
        summary.reactors.push(user);
      }
      if (r.reactionBy === me) {
        group.mine = true;
        summary.byMe = type;
      } else if (r.reactionBy === PARTNER_OF[me]) {
        group.partner = true;
        summary.byPartner = type;
      }
    }

    return summary;
  }

  async listForTargets(
    targetType: ReactionTargetValue,
    targetIds: string[],
    me: 'Kien' | 'Love'
  ): Promise<Record<string, ReactionSummary>> {
    if (targetIds.length === 0) return {};
    const reactions = await this.prisma.reaction.findMany({
      where:
        targetType === 'LETTER'
          ? { letterId: { in: targetIds } }
          : { diaryId: { in: targetIds } },
      orderBy: { createdAt: 'asc' },
    });

    const result: Record<string, ReactionSummary> = {};
    for (const id of targetIds) {
      result[id] = emptySummary();
    }

    for (const r of reactions) {
      const id = targetType === 'LETTER' ? r.letterId : r.diaryId;
      if (!id || !result[id]) continue;
      const summary = result[id];
      const type = r.type as ReactionTypeValue;
      if (!summary.grouped[type]) continue;
      const group = summary.grouped[type];
      const user = userFor(r.reactionBy as 'Kien' | 'Love');
      group.total += 1;
      group.users.push(user);
      summary.total += 1;
      if (!summary.reactors.find((u) => u.id === user.id)) {
        summary.reactors.push(user);
      }
      if (r.reactionBy === me) {
        group.mine = true;
        summary.byMe = type;
      } else if (r.reactionBy === PARTNER_OF[me]) {
        group.partner = true;
        summary.byPartner = type;
      }
    }
    return result;
  }

  static emojiFor(type: ReactionTypeValue): string {
    return REACTION_EMOJI[type];
  }

  private whereForTarget(
    targetType: ReactionTargetValue,
    targetId: string
  ): Record<string, unknown> {
    return targetType === 'LETTER'
      ? { letterId: targetId }
      : { diaryId: targetId };
  }

  private async findMyReaction(
    targetType: ReactionTargetValue,
    targetId: string,
    me: 'Kien' | 'Love'
  ) {
    return this.prisma.reaction.findFirst({
      where: {
        ...this.whereForTarget(targetType, targetId),
        reactionBy: me,
      },
    });
  }

  private async ensureTargetExists(
    targetType: ReactionTargetValue,
    targetId: string
  ) {
    const exists =
      targetType === 'LETTER'
        ? await this.prisma.loveLetter.findUnique({
            where: { id: targetId },
            select: { id: true },
          })
        : await this.prisma.diaryEntry.findUnique({
            where: { id: targetId },
            select: { id: true },
          });
    if (!exists) {
      throw new NotFoundException(
        targetType === 'LETTER'
          ? 'Không tìm thấy lá thư'
          : 'Không tìm thấy bài nhật ký'
      );
    }
  }
}