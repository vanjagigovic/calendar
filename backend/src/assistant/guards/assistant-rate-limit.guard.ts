import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestWithUser = {
  user?: {
    id?: unknown;
  };
  ip?: string;
};

export function getAssistantRateLimitKey(request: RequestWithUser): string {
  const userId = request.user?.id;

  if (typeof userId === 'string' && userId.length > 0) {
    return `user:${userId}`;
  }

  return `ip:${request.ip ?? 'unknown'}`;
}

@Injectable()
export class AssistantRateLimitGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, any>): Promise<string> {
    return Promise.resolve(
      getAssistantRateLimitKey(request as RequestWithUser),
    );
  }
}
