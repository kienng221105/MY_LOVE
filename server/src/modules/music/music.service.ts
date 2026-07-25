import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class MusicService {
  constructor(private prisma: PrismaService) {}

  async getPlaylist() {
    return this.prisma.song.findMany({
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);
  }
}
