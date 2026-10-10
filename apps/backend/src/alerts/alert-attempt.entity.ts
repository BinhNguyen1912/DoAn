import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Device } from '../devices/device.entity.js';
import { SafeZoneEvent } from '../events/event.entity.js';
import { ALERT_STATUSES, type AlertStatus } from './alert-status.js';

@Entity('alert_attempts')
export class AlertAttempt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  eventId!: number;

  @ManyToOne(() => SafeZoneEvent, (event) => event.alertAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event?: SafeZoneEvent;

  @Column({ type: 'int' })
  deviceId!: number;

  @ManyToOne(() => Device, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'device_id' })
  device?: Device;

  @Column({ type: 'enum', enum: ALERT_STATUSES, enumName: 'alert_status', default: 'sent' })
  status!: AlertStatus;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
