import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ServiceCase } from '../../cases/entities/service-case.entity';

@Entity('staff_notifications')
export class StaffNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recipient_user_id: number;

  @Column({ nullable: true })
  case_id: number | null;

  @Column({ length: 64, nullable: true })
  case_number: string | null;

  @Column({ length: 64 })
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ nullable: true })
  read_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_user_id' })
  recipient: User;

  @ManyToOne(() => ServiceCase, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case_: ServiceCase | null;
}
