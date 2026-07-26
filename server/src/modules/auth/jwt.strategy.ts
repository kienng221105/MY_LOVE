import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'ourspace_jwt_secret_key_super_secure_2026',
    });
  }

  async validate(payload: { sub: string; email?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    }).catch(() => null);

    if (user) {
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

    return {
      id: payload.sub || 'user_1',
      name: 'Kiên',
      partnerName: 'Em Yêu',
      anniversaryDate: '2023-12-24T00:00:00.000Z',
      timerVersion: 0,
    };
  }
}
