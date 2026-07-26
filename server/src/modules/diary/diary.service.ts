import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';

@Injectable()
export class DiaryService {
  constructor(private prisma: PrismaService) {}

  async getEntries() {
    return this.prisma.diaryEntry.findMany({
      orderBy: { date: 'desc' },
    }).catch(() => []);
  }

  async createEntry(dto: CreateDiaryDto) {
    return this.prisma.diaryEntry.create({
      data: {
        title: dto.title,
        content: dto.content,
        mood: dto.mood,
        weather: dto.weather,
        author: dto.author || 'Kien',
        imageUrls: dto.imageUrls || [],
      },
    });
  }

  async deleteEntry(id: string) {
    try {
      await this.prisma.diaryEntry.delete({ where: { id } });
      return true;
    } catch {
      return true;
    }
  }
}
