import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const REACTION_TYPES = ['HEART', 'CRY', 'LAUGH', 'ANGRY', 'HUG'] as const;
export type ReactionTypeValue = (typeof REACTION_TYPES)[number];

export const REACTION_TARGETS = ['LETTER', 'DIARY'] as const;
export type ReactionTargetValue = (typeof REACTION_TARGETS)[number];

export class ToggleReactionDto {
  @ApiProperty({
    description: 'Loại cảm xúc (HEART ❤️, CRY 😢, LAUGH 😂, ANGRY 😡, HUG 🤗)',
    example: 'HEART',
  })
  @IsString()
  @IsIn(REACTION_TYPES as readonly string[])
  type: ReactionTypeValue;

  @ApiProperty({
    description: 'Loại mục tiêu (LETTER = thư yêu, DIARY = nhật ký)',
    example: 'LETTER',
  })
  @IsString()
  @IsIn(REACTION_TARGETS as readonly string[])
  targetType: ReactionTargetValue;

  @ApiProperty({
    description: 'ID mục tiêu (id lá thư hoặc id bài nhật ký)',
    example: 'clxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'Ai đang thả cảm xúc (Kien | Love)',
    example: 'Kien',
  })
  @IsString()
  @IsIn(['Kien', 'Love'])
  reactionBy: 'Kien' | 'Love';
}