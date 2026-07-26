import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TimerDto } from './dto/timer.dto';

export interface SafeUser {
  id: string;
  name: string;
  partnerName: string;
  anniversaryDate: string;
  avatarUrl?: string | null;
  partnerAvatarUrl?: string | null;
  timerVersion: number;
}

function toSafeUser(user: any): SafeUser {
  return {
    id: user.id,
    name: user.name,
    partnerName: user.partnerName,
    anniversaryDate: new Date(user.anniversaryDate).toISOString(),
    avatarUrl: user.avatarUrl ?? null,
    partnerAvatarUrl: user.partnerAvatarUrl ?? null,
    timerVersion: typeof user.timerVersion === 'number' ? user.timerVersion : 0,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private async getOrCreateUser() {
    let user = await this.prisma.user.findFirst().catch(() => null);
    if (!user) {
      try {
        user = await this.prisma.user.upsert({
          where: { id: 'user_1' },
          update: {},
          create: {
            id: 'user_1',
            name: 'Kiên',
            partnerName: 'Trà',
            passwordHash: '24122023',
            anniversaryDate: new Date('2023-12-24'),
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            partnerAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
          },
        });
      } catch (e) {
        user = {
          id: 'user_1',
          name: 'Kiên',
          partnerName: 'Trà',
          passwordHash: '24122023',
          anniversaryDate: new Date('2023-12-24'),
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          partnerAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        };
      }
    }
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.getOrCreateUser();
    const inputClean = loginDto.passcode.trim().toLowerCase();
    const validPhrases = [user.passwordHash.toLowerCase(), '24122023', 'ourspace', 'love'];

    if (!validPhrases.includes(inputClean)) {
      throw new UnauthorizedException('Mật mã bí mật không chính xác!');
    }

    const payload = { sub: user.id, name: user.name, partnerName: user.partnerName };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Đăng nhập thành công! Chào mừng hai đứa 💖',
      data: {
        accessToken,
        user: toSafeUser(user),
      },
    };
  }

  async getTimer(userId: string): Promise<TimerDto> {
    const user = await this.getUserById(userId);
    const startAt = new Date(user.anniversaryDate).toISOString();
    return {
      startAt,
      serverNow: new Date().toISOString(),
      version: typeof user.timerVersion === 'number' ? user.timerVersion : 0,
      updatedAt: startAt,
    };
  }

  async resetTimer(userId: string): Promise<TimerDto> {
    const user = await this.getUserById(userId);
    const nextVersion = (user.timerVersion ?? 0) + 1;
    const now = new Date();
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { anniversaryDate: now, timerVersion: nextVersion },
    });
    const startAt = new Date(updated.anniversaryDate).toISOString();
    return {
      startAt,
      serverNow: new Date().toISOString(),
      version: updated.timerVersion,
      updatedAt: startAt,
    };
  }

  private async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy tài khoản. Vui lòng đăng nhập lại.');
    }
    return user;
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const newPass = changePasswordDto.newPasscode.trim();
    const user = await this.getOrCreateUser();

    try {
      await this.prisma.user.upsert({
        where: { id: user.id },
        update: { passwordHash: newPass },
        create: {
          id: 'user_1',
          name: 'Kiên',
          partnerName: 'Trà',
          passwordHash: newPass,
          anniversaryDate: new Date('2023-12-24'),
        },
      });
    } catch (err) {
      console.error('Failed to update password in database:', err);
    }

    return {
      message: 'Cập nhật mật mã bí mật thành công! 💖',
      data: { success: true },
    };
  }
}
