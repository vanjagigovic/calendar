import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { EventsService } from '../events/events.service';
import { DayEventsQueryDto } from './dto/day-events-query.dto';
import {
  FreeSlotQueryDto,
  MAX_FREE_SLOT_WINDOW_DAYS,
} from './dto/free-slot-query.dto';
import { FreeSlotResponseDto } from './dto/free-slot-response.dto';

export interface TimeInterval {
  startMs: number;
  endMs: number;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/**
 * Finds the first gap of at least `durationMinutes` inside the half-open window.
 * Busy intervals are clipped to the window, sorted, and merged when they
 * overlap or touch.
 */
export function findFirstFreeInterval(
  window: TimeInterval,
  busyIntervals: TimeInterval[],
  durationMinutes: number,
): TimeInterval | null {
  const requiredMs = durationMinutes * MINUTE_MS;

  const clipped = busyIntervals
    .map((interval) => ({
      startMs: Math.max(interval.startMs, window.startMs),
      endMs: Math.min(interval.endMs, window.endMs),
    }))
    .filter((interval) => interval.endMs > interval.startMs)
    .sort((left, right) => left.startMs - right.startMs);

  const merged: TimeInterval[] = [];
  for (const interval of clipped) {
    const last = merged[merged.length - 1];
    if (last && interval.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, interval.endMs);
    } else {
      merged.push({ ...interval });
    }
  }

  let cursorMs = window.startMs;
  for (const busy of merged) {
    if (busy.startMs - cursorMs >= requiredMs) {
      return { startMs: cursorMs, endMs: busy.startMs };
    }
    cursorMs = busy.endMs;
  }

  return window.endMs - cursorMs >= requiredMs
    ? { startMs: cursorMs, endMs: window.endMs }
    : null;
}

@Injectable()
export class AssistantService {
  constructor(private readonly eventsService: EventsService) {}

  getDayEvents(userId: string, query: DayEventsQueryDto) {
    const localStart = DateTime.fromISO(query.date, {
      zone: query.timeZone,
    }).startOf('day');
    // Calendar-day arithmetic, so 23- and 25-hour days follow the zone rules.
    const localEnd = localStart.plus({ days: 1 }).startOf('day');

    return this.eventsService.findAll(userId, {
      rangeStartUtc: localStart.toUTC().toISO() as string,
      rangeEndUtc: localEnd.toUTC().toISO() as string,
      viewTimeZone: query.timeZone,
    });
  }

  async findFreeSlot(
    userId: string,
    query: FreeSlotQueryDto,
  ): Promise<FreeSlotResponseDto> {
    const start = DateTime.fromISO(query.windowStartUtc, { zone: 'utc' });
    const end = DateTime.fromISO(query.windowEndUtc, { zone: 'utc' });

    if (!start.isValid || !end.isValid) {
      throw new BadRequestException('Invalid window timestamps');
    }

    if (end <= start) {
      throw new BadRequestException(
        'windowEndUtc must be after windowStartUtc',
      );
    }

    if (
      end.toMillis() - start.toMillis() >
      MAX_FREE_SLOT_WINDOW_DAYS * DAY_MS
    ) {
      throw new BadRequestException(
        `The window must not be longer than ${MAX_FREE_SLOT_WINDOW_DAYS} days`,
      );
    }

    const occurrences = await this.eventsService.findAll(userId, {
      rangeStartUtc: start.toUTC().toISO(),
      rangeEndUtc: end.toUTC().toISO(),
    });

    const gap = findFirstFreeInterval(
      { startMs: start.toMillis(), endMs: end.toMillis() },
      occurrences.map((occurrence) => ({
        startMs: new Date(occurrence.startUtc).getTime(),
        endMs: new Date(occurrence.endUtc).getTime(),
      })),
      query.durationMinutes,
    );

    return {
      freeInterval: gap
        ? {
            startUtc: new Date(gap.startMs).toISOString(),
            endUtc: new Date(gap.endMs).toISOString(),
          }
        : null,
    };
  }
}
