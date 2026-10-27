import { ApiProperty } from '@nestjs/swagger';

export class FreeIntervalDto {
  @ApiProperty({ example: '2026-08-26T10:00:00.000Z' })
  startUtc!: string;

  @ApiProperty({ example: '2026-08-26T12:30:00.000Z' })
  endUtc!: string;
}

export class FreeSlotResponseDto {
  @ApiProperty({
    type: FreeIntervalDto,
    nullable: true,
    description:
      'First continuous free gap that is at least the requested duration, or null when none exists.',
  })
  freeInterval!: FreeIntervalDto | null;
}
