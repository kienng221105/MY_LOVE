import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLetterDto } from './dto/create-letter.dto';

@Injectable()
export class LettersService {
  constructor(private prisma: PrismaService) {}

  async getLetters() {
    return this.prisma.loveLetter.findMany({
      orderBy: { sentDate: 'desc' },
    });
  }

  async createLetter(dto: CreateLetterDto) {
    const sentDate = dto.sentDate ? new Date(dto.sentDate) : new Date();
    return this.prisma.loveLetter.create({
      data: {
        sender: dto.sender,
        recipient: dto.recipient,
        title: dto.title?.trim() || '',
        content: dto.content,
        sentDate,
        openDate: dto.openDate ? new Date(dto.openDate) : null,
        bgStyle: dto.bgStyle || 'pink',
        isRead: dto.isRead ?? false,
        isFavorite: dto.isFavorite ?? false,
      },
    });
  }

  async markAsRead(id: string) {
    const updated = await this.prisma.loveLetter.update({
      where: { id },
      data: { isRead: true },
    });
    return updated;
  }
}