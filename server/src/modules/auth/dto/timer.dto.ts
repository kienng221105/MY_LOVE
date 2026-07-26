import { ApiProperty } from '@nestjs/swagger';

export class TimerDto {
  @ApiProperty({
    description: 'Thời điểm bắt đầu chính thức (UTC ISO-8601)',
    example: '2026-07-26T07:16:00.000Z',
  })
  startAt: string;

  @ApiProperty({
    description: 'Giờ hiện tại của server (UTC ISO-8601) để bù lệch đồng hồ thiết bị',
    example: '2026-07-26T07:16:03.210Z',
  })
  serverNow: string;

  @ApiProperty({
    description: 'Phiên bản monotonic tăng mỗi lần reset',
    example: 12,
  })
  version: number;

  @ApiProperty({
    description: 'Thời điểm lần cuối startAt được cập nhật',
    example: '2026-07-26T07:16:00.000Z',
  })
  updatedAt: string;
}