import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  async getPhotos() {
    return this.prisma.photo.findMany({
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);
  }

  async getAlbums() {
    return this.prisma.album.findMany({
      include: { _count: { select: { photos: true } } },
    }).catch(() => []);
  }

  async addPhoto(dto: CreatePhotoDto) {
    return this.prisma.photo.create({
      data: {
        url: dto.url,
        title: dto.title,
        date: dto.date ? new Date(dto.date) : new Date(),
        location: dto.location,
        caption: dto.caption,
        albumId: dto.albumId,
      },
    });
  }

  async deletePhoto(id: string) {
    try {
      await this.prisma.photo.delete({ where: { id } });
      return true;
    } catch {
      return true;
    }
  }
}
