import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ReactionsService } from './reactions.service';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';

@ApiTags('Reactions')
@Public()
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post('toggle')
  @ApiOperation({
    summary:
      'Bật/tắt/đổi cảm xúc trên thư yêu hoặc nhật ký. Cùng emoji → bỏ. Emoji khác → đổi.',
  })
  async toggle(@Body() dto: ToggleReactionDto) {
    const data = await this.reactionsService.toggleReaction(dto);
    return { message: 'Đã cập nhật cảm xúc', data };
  }

  @Get(':targetType/:targetId')
  @ApiOperation({ summary: 'Lấy tổng hợp cảm xúc của một mục tiêu' })
  async getSummary(
    @Param('targetType') targetType: 'LETTER' | 'DIARY',
    @Param('targetId') targetId: string,
    @Query('me') me: 'Kien' | 'Love' = 'Kien'
  ) {
    const data = await this.reactionsService.summarize(targetType, targetId, me);
    return { message: 'Lấy tổng hợp cảm xúc thành công', data };
  }
}