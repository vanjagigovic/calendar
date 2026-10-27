/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const RESPONSE_STYLES = ['concise', 'balanced', 'detailed'] as const;

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Full Stack Developer',
    nullable: true,
    maxLength: 100,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  profession?: string | null;

  @ApiPropertyOptional({
    example: ['technology', 'AI', 'travel'],
    type: [String],
    maxItems: 20,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({
    enum: RESPONSE_STYLES,
    example: 'balanced',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsIn(RESPONSE_STYLES)
  responseStyle?: (typeof RESPONSE_STYLES)[number];
}
