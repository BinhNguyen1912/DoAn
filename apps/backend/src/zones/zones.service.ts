import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UpdateZoneDto, ZoneResponseDto } from './dto/zone.dto.js';
import { Zone } from './zone.entity.js';

const toResponse = (zone: Zone): ZoneResponseDto => ({ id: zone.id, name: zone.name, points: zone.points, updatedAt: zone.updatedAt });

@Injectable()
export class ZonesService {
  constructor(@InjectRepository(Zone) private readonly zones: Repository<Zone>) {}

  async list(): Promise<ZoneResponseDto[]> {
    return (await this.zones.find({ order: { id: 'ASC' } })).map(toResponse);
  }

  async get(id: number): Promise<ZoneResponseDto> {
    const zone = await this.zones.findOneBy({ id });
    if (!zone) throw new NotFoundException(`Zone ${id} not found`);
    return toResponse(zone);
  }

  async update(id: number, dto: UpdateZoneDto): Promise<ZoneResponseDto> {
    const zone = await this.zones.findOneBy({ id });
    if (!zone) throw new NotFoundException(`Zone ${id} not found`);
    zone.points = dto.points.map(({ x, y }) => ({ x, y }));
    if (dto.name !== undefined) zone.name = dto.name;
    return toResponse(await this.zones.save(zone));
  }
}
