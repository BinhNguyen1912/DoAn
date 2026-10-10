import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigService } from '../config/app-config.service.js';
import type { DeviceResponseDto } from './dto/device.dto.js';
import { Device } from './device.entity.js';

/** A device is online while its last heartbeat is newer than this many heartbeat intervals. */
const MISSED_BEATS_BEFORE_OFFLINE = 3;

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    private readonly config: AppConfigService,
  ) {}

  private toResponse(device: Device, now = Date.now()): DeviceResponseDto {
    const windowMs = this.config.get('DEVICE_HEARTBEAT_INTERVAL_MS') * MISSED_BEATS_BEFORE_OFFLINE;
    const online = device.lastSeenAt !== null && now - device.lastSeenAt.getTime() <= windowMs;
    return { id: device.id, name: device.name, status: online ? 'online' : 'offline', lastSeenAt: device.lastSeenAt };
  }

  async list(): Promise<DeviceResponseDto[]> {
    const now = Date.now();
    return (await this.devices.find({ order: { id: 'ASC' } })).map((device) => this.toResponse(device, now));
  }

  async heartbeat(id: number): Promise<DeviceResponseDto> {
    const device = await this.devices.findOneBy({ id });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    device.lastSeenAt = new Date();
    return this.toResponse(await this.devices.save(device));
  }
}
