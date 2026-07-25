import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePhotoDto {
  @ApiProperty({ description: 'URL ảnh', example: '/trang_chu.png' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Tiêu đề bức ảnh', example: 'Hoàng hôn Đà Lạt' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Ngày chụp/kỷ niệm', example: '2026-07-20' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Vị trí địa lý', example: 'Đà Lạt, Việt Nam' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Chú thích kỷ niệm', example: 'Buổi chiều dịu dàng' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'ID Album', example: 'travel' })
  @IsOptional()
  @IsString()
  albumId?: string;
}
