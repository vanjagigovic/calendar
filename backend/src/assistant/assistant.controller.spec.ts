import { describe, expect, it, jest } from '@jest/globals';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssistantController } from './assistant.controller';
import type { AssistantService } from './assistant.service';

describe('AssistantController', () => {
  const getDayEvents = jest.fn<(...args: never[]) => Promise<unknown>>();
  const findFreeSlot = jest.fn<(...args: never[]) => Promise<unknown>>();
  const controller = new AssistantController({
    getDayEvents,
    findFreeSlot,
  } as unknown as AssistantService);
  const user = { id: 'user-1' };

  it('is protected by JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AssistantController,
    ) as unknown[];
    expect(guards).toContain(JwtAuthGuard);
  });

  it('passes the authenticated user id for day events', async () => {
    getDayEvents.mockResolvedValue([]);
    const query = { date: '2026-08-26', timeZone: 'UTC' };
    await controller.getDayEvents(query, user);
    expect(getDayEvents).toHaveBeenCalledWith('user-1', query);
  });

  it('passes the authenticated user id for free slots', async () => {
    findFreeSlot.mockResolvedValue({ freeInterval: null });
    const query = {
      windowStartUtc: '2026-08-26T08:00:00.000Z',
      windowEndUtc: '2026-08-26T18:00:00.000Z',
      durationMinutes: 30,
    };
    await controller.findFreeSlot(query, user);
    expect(findFreeSlot).toHaveBeenCalledWith('user-1', query);
  });
});
