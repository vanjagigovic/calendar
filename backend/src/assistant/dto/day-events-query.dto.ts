import { ApiProperty } from '@nestjs/swagger';
import {
  IsIanaTimeZone,
  IsLocalDate,
} from '../validators/calendar-input.validators';

export class DayEventsQueryDto {
  @ApiProperty({
    example: '2026-03-29',
    description: 'Local calendar date in strict YYYY-MM-DD format.',
  })
  @IsLocalDate()
  date!: string;

  @ApiProperty({
    example: 'Europe/Sarajevo',
    description: 'IANA time zone that defines the local day boundaries.',
  })
  @IsIanaTimeZone()
  timeZone!: string;
}
