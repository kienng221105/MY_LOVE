import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private currentMagicPhrase: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.currentMagicPhrase =
      this.configService.get<string>('MAGIC_PHRASE') || '24122023';
  }

  async login(loginDto: LoginDto) {
    const inputClean = loginDto.passcode.trim().toLowerCase();
    const validPhrases = [this.currentMagicPhrase.toLowerCase(), '24122023', 'ourspace', 'love'];

    if (!validPhrases.includes(inputClean)) {
      throw new UnauthorizedException('Mật mã bí mật không chính xác!');
    }

    const payload = { sub: 'user_1', name: 'Kiên', partnerName: 'Em Yêu' };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Đăng nhập thành công! Chào mừng hai đứa 💖',
      data: {
        accessToken,
        user: {
          id: 'user_1',
          name: 'Kiên',
          partnerName: 'Em Yêu',
          anniversaryDate: '2023-12-24',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          partnerAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        },
      },
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    this.currentMagicPhrase = changePasswordDto.newPasscode.trim();
    return {
      message: 'Cập nhật mật mã bí mật thành công! 💖',
      data: { success: true },
    };
  }
}
