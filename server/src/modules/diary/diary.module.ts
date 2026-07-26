import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { ReactionsModule } from '../reactions/reactions.module';

@Module({
  imports: [ReactionsModule],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {}