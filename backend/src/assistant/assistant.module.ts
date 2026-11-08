import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventsModule } from '../events/event.module';
import { ProfileModule } from '../profile/profile.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantRateLimitGuard } from './guards/assistant-rate-limit.guard';
import { KnowledgeRepository } from './knowledge/knowledge.repository';
import { KnowledgeService } from './knowledge/knowledge.service';

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
  providers: [
    AssistantService,
    AssistantRateLimitGuard,
    KnowledgeRepository,
    KnowledgeService,
  ],
})
export class AssistantModule {}
