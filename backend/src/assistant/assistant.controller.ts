import { Controller, Get, Query, UseGuards, Body, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiErrorResponseDto } from '../common/dto/api-error-response-dto';
import { EventOccurrenceResponseDto } from '../events/dto/event-response-dto';
import { AssistantService } from './assistant.service';
import { DayEventsQueryDto } from './dto/day-events-query.dto';
import { FreeSlotQueryDto } from './dto/free-slot-query.dto';
import { FreeSlotResponseDto } from './dto/free-slot-response.dto';
import { ChatRequestDto } from './dto/chat-request.dto';
import { Throttle } from '@nestjs/throttler';
import { AssistantRateLimitGuard } from './guards/assistant-rate-limit.guard';

@ApiTags('Assistant')
@Controller('assistant')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  @UseGuards(AssistantRateLimitGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Send a free-text message to the assistant',
  })
  @ApiOkResponse({
    description: 'The assistant response.',
  })
  @ApiBadRequestResponse({
    description: 'The message is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  chat(@Body() dto: ChatRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.assistantService.chat(
      user.id,
      dto.message,
      dto.timeZone,
      dto.selectedDate,
      dto.history,
    );
  }

  @Get('day-events')
  @ApiOperation({
    summary: "List the authenticated user's events for a local calendar day",
    description:
      'Converts local midnight on the date and on the following date in the given time zone to UTC, so daylight-saving days are handled correctly.',
  })
  @ApiOkResponse({
    description: 'Event occurrences for the local day.',
    type: [EventOccurrenceResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'The date or time zone is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  getDayEvents(
    @Query() query: DayEventsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assistantService.getDayEvents(user.id, query);
  }

  @Get('free-slot')
  @ApiOperation({
    summary: 'Find the first free interval of a requested duration',
    description:
      'All events, including all-day events, are treated as busy time. The window may be at most 31 days long.',
  })
  @ApiOkResponse({
    description:
      'The first sufficiently long free gap, or null when none exists.',
    type: FreeSlotResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The window or duration is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  findFreeSlot(
    @Query() query: FreeSlotQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assistantService.findFreeSlot(user.id, query);
  }
}
