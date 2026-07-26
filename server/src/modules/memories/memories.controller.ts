import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MemoriesService } from './memories.service';
import { CreateMemoryDto } from './dto/create-memory.dto';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Memories & Journey')
@Public()
@Controller('memories')
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các cột mốc hành trình' })
  async getMemories() {
    const data = await this.memoriesService.getMemories();
    return { message: 'Lấy hành trình thành công', data };
  }

  @Post()
  @ApiOperation({ summary: 'Thêm cột mốc hành trình mới' })
  async addMemory(@Body() dto: CreateMemoryDto) {
    const data = await this.memoriesService.addMemory(dto);
    return { message: 'Thêm cột mốc mới thành công', data };
  }
}
