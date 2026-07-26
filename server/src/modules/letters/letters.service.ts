import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLetterDto } from './dto/create-letter.dto';

@Injectable()
export class LettersService {
  constructor(private prisma: PrismaService) {}

  async getLetters() {
    return this.prisma.loveLetter.findMany({
      orderBy: { sentDate: 'desc' },
    }).catch(() => []);
  }

  async createLetter(dto: CreateLetterDto) {
    return this.prisma.loveLetter.create({
      data: {
        sender: dto.sender,
        recipient: dto.recipient,
        title: dto.title,
        content: dto.content,
        openDate: dto.openDate ? new Date(dto.openDate) : null,
        bgStyle: dto.bgStyle || 'pink',
      },
    });
  }

  async markAsRead(id: string) {
    try {
      return await this.prisma.loveLetter.update({
        where: { id },
        data: { isRead: true },
      });
    } catch {
      return { success: true };
    }
  }
}
