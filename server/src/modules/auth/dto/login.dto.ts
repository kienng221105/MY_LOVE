import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Mật mã bí mật (Magic Phrase)', example: '24122023' })
  @IsString()
  @IsNotEmpty({ message: 'Mật mã không được để trống' })
  passcode: string;
}
