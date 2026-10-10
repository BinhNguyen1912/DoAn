import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { AlertAttempt } from '../alerts/alert-attempt.entity.js';
import { Zone } from '../zones/zone.entity.js';
import type { CreateEventDto, EventListResponseDto, EventResponseDto } from './dto/event.dto.js';
import { SafeZoneEvent } from './event.entity.js';

const PG_UNIQUE_VIOLATION = '23505';

const toAttempt = (a: AlertAttempt) => ({ id: a.id, deviceId: a.deviceId, status: a.status, error: a.error, updatedAt: a.updatedAt });

const toResponse = (e: SafeZoneEvent): EventResponseDto => ({
  eventId: e.eventId,
  zoneId: e.zoneId,
  detectedAt: e.detectedAt,
  confidence: e.confidence,
  receivedAt: e.receivedAt,
  evidencePath: e.evidencePath,
  alertAttempts: (e.alertAttempts ?? []).map(toAttempt),
});

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(SafeZoneEvent) private readonly events: Repository<SafeZoneEvent>,
    @InjectRepository(Zone) private readonly zones: Repository<Zone>,
  ) {}

  /** Idempotent by eventId: a repeated POST returns the stored event with `created: false`. */
  async create(dto: CreateEventDto): Promise<{ event: EventResponseDto; created: boolean }> {
    const existing = await this.find(dto.eventId);
    if (existing) return { event: existing, created: false };

    if (!(await this.zones.existsBy({ id: dto.zoneId }))) {
      throw new UnprocessableEntityException(`Zone ${dto.zoneId} does not exist`);
    }
    try {
      await this.events.insert({ eventId: dto.eventId, zoneId: dto.zoneId, detectedAt: dto.detectedAt, confidence: dto.confidence, evidencePath: null });
    } catch (error) {
      // Two concurrent posts with the same eventId: the loser reads the winner's row.
      const code = error instanceof QueryFailedError ? (error.driverError as { code?: string }).code : undefined;
      if (code !== PG_UNIQUE_VIOLATION) throw error;
      return { event: (await this.find(dto.eventId))!, created: false };
    }
    return { event: (await this.find(dto.eventId))!, created: true };
  }

  private async find(eventId: string): Promise<EventResponseDto | null> {
    const row = await this.events.findOne({ where: { eventId }, relations: { alertAttempts: true } });
    return row ? toResponse(row) : null;
  }

  async list(limit: number, offset: number): Promise<EventListResponseDto> {
    const [rows, total] = await this.events.findAndCount({
      relations: { alertAttempts: true },
      order: { detectedAt: 'DESC', id: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items: rows.map(toResponse), total };
  }
}
