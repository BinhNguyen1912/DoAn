import { Body, Controller, Get, HttpStatus, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequireToken, TokenGuard } from '../common/token.guard.js';
import { CreateEventDto, EventListResponseDto, EventResponseDto, ListEventsQueryDto } from './dto/event.dto.js';
import { EventsService } from './events.service.js';

@ApiTags('events')
@Controller('events')
@UseGuards(TokenGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  /** Edge AI posts each confirmed intrusion here. 201 when new, 200 when the eventId was already stored. */
  @Post()
  @RequireToken('edge')
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: EventResponseDto, description: 'Event stored' })
  @ApiOkResponse({ type: EventResponseDto, description: 'Duplicate eventId; stored event returned' })
  async create(@Body() dto: CreateEventDto, @Res({ passthrough: true }) res: Response): Promise<EventResponseDto> {
    const { event, created } = await this.events.create(dto);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return event;
  }

  @Get()
  @ApiOkResponse({ type: EventListResponseDto })
  list(@Query() query: ListEventsQueryDto): Promise<EventListResponseDto> {
    return this.events.list(query.limit, query.offset);
  }
}
