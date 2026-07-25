import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MusicService } from './music.service';

@ApiTags('Music Playlist')
@ApiBearerAuth()
@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get('playlist')
  @ApiOperation({ summary: 'Lấy danh sách nhạc lãng mạn' })
  async getPlaylist() {
    const data = await this.musicService.getPlaylist();
    return { message: 'Lấy danh sách bài hát thành công', data };
  }
}
