import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventsModule } from '../events/event.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ProfileModule } from '../profile/profile.module';
import { AssistantRateLimitGuard } from './guards/assistant-rate-limit.guard';

@Module({
  imports: [
    EventsModule,
    ProfileModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantRateLimitGuard],
})
export class AssistantModule {}
