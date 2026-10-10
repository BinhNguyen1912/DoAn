import { Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequireToken, TokenGuard } from '../common/token.guard.js';
import { DevicesService } from './devices.service.js';
import { DeviceResponseDto } from './dto/device.dto.js';

@ApiTags('devices')
@Controller('devices')
@UseGuards(TokenGuard)
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @ApiOkResponse({ type: [DeviceResponseDto] })
  list(): Promise<DeviceResponseDto[]> {
    return this.devices.list();
  }

  /** Called by the ESP32 on a timer; proves the speaker is alive. */
  @Post(':id/heartbeat')
  @RequireToken('device')
  @ApiBearerAuth()
  @ApiOkResponse({ type: DeviceResponseDto })
  heartbeat(@Param('id', ParseIntPipe) id: number): Promise<DeviceResponseDto> {
    return this.devices.heartbeat(id);
  }
}
