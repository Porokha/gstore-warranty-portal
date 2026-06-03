import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MobileSentrixSyncJobStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('mobilesentrix_sync_jobs')
export class MobileSentrixSyncJob {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({
    type: 'enum',
    enum: MobileSentrixSyncJobStatus,
    default: MobileSentrixSyncJobStatus.QUEUED,
  })
  status: MobileSentrixSyncJobStatus;

  @Column({ default: 'catalog' })
  mode: string;

  @Column({ type: 'int', default: 100 })
  limit_per_page: number;

  @Column({ type: 'int', default: 0 })
  current_page: number;

  @Column({ type: 'int', default: 0 })
  total_pages: number;

  @Column({ type: 'int', default: 0 })
  total_items: number;

  @Column({ type: 'int', default: 0 })
  scanned: number;

  @Column({ type: 'int', default: 0 })
  created: number;

  @Column({ type: 'int', default: 0 })
  updated: number;

  @Column({ type: 'int', default: 0 })
  skipped: number;

  @Column({ type: 'int', default: 0 })
  failed: number;

  @Column('text', { nullable: true })
  last_message: string | null;

  @Column('text', { nullable: true })
  error_message: string | null;

  @Column({ type: 'datetime', nullable: true })
  started_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  finished_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
