import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateLetterDto {
  @ApiProperty({ description: 'Người gửi', example: 'Kiên' })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({ description: 'Người nhận', example: 'Em Yêu' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({ description: 'Tiêu đề lá thư', example: 'Gửi người con gái anh yêu' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Nội dung lá thư', example: 'Cảm ơn em vì tất cả...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Ngày gửi lá thư', example: '2026-07-26' })
  @IsOptional()
  @IsString()
  sentDate?: string;

  @ApiPropertyOptional({ description: 'Ngày cho phép mở thư (Scheduled)', example: '2026-12-24' })
  @IsOptional()
  @IsString()
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
