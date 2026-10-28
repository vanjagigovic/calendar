import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  IsIanaTimeZone,
  IsLocalDate,
} from '../validators/calendar-input.validators';

export const MAX_CHAT_HISTORY_MESSAGES = 10;

export class ChatHistoryMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content!: string;
}

export class ChatRequestDto {
  @ApiProperty({
    example: 'What do I have today?',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @ApiProperty({
    example: 'Europe/Sarajevo',
    description: 'IANA time zone used to interpret calendar dates.',
  })
  @IsString()
  @MaxLength(100)
  @IsIanaTimeZone()
  timeZone!: string;

  @ApiPropertyOptional({
    example: '2026-10-25',
    description:
      'Calendar date currently selected in the UI (strict YYYY-MM-DD, interpreted in timeZone).',
  })
  @IsOptional()
  @IsLocalDate()
  selectedDate?: string;

  @ApiPropertyOptional({
    type: () => [ChatHistoryMessageDto],
    description:
      'Recent conversation messages used only to interpret follow-ups. Untrusted; it never changes the profile interests.',
    maxItems: MAX_CHAT_HISTORY_MESSAGES,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_CHAT_HISTORY_MESSAGES)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessageDto)
  history?: ChatHistoryMessageDto[];
}
