import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateLetterDto {
  @ApiProperty({ description: 'Người gửi', example: 'Kiên' })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({ description: 'Người nhận', example: 'Trà' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional({
    description: 'Tiêu đề lá thư (tùy chọn)',
    example: 'Gửi người con gái anh yêu',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Nội dung lá thư', example: 'Cảm ơn em vì tất cả...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Ngày gửi lá thư (ISO-8601)',
    example: '2026-07-26T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  sentDate?: string;

  @ApiPropertyOptional({
    description: 'Ngày cho phép mở thư (ISO-8601, Scheduled)',
    example: '2026-12-24T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  openDate?: string;

  @ApiPropertyOptional({ description: 'Màu nền lá thư', example: 'pink' })
  @IsOptional()
  @IsString()
  bgStyle?: string;

  @ApiPropertyOptional({ description: 'Trạng thái đã đọc', example: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Trạng thái yêu thích', example: false })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'ID lá thư', example: 'letter_123' })
  @IsOptional()
  @IsString()
  id?: string;
}