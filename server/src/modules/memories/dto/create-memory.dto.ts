import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateMemoryDto {
  @ApiProperty({ description: 'Tên cột mốc', example: 'Lần đầu gặp nhau' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Ngày diễn ra', example: '2023-10-15' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Mô tả chi tiết', example: 'Quán cà phê sách ngập nắng' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Địa điểm', example: 'Sài Gòn' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Phân loại', example: 'first_meet' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'URL hình ảnh', example: '/trang_chu.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Đánh dấu yêu thích', example: true })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'ID cột mốc', example: 'memory_123' })
  @IsOptional()
  @IsString()
  id?: string;
}
