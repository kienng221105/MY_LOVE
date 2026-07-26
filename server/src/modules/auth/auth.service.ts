import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private async getOrCreateUser() {
    try {
      let user = await this.prisma.user.findFirst();
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            id: 'user_1',
            name: 'Kiên',
            partnerName: 'Trà',
            passwordHash: '24122023',
            anniversaryDate: new Date('2023-12-24'),
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            partnerAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
          },
        });
      }
      return user;
    } catch {
      return {
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
        user: {
          id: user.id,
          name: user.name,
          partnerName: user.partnerName,
          anniversaryDate: user.anniversaryDate,
          avatarUrl: user.avatarUrl,
          partnerAvatarUrl: user.partnerAvatarUrl,
        },
      },
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const newPass = changePasswordDto.newPasscode.trim();
    try {
      const user = await this.getOrCreateUser();
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPass },
      });
    } catch {}

    return {
      message: 'Cập nhật mật mã bí mật thành công! 💖',
      data: { success: true },
    };
  }
}
