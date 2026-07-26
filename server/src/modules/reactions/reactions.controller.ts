import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ReactionsService } from './reactions.service';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';
import { ReactionTargetValue } from './dto/toggle-reaction.dto';

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

  @Get('summaries')
  @ApiOperation({
    summary: 'Lấy reactions cho nhiều target cùng lúc (dùng polling batch)',
  })
  async listSummaries(
    @Query('targetType') targetType: ReactionTargetValue,
    @Query('ids') idsCsv: string,
    @Query('me') me: 'Kien' | 'Love' = 'Kien'
  ) {
    if (!targetType || (targetType !== 'LETTER' && targetType !== 'DIARY')) {
      throw new BadRequestException('targetType phải là LETTER hoặc DIARY');
    }
    const ids = (idsCsv || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100); // giới hạn 100 ids / request để tránh spam
    const data = await this.reactionsService.listForTargets(
      targetType,
      ids,
      me
    );
    return { message: 'Lấy danh sách cảm xúc thành công', data };
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