import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';

export const DIARY_MOODS = ['happy', 'romantic', 'cozy', 'miss_you'] as const;
export const DIARY_WEATHERS = ['sunny', 'rainy', 'starry', 'cloudy'] as const;
export const DIARY_AUTHORS = ['Kien', 'Love'] as const;

export class CreateDiaryDto {
  @ApiPropertyOptional({
    description: 'Tiêu đề nhật ký (tùy chọn)',
    example: 'Một buổi tối bình yên',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Nội dung trang nhật ký',
    example: 'Hôm nay chúng mình cùng xem phim...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Tâm trạng (happy, romantic, cozy, miss_you)',
    example: 'cozy',
  })
  @IsString()
  @IsIn(DIARY_MOODS as readonly string[])
  mood: string;

  @ApiProperty({
    description: 'Thời tiết (sunny, rainy, starry, cloudy)',
    example: 'starry',
  })
  @IsString()
  @IsIn(DIARY_WEATHERS as readonly string[])
  weather: string;

  @ApiPropertyOptional({
    description: 'Ngày bài viết (ISO-8601)',
    example: '2026-07-26T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Tác giả (Kien / Love)', example: 'Kien' })
  @IsOptional()
  @IsIn(DIARY_AUTHORS as readonly string[])
  author?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ảnh đính kèm (URL Cloudinary)',
    example: ['https://res.cloudinary.com/...'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
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