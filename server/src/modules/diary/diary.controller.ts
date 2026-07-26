import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Love Diary')
@Public()
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các bài nhật ký kèm reactions' })
  async getEntries(@Query('me') me?: 'Kien' | 'Love') {
    const data = await this.diaryService.getEntries(me || 'Kien');
    return { message: 'Lấy nhật ký thành công', data };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bài nhật ký mới' })
  async createEntry(
    @Body() dto: CreateDiaryDto,
    @Query('me') me?: 'Kien' | 'Love'
  ) {
    const data = await this.diaryService.createEntry(dto, me || 'Kien');
    return { message: 'Lưu bài nhật ký thành công', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài nhật ký' })
  async deleteEntry(@Param('id') id: string) {
    await this.diaryService.deleteEntry(id);
    return { message: 'Đã xóa bài nhật ký', data: { success: true } };
  }
}