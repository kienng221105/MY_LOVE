import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReactionsService } from '../reactions/reactions.service';
import { CreateDiaryDto } from './dto/create-diary.dto';

@Injectable()
export class DiaryService {
  constructor(
    private prisma: PrismaService,
    private reactionsService: ReactionsService
  ) {}

  async getEntries(me: 'Kien' | 'Love' = 'Kien') {
    const entries = await this.prisma.diaryEntry.findMany({
      orderBy: { date: 'desc' },
    });
    const ids = entries.map((e) => e.id);
    const reactions = await this.reactionsService.listForTargets('DIARY', ids, me);
    return entries.map((entry) => ({
      ...entry,
      reactions: reactions[entry.id] || {
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
      },
    }));
  }

  async createEntry(dto: CreateDiaryDto, me: 'Kien' | 'Love' = 'Kien') {
    const date = dto.date ? new Date(dto.date) : new Date();
    const entry = await this.prisma.diaryEntry.create({
      data: {
        title: dto.title?.trim() || '',
        content: dto.content,
        mood: dto.mood,
        weather: dto.weather,
        date,
        author: dto.author || 'Kien',
        imageUrls: dto.imageUrls || [],
        isDraft: dto.isDraft ?? false,
      },
    });
    const reactions = await this.reactionsService.summarize('DIARY', entry.id, me);
    return { ...entry, reactions };
  }

  async deleteEntry(id: string) {
    await this.prisma.diaryEntry.delete({ where: { id } });
    return { id };
  }
}