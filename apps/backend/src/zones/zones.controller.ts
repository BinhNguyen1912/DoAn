import { Body, Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UpdateZoneDto, ZoneResponseDto } from './dto/zone.dto.js';
import { ZonesService } from './zones.service.js';

@ApiTags('zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zones: ZonesService) {}

  @Get()
  @ApiOkResponse({ type: [ZoneResponseDto] })
  list(): Promise<ZoneResponseDto[]> {
    return this.zones.list();
  }

  @Get(':id')
  @ApiOkResponse({ type: ZoneResponseDto })
  get(@Param('id', ParseIntPipe) id: number): Promise<ZoneResponseDto> {
    return this.zones.get(id);
  }

  @Put(':id')
  @ApiOkResponse({ type: ZoneResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateZoneDto): Promise<ZoneResponseDto> {
    return this.zones.update(id, dto);
  }
}
