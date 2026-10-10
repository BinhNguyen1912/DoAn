import { ApiProperty } from '@nestjs/swagger';

export class DeviceResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['online', 'offline'] }) status!: 'online' | 'offline';
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) lastSeenAt!: Date | null;
}
