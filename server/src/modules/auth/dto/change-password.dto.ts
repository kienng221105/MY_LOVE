import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật mã mới', example: 'new_magic_phrase_123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: 'Mật mã tối thiểu 4 ký tự' })
  newPasscode: string;
}
