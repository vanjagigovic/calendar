import { ApiProperty } from '@nestjs/swagger';
import { ASSISTANT_REASON_CODES } from '../assistant-response.types';
import type { AssistantResponse } from '../assistant-response.types';

export class AssistantResponseDto implements AssistantResponse {
  @ApiProperty({ example: 'You have a meeting at 10:00.' })
  answer!: string;

  @ApiProperty({
    type: [String],
    example: ['productivity-focus-time-policy#1'],
  })
  sourceIds!: string[];

  @ApiProperty({ example: false })
  needsReview!: boolean;

  @ApiProperty({ enum: ASSISTANT_REASON_CODES, example: 'supported' })
  reasonCode!: AssistantResponse['reasonCode'];
}
