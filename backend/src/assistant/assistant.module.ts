import { Module } from '@nestjs/common';
import { EventsModule } from '../events/event.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [EventsModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
