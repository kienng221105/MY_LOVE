import { Module } from '@nestjs/common';
import { LettersService } from './letters.service';
import { LettersController } from './letters.controller';
import { ReactionsModule } from '../reactions/reactions.module';

@Module({
  imports: [ReactionsModule],
  controllers: [LettersController],
  providers: [LettersService],
})
export class LettersModule {}