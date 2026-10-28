import { describe, expect, it } from '@jest/globals';
import { getAssistantRateLimitKey } from './assistant-rate-limit.guard';

describe('getAssistantRateLimitKey', () => {
  it('uses the authenticated user id as the rate-limit key', () => {
    expect(
      getAssistantRateLimitKey({
        user: { id: 'user-1' },
        ip: '127.0.0.1',
      }),
    ).toBe('user:user-1');
  });

  it('isolates different authenticated users on the same IP', () => {
    const firstUser = getAssistantRateLimitKey({
      user: { id: 'user-1' },
      ip: '127.0.0.1',
    });

    const secondUser = getAssistantRateLimitKey({
      user: { id: 'user-2' },
      ip: '127.0.0.1',
    });

    expect(firstUser).not.toBe(secondUser);
  });

  it('uses the IP address when no user id is available', () => {
    expect(
      getAssistantRateLimitKey({
        ip: '127.0.0.1',
      }),
    ).toBe('ip:127.0.0.1');
  });
});
