import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class CreateDiaryDto {
  @ApiProperty({ description: 'Tiêu đề nhật ký', example: 'Một buổi tối bình yên' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Nội dung trang nhật ký', example: 'Hôm nay chúng mình cùng xem phim...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Tâm trạng (happy, romantic, cozy, miss_you)', example: 'cozy' })
  @IsString()
  @IsNotEmpty()
  mood: string;

  @ApiProperty({ description: 'Thời tiết (sunny, rainy, starry, cloudy)', example: 'starry' })
  @IsString()
  @IsNotEmpty()
  weather: string;

  @ApiPropertyOptional({ description: 'Ngày bài viết', example: '2026-07-26' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Tác giả (Kien / Love)', example: 'Kien' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Danh sách ảnh đính kèm', example: ['/nhat_ky.png'] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Trạng thái bản nháp', example: false })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiPropertyOptional({ description: 'ID bài viết', example: 'diary_123' })
  @IsOptional()
  @IsString()
  id?: string;
}
