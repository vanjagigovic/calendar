import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiPropertyOptional({
    example: 'Full Stack Developer',
    nullable: true,
  })
  profession!: string | null;

  @ApiProperty({ type: [String], example: ['technology', 'AI'] })
  interests!: string[];

  @ApiProperty({
    enum: ['concise', 'balanced', 'detailed'],
    example: 'balanced',
  })
  responseStyle!: string;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  createdAt!: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updatedAt!: Date | null;
}
