import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZonesController } from './zones.controller.js';
import { ZonesService } from './zones.service.js';
import { Zone } from './zone.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Zone])],
  controllers: [ZonesController],
  providers: [ZonesService],
})
export class ZonesModule {}
