import {
  CanActivate,
  Controller,
  ExecutionContext,
  Injectable,
  INestApplication,
  Post,
  UseGuards,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Throttle, ThrottlerModule } from '@nestjs/throttler';
import type { Request } from 'express';
import { AssistantRateLimitGuard } from './assistant-rate-limit.guard';
import type { Server } from 'node:http';

type RequestWithTestUser = Request & {
  user?: {
    id: string;
  };
};

@Injectable()
class TestUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTestUser>();

    request.user = {
      id: request.header('x-user-id') ?? 'anonymous',
    };

    return true;
  }
}

@Controller('assistant')
class TestAssistantController {
  @Post('chat')
  @UseGuards(TestUserGuard, AssistantRateLimitGuard)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  chat() {
    return { ok: true };
  }
}

describe('AssistantRateLimitGuard integration', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60_000,
            limit: 10,
          },
        ]),
      ],
      controllers: [TestAssistantController],
      providers: [TestUserGuard, AssistantRateLimitGuard],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');

    const server = app.getHttpServer() as Server;
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not start.');
    }

    baseUrl = `http://127.0.0.1:${address.port}/assistant/chat`;
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 429 after the limit and isolates users on the same IP', async () => {
    const sendMessage = (userId: string) =>
      fetch(baseUrl, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
      });

    // User 1 can send two requests, but the third is rate-limited.
    expect((await sendMessage('user-1')).status).toBe(201);
    expect((await sendMessage('user-1')).status).toBe(201);
    expect((await sendMessage('user-1')).status).toBe(429);

    // User 2 shares the same IP but has an independent limit.
    expect((await sendMessage('user-2')).status).toBe(201);
    expect((await sendMessage('user-2')).status).toBe(201);
    expect((await sendMessage('user-2')).status).toBe(429);
  });
});
