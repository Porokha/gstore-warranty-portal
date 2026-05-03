import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PosWarrantyInboundEventStatus {
  RECEIVED = 'received',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('pos_warranty_inbound_events')
export class PosWarrantyInboundEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  event_id: string;

  @Column()
  event_type: string;

  @Column({ nullable: true })
  source: string | null;

  @Column({ nullable: true })
  woo_order_id: number | null;

  @Column({ nullable: true })
  analytics_order_id: number | null;

  @Column('longtext')
  payload: string;

  @Column({
    type: 'enum',
    enum: PosWarrantyInboundEventStatus,
    default: PosWarrantyInboundEventStatus.RECEIVED,
  })
  processing_status: PosWarrantyInboundEventStatus;

  @Column({ nullable: true })
  action_taken: string | null;

  @Column({ nullable: true })
  warranty_number: string | null;

  @Column('longtext', { nullable: true })
  external_response: string | null;

  @Column('text', { nullable: true })
  error_message: string | null;

  @Column({ type: 'datetime', nullable: true })
  processed_at: Date | null;

  @CreateDateColumn()
  received_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
