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

export enum Language {
  EN = 'en',
  KA = 'ka',
}

@Entity('sms_templates')
export class SmsTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string; // e.g., sms.case_opened, sms.offer.payable

  @Column({
    type: 'enum',
    enum: ['en', 'ka'],
  })
  language: Language;

  @Column('text')
  template_text: string; // supports variables like {name}, {case_number}

  @Column({ nullable: true })
  updated_by: number;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: User;
}

