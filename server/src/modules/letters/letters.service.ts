import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReactionsService } from '../reactions/reactions.service';
import { CreateLetterDto } from './dto/create-letter.dto';

@Injectable()
export class LettersService {
  constructor(
    private prisma: PrismaService,
    private reactionsService: ReactionsService
  ) {}

  async getLetters(me: 'Kien' | 'Love' = 'Kien') {
    const letters = await this.prisma.loveLetter.findMany({
      orderBy: { sentDate: 'desc' },
    });
    const ids = letters.map((l) => l.id);
    const reactions = await this.reactionsService.listForTargets('LETTER', ids, me);
    return letters.map((letter) => ({
      ...letter,
      reactions: reactions[letter.id] || {
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

  async createLetter(dto: CreateLetterDto, me: 'Kien' | 'Love' = 'Kien') {
    const sentDate = dto.sentDate ? new Date(dto.sentDate) : new Date();
    const letter = await this.prisma.loveLetter.create({
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
    const reactions = await this.reactionsService.summarize('LETTER', letter.id, me);
    return { ...letter, reactions };
  }

  async markAsRead(id: string) {
    const updated = await this.prisma.loveLetter.update({
      where: { id },
      data: { isRead: true },
    });
    return updated;
  }
}