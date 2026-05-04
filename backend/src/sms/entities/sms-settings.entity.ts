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

  @Column({ nullable: true })
  template_warranty_created_key: string;

  @Column({ default: true })
  send_on_case_opened: boolean;

  @Column({ nullable: true })
  template_case_opened_key: string;

  @Column({ default: true })
  send_on_status_change: boolean;

  @Column({ nullable: true })
  template_status_change_key: string;

  @Column({ default: true })
  send_on_offer_created: boolean;

  @Column({ nullable: true })
  template_offer_created_key: string;

  @Column({ default: true })
  send_on_payment_confirmed: boolean;

  @Column({ nullable: true })
  template_payment_confirmed_key: string;

  @Column({ default: true })
  send_on_case_completed: boolean;

  @Column({ nullable: true })
  template_case_completed_key: string;

  @Column({ default: true })
  send_on_sla_due: boolean;

  @Column({ nullable: true })
  template_sla_due_key: string;

  @Column({ default: true })
  send_on_sla_stalled: boolean;

  @Column({ nullable: true })
  template_sla_stalled_key: string;

  @Column({ default: true })
  send_on_sla_deadline_1day: boolean;

  @Column({ nullable: true })
  template_sla_deadline_1day_key: string;

  @Column({ nullable: true })
  updated_by: number;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: User;
}
