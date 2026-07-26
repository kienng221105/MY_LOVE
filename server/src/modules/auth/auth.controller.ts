import { Controller, Post, Body, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập bằng Mật mã bí mật (Magic Phrase)' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('change-password')
  @ApiOperation({ summary: 'Đổi mật mã bí mật' })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  async getMe(@CurrentUser() user: any) {
    return {
      message: 'Lấy thông tin tài khoản thành công',
      data: user,
    };
  }

  @Get('timer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thời điểm bắt đầu chính thức (đồng bộ nhiều thiết bị)' })
  async getTimer(@CurrentUser() user: any) {
    const data = await this.authService.getTimer(user.id);
    return { message: 'Lấy thời điểm bắt đầu thành công', data };
  }

  @Patch('timer/reset')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đặt lại thời điểm bắt đầu từ phía server' })
  async resetTimer(@CurrentUser() user: any) {
    const data = await this.authService.resetTimer(user.id);
    return { message: 'Đã đặt lại thời điểm bắt đầu', data };
  }
}
