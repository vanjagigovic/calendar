import { Module } from '@nestjs/common';
import { EventsModule } from '../events/event.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [EventsModule, ProfileModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
