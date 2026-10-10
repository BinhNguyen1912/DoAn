import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';

export class ZonePointDto {
  @ApiProperty({ minimum: 0, maximum: 1, description: 'Fraction of image width' })
  @IsNumber()
  @Min(0)
  @Max(1)
  x!: number;

  @ApiProperty({ minimum: 0, maximum: 1, description: 'Fraction of image height' })
  @IsNumber()
  @Min(0)
  @Max(1)
  y!: number;
}

export class UpdateZoneDto {
  @ApiProperty({ required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiProperty({ type: [ZonePointDto], minItems: 3, maxItems: 64 })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(64)
  @ValidateNested({ each: true })
  @Type(() => ZonePointDto)
  points!: ZonePointDto[];
}

export class ZoneResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ type: [ZonePointDto] }) points!: ZonePointDto[];
  @ApiProperty() updatedAt!: Date;
}
