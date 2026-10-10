import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertAttempt } from '../alerts/alert-attempt.entity.js';
import { Zone } from '../zones/zone.entity.js';
import { EventsController } from './events.controller.js';
import { SafeZoneEvent } from './event.entity.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SafeZoneEvent, AlertAttempt, Zone])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
