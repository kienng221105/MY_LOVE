import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemoryDto } from './dto/create-memory.dto';

@Injectable()
export class MemoriesService {
  constructor(private prisma: PrismaService) {}

  async getMemories() {
    return this.prisma.memoryMilestone.findMany({
      orderBy: { date: 'desc' },
    }).catch(() => []);
  }

  async addMemory(dto: CreateMemoryDto) {
    return this.prisma.memoryMilestone.create({
      data: {
        title: dto.title,
        date: new Date(dto.date),
        description: dto.description,
        location: dto.location,
        category: dto.category,
        imageUrl: dto.imageUrl,
        isFavorite: dto.isFavorite ?? false,
      },
    });
  }
}
