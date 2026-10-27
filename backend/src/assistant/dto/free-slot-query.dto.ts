import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, Matches, Max, Min } from 'class-validator';

export const MIN_FREE_SLOT_MINUTES = 5;
export const MAX_FREE_SLOT_MINUTES = 1440;
export const MAX_FREE_SLOT_WINDOW_DAYS = 31;

const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T/;

export class FreeSlotQueryDto {
  @ApiProperty({
    example: '2026-08-26T08:00:00.000Z',
    description:
      'Inclusive window start instant in ISO 8601 date-time format. Offset values are accepted.',
  })
  @Matches(DATE_TIME_PATTERN, {
    message: 'windowStartUtc must be an ISO 8601 date-time',
  })
  @IsDateString()
  windowStartUtc!: string;

  @ApiProperty({
    example: '2026-08-26T18:00:00.000Z',
    description:
      'Exclusive window end instant in ISO 8601 date-time format. Must be after the start and at most 31 days later.',
  })
  @Matches(DATE_TIME_PATTERN, {
    message: 'windowEndUtc must be an ISO 8601 date-time',
  })
  @IsDateString()
  windowEndUtc!: string;

  @ApiProperty({
    example: 30,
    minimum: MIN_FREE_SLOT_MINUTES,
    maximum: MAX_FREE_SLOT_MINUTES,
    description: 'Required length of the free interval in whole minutes.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_FREE_SLOT_MINUTES)
  @Max(MAX_FREE_SLOT_MINUTES)
  durationMinutes!: number;
}
