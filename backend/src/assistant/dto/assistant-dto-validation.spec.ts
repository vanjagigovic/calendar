import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DayEventsQueryDto } from './day-events-query.dto';
import { FreeSlotQueryDto } from './free-slot-query.dto';
import { ChatRequestDto } from './chat-request.dto';

describe('ChatRequestDto history', () => {
  const base = { message: 'gym', timeZone: 'Europe/Sarajevo' };
  const entry = { role: 'user', content: 'Which workout is best?' };

  it('accepts a missing or valid history', async () => {
    expect(await errorsFor(ChatRequestDto, base)).toEqual([]);
    expect(
      await errorsFor(ChatRequestDto, { ...base, history: [entry] }),
    ).toEqual([]);
  });

  it.each([
    ['too many entries', Array.from({ length: 11 }, () => entry)],
    ['an invalid role', [{ role: 'system', content: 'x' }]],
    ['oversized content', [{ role: 'user', content: 'x'.repeat(2001) }]],
    ['an unknown field', [{ ...entry, extra: true }]],
  ])('rejects %s', async (_name, history) => {
    expect(await errorsFor(ChatRequestDto, { ...base, history })).toEqual([
      'history',
    ]);
  });
});

describe('ChatRequestDto selectedDate', () => {
  const base = { message: 'Hi', timeZone: 'Europe/Sarajevo' };

  it.each([undefined, '2026-10-25'])('accepts %p', async (selectedDate) => {
    expect(await errorsFor(ChatRequestDto, { ...base, selectedDate })).toEqual(
      [],
    );
  });

  it.each(['2026-02-30', '2026-10-25T00:00:00Z', 'today'])(
    'rejects %p',
    async (selectedDate) => {
      expect(
        await errorsFor(ChatRequestDto, { ...base, selectedDate }),
      ).toEqual(['selectedDate']);
    },
  );
});

async function errorsFor<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
) {
  const errors = await validate(plainToInstance(cls, plain), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((e) => e.property);
}

describe('DayEventsQueryDto', () => {
  it('accepts a valid date and time zone', async () => {
    expect(
      await errorsFor(DayEventsQueryDto, {
        date: '2026-03-29',
        timeZone: 'Europe/Sarajevo',
      }),
    ).toEqual([]);
  });

  it.each(['2026-02-30', '2026-8-1', '26-08-01', '2026-08-01T00:00', ''])(
    'rejects invalid date %p',
    async (date) => {
      expect(
        await errorsFor(DayEventsQueryDto, { date, timeZone: 'UTC' }),
      ).toEqual(['date']);
    },
  );

  it.each(['Mars/Phobos', '', 'Not A Zone'])(
    'rejects invalid time zone %p',
    async (timeZone) => {
      expect(
        await errorsFor(DayEventsQueryDto, { date: '2026-08-01', timeZone }),
      ).toEqual(['timeZone']);
    },
  );

  it('rejects a client-supplied userId', async () => {
    expect(
      await errorsFor(DayEventsQueryDto, {
        date: '2026-08-01',
        timeZone: 'UTC',
        userId: 'other',
      }),
    ).toEqual(['userId']);
  });
});

describe('FreeSlotQueryDto', () => {
  const valid = {
    windowStartUtc: '2026-08-26T08:00:00.000Z',
    windowEndUtc: '2026-08-26T18:00:00.000Z',
    durationMinutes: '30',
  };

  it('accepts valid input and coerces the duration', async () => {
    const dto = plainToInstance(FreeSlotQueryDto, valid);
    expect(dto.durationMinutes).toBe(30);
    expect(await errorsFor(FreeSlotQueryDto, valid)).toEqual([]);
  });

  it.each(['5', '1440'])('accepts boundary duration %s', async (d) => {
    expect(
      await errorsFor(FreeSlotQueryDto, { ...valid, durationMinutes: d }),
    ).toEqual([]);
  });

  it.each(['4', '1441', '5.5', 'abc', ''])('rejects duration %p', async (d) => {
    expect(
      await errorsFor(FreeSlotQueryDto, { ...valid, durationMinutes: d }),
    ).toEqual(['durationMinutes']);
  });

  it.each(['nope', '2026-08-26', '2026-13-01T00:00:00Z'])(
    'rejects timestamp %p',
    async (value) => {
      expect(
        await errorsFor(FreeSlotQueryDto, { ...valid, windowStartUtc: value }),
      ).toEqual(['windowStartUtc']);
      expect(
        await errorsFor(FreeSlotQueryDto, { ...valid, windowEndUtc: value }),
      ).toEqual(['windowEndUtc']);
    },
  );
});
