import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';

@Injectable()
export class DiaryService {
  constructor(private prisma: PrismaService) {}

  async getEntries() {
    return this.prisma.diaryEntry.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async createEntry(dto: CreateDiaryDto) {
    const date = dto.date ? new Date(dto.date) : new Date();
    return this.prisma.diaryEntry.create({
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
  }

  async deleteEntry(id: string) {
    await this.prisma.diaryEntry.delete({ where: { id } });
    return { id };
  }
}