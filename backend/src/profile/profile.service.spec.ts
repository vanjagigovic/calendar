/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, expect, it, jest } from '@jest/globals';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  it('returns a default profile when none exists', async () => {
    const db = {
      select: jest.fn().mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
    } as any;

    const service = new ProfileService(db);
    const profile = await service.findOne('user-a');

    expect(profile).toEqual({
      userId: 'user-a',
      profession: null,
      interests: [],
      responseStyle: 'balanced',
      createdAt: null,
      updatedAt: null,
    });
  });

  it('updates only the fields supplied in the DTO', async () => {
    let savedValues: Record<string, unknown> | undefined;

    const updatedProfile = {
      userId: 'user-a',
      profession: 'Developer',
      interests: ['AI'],
      responseStyle: 'concise',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    const db = {
      insert: jest.fn().mockReturnValue({
        values: () => ({
          onConflictDoUpdate: (options: { set: Record<string, unknown> }) => {
            savedValues = options.set;

            return {
              returning: () => Promise.resolve([updatedProfile]),
            };
          },
        }),
      }),
    } as any;

    const service = new ProfileService(db);
    const profile = await service.update('user-a', {
      responseStyle: 'concise',
    });

    expect(savedValues).toHaveProperty('responseStyle', 'concise');
    expect(savedValues).toHaveProperty('updatedAt');
    expect(savedValues).not.toHaveProperty('profession');
    expect(savedValues).not.toHaveProperty('interests');
    expect(profile.responseStyle).toBe('concise');
  });
});
