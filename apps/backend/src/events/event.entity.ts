import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AlertAttempt } from '../alerts/alert-attempt.entity.js';
import { Zone } from '../zones/zone.entity.js';

@Entity('events')
export class SafeZoneEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Idempotency key chosen by the Edge AI service. */
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  eventId!: string;

  @Column({ type: 'int' })
  zoneId!: number;

  @ManyToOne(() => Zone, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'zone_id' })
  zone?: Zone;

  /** Set by the Edge AI service; the device clock is never trusted for this. */
  @Index()
  @Column({ type: 'timestamptz' })
  detectedAt!: Date;

  @Column({ type: 'real' })
  confidence!: number;

  /** Path of the optional evidence image, relative to EVIDENCE_DIR. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  evidencePath!: string | null;

  /** Server clock at insert time. */
  @CreateDateColumn({ type: 'timestamptz' })
  receivedAt!: Date;

  @OneToMany(() => AlertAttempt, (attempt) => attempt.event)
  alertAttempts?: AlertAttempt[];
}
