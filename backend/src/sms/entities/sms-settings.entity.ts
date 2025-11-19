import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sms_settings')
export class SmsSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  global_enabled: boolean;

  @Column({ default: true })
  send_on_warranty_created: boolean;

  @Column({ default: true })
  send_on_case_opened: boolean;

  @Column({ default: true })
  send_on_status_change: boolean;

  @Column({ default: true })
  send_on_offer_created: boolean;

  @Column({ default: true })
  send_on_payment_confirmed: boolean;

  @Column({ default: true })
  send_on_case_completed: boolean;

  @Column({ default: true })
  send_on_sla_due: boolean;

  @Column({ default: true })
  send_on_sla_stalled: boolean;

  @Column({ default: true })
  send_on_sla_deadline_1day: boolean;

  @Column({ nullable: true })
  updated_by: number;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: User;
}

