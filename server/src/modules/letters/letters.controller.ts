import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LettersService } from './letters.service';
import { CreateLetterDto } from './dto/create-letter.dto';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Love Letters')
@Public()
@Controller('letters')
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các lá thư yêu thương' })
  async getLetters() {
    const data = await this.lettersService.getLetters();
    return { message: 'Lấy danh sách lá thư thành công', data };
  }

  @Post()
  @ApiOperation({ summary: 'Gửi lá thư yêu thương mới' })
  async createLetter(@Body() dto: CreateLetterDto) {
    const data = await this.lettersService.createLetter(dto);
    return { message: 'Gửi lá thư thành công', data };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu lá thư đã đọc' })
  async markAsRead(@Param('id') id: string) {
    const data = await this.lettersService.markAsRead(id);
    return { message: 'Đã đánh dấu đã đọc', data };
  }
}
