import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface ZonePoint {
  /** Normalized horizontal position, 0..1 of the image width. */
  x: number;
  /** Normalized vertical position, 0..1 of the image height. */
  y: number;
}

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /** Polygon vertices in normalized image coordinates. */
  @Column({ type: 'jsonb' })
  points!: ZonePoint[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
