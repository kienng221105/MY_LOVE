import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToggleReactionDto, ReactionTypeValue, ReactionTargetValue } from './dto/toggle-reaction.dto';

export interface ReactionSummary {
  total: number;
  byMe: ReactionTypeValue | null;
  byPartner: ReactionTypeValue | null;
  grouped: Record<ReactionTypeValue, { total: number; mine: boolean; partner: boolean }>;
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
   */
  async summarize(
    targetType: ReactionTargetValue,
    targetId: string,
    me: 'Kien' | 'Love'
  ): Promise<ReactionSummary> {
    const reactions = await this.prisma.reaction.findMany({
      where: this.whereForTarget(targetType, targetId),
    });

    const grouped: ReactionSummary['grouped'] = {
      HEART: { total: 0, mine: false, partner: false },
      CRY: { total: 0, mine: false, partner: false },
      LAUGH: { total: 0, mine: false, partner: false },
      ANGRY: { total: 0, mine: false, partner: false },
      HUG: { total: 0, mine: false, partner: false },
    };

    let byMe: ReactionTypeValue | null = null;
    let byPartner: ReactionTypeValue | null = null;

    for (const r of reactions) {
      if (!grouped[r.type as ReactionTypeValue]) continue;
      grouped[r.type as ReactionTypeValue].total += 1;
      if (r.reactionBy === me) {
        grouped[r.type as ReactionTypeValue].mine = true;
        byMe = r.type as ReactionTypeValue;
      } else if (r.reactionBy === PARTNER_OF[me]) {
        grouped[r.type as ReactionTypeValue].partner = true;
        byPartner = r.type as ReactionTypeValue;
      }
    }

    return {
      total: reactions.length,
      byMe,
      byPartner,
      grouped,
    };
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
    });

    const result: Record<string, ReactionSummary> = {};
    for (const id of targetIds) {
      result[id] = this.emptySummary();
    }
    for (const r of reactions) {
      const id = targetType === 'LETTER' ? r.letterId : r.diaryId;
      if (!id || !result[id]) continue;
      const summary = result[id];
      const type = r.type as ReactionTypeValue;
      if (!summary.grouped[type]) continue;
      summary.grouped[type].total += 1;
      summary.total += 1;
      if (r.reactionBy === me) {
        summary.grouped[type].mine = true;
        summary.byMe = type;
      } else if (r.reactionBy === PARTNER_OF[me]) {
        summary.grouped[type].partner = true;
        summary.byPartner = type;
      }
    }
    return result;
  }

  static emojiFor(type: ReactionTypeValue): string {
    return REACTION_EMOJI[type];
  }

  private emptySummary(): ReactionSummary {
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