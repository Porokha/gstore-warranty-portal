import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  action: string; // e.g., case_status_change, warranty_extended, sms_template_updated

  @Column('json', { nullable: true })
  payload_json: Record<string, any>; // detail of change

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.audit_logs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

