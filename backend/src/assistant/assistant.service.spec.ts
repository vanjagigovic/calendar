import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { EventsService } from '../events/events.service';
import type { EventOccurrenceResponseDto } from '../events/dto/event-response-dto';
import { AssistantService, findFirstFreeInterval } from './assistant.service';

const MIN = 60_000;
const t = (iso: string) => new Date(iso).getTime();
const iv = (start: string, end: string) => ({
  startMs: t(start),
  endMs: t(end),
});

describe('findFirstFreeInterval', () => {
  const window = iv('2026-08-26T08:00:00Z', '2026-08-26T18:00:00Z');

  it('returns the whole window when there are no events', () => {
    expect(findFirstFreeInterval(window, [], 60)).toEqual(window);
  });

  it('merges back-to-back events', () => {
    const busy = [
      iv('2026-08-26T09:00:00Z', '2026-08-26T10:00:00Z'),
      iv('2026-08-26T10:00:00Z', '2026-08-26T11:00:00Z'),
    ];
    expect(findFirstFreeInterval(window, busy, 60)).toEqual(
      iv('2026-08-26T08:00:00Z', '2026-08-26T09:00:00Z'),
    );
    expect(findFirstFreeInterval(window, busy, 90)).toEqual(
      iv('2026-08-26T11:00:00Z', '2026-08-26T18:00:00Z'),
    );
  });

  it('merges overlapping and unsorted events', () => {
    const busy = [
      iv('2026-08-26T10:00:00Z', '2026-08-26T12:00:00Z'),
      iv('2026-08-26T08:00:00Z', '2026-08-26T11:00:00Z'),
    ];
    expect(findFirstFreeInterval(window, busy, 30)).toEqual(
      iv('2026-08-26T12:00:00Z', '2026-08-26T18:00:00Z'),
    );
  });

  it('clips events crossing window boundaries', () => {
    const busy = [
      iv('2026-08-26T06:00:00Z', '2026-08-26T09:00:00Z'),
      iv('2026-08-26T17:00:00Z', '2026-08-26T20:00:00Z'),
    ];
    expect(findFirstFreeInterval(window, busy, 60)).toEqual(
      iv('2026-08-26T09:00:00Z', '2026-08-26T17:00:00Z'),
    );
  });

  it('accepts an exact fit', () => {
    const busy = [
      iv('2026-08-26T08:00:00Z', '2026-08-26T09:00:00Z'),
      iv('2026-08-26T09:30:00Z', '2026-08-26T18:00:00Z'),
    ];
    expect(findFirstFreeInterval(window, busy, 30)).toEqual(
      iv('2026-08-26T09:00:00Z', '2026-08-26T09:30:00Z'),
    );
  });

  it('returns null when no gap is long enough', () => {
    const busy = [
      iv('2026-08-26T08:00:00Z', '2026-08-26T09:00:00Z'),
      iv('2026-08-26T09:30:00Z', '2026-08-26T18:00:00Z'),
    ];
    expect(findFirstFreeInterval(window, busy, 31)).toBeNull();
    expect(
      findFirstFreeInterval(window, [window], (10 * 60 * MIN) / MIN),
    ).toBeNull();
  });
});

function occurrence(startUtc: string, endUtc: string, isAllDay = false) {
  return {
    startUtc,
    endUtc,
    isAllDay,
  } as unknown as EventOccurrenceResponseDto;
}

function createService(result: EventOccurrenceResponseDto[] = []) {
  const findAll = jest.fn<(...args: never[]) => Promise<unknown>>();
  findAll.mockResolvedValue(result);
  const service = new AssistantService({ findAll } as unknown as EventsService);
  return { service, findAll };
}

describe('AssistantService.getDayEvents', () => {
  it('converts a normal local day to UTC and passes the user id', async () => {
    const { service, findAll } = createService();
    await service.getDayEvents('user-1', {
      date: '2026-08-26',
      timeZone: 'Europe/Sarajevo',
    });
    expect(findAll).toHaveBeenCalledWith('user-1', {
      rangeStartUtc: '2026-08-25T22:00:00.000Z',
      rangeEndUtc: '2026-08-26T22:00:00.000Z',
      viewTimeZone: 'Europe/Sarajevo',
    });
  });

  it('handles a 23-hour spring-forward day', async () => {
    const { service, findAll } = createService();
    await service.getDayEvents('u', {
      date: '2026-03-08',
      timeZone: 'America/New_York',
    });
    const [, query] = findAll.mock.calls[0] as unknown as [
      string,
      { rangeStartUtc: string; rangeEndUtc: string },
    ];
    expect(query.rangeStartUtc).toBe('2026-03-08T05:00:00.000Z');
    expect(query.rangeEndUtc).toBe('2026-03-09T04:00:00.000Z');
  });

  it('handles a 25-hour fall-back day', async () => {
    const { service, findAll } = createService();
    await service.getDayEvents('u', {
      date: '2026-11-01',
      timeZone: 'America/New_York',
    });
    const [, query] = findAll.mock.calls[0] as unknown as [
      string,
      { rangeStartUtc: string; rangeEndUtc: string },
    ];
    expect(query.rangeStartUtc).toBe('2026-11-01T04:00:00.000Z');
    expect(query.rangeEndUtc).toBe('2026-11-02T05:00:00.000Z');
  });

  it('returns an empty day and recurring occurrences unchanged', async () => {
    const empty = createService([]);
    await expect(
      empty.service.getDayEvents('u', { date: '2026-08-26', timeZone: 'UTC' }),
    ).resolves.toEqual([]);

    const recurring = [
      {
        ...occurrence('2026-08-26T09:00:00.000Z', '2026-08-26T10:00:00.000Z'),
        occurrenceId: 'e1:2026-08-26',
        baseEventId: 'e1',
        repeatWeekly: true,
      },
    ] as unknown as EventOccurrenceResponseDto[];
    const { service } = createService(recurring);
    await expect(
      service.getDayEvents('u', { date: '2026-08-26', timeZone: 'UTC' }),
    ).resolves.toBe(recurring);
  });
});

describe('AssistantService.findFreeSlot', () => {
  const base = {
    windowStartUtc: '2026-08-26T08:00:00.000Z',
    windowEndUtc: '2026-08-26T18:00:00.000Z',
    durationMinutes: 60,
  };

  it('queries with the user id and returns UTC ISO strings', async () => {
    const { service, findAll } = createService([
      occurrence('2026-08-26T08:00:00.000Z', '2026-08-26T09:00:00.000Z'),
    ]);
    const result = await service.findFreeSlot('user-1', base);
    expect(findAll).toHaveBeenCalledWith('user-1', {
      rangeStartUtc: base.windowStartUtc,
      rangeEndUtc: base.windowEndUtc,
    });
    expect(result).toEqual({
      freeInterval: {
        startUtc: '2026-08-26T09:00:00.000Z',
        endUtc: '2026-08-26T18:00:00.000Z',
      },
    });
  });

  it('treats all-day events as busy', async () => {
    const { service } = createService([
      occurrence('2026-08-26T00:00:00.000Z', '2026-08-27T00:00:00.000Z', true),
    ]);
    await expect(service.findFreeSlot('u', base)).resolves.toEqual({
      freeInterval: null,
    });
  });

  it.each([
    ['invalid start', { windowStartUtc: '2026-13-45T00:00:00Z' }],
    ['end equal to start', { windowEndUtc: '2026-08-26T08:00:00.000Z' }],
    ['end before start', { windowEndUtc: '2026-08-26T07:00:00.000Z' }],
    ['window over 31 days', { windowEndUtc: '2026-09-26T08:00:01.000Z' }],
  ])('rejects %s', async (_name, override) => {
    const { service, findAll } = createService();
    await expect(
      service.findFreeSlot('u', { ...base, ...override }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('allows a window of exactly 31 days', async () => {
    const { service } = createService();
    await expect(
      service.findFreeSlot('u', {
        ...base,
        windowEndUtc: '2026-09-26T08:00:00.000Z',
      }),
    ).resolves.toEqual({
      freeInterval: {
        startUtc: base.windowStartUtc,
        endUtc: '2026-09-26T08:00:00.000Z',
      },
    });
  });
});
