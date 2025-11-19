import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum SmsStatus {
  SENT = 'sent',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity('sms_logs')
export class SmsLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phone: string;

  @Column()
  template_key: string;

  @Column('json', { nullable: true })
  payload_json: Record<string, any>; // variables used in template

  @Column({
    type: 'enum',
    enum: ['sent', 'failed', 'skipped'],
  })
  status: SmsStatus;

  @Column('text', { nullable: true })
  api_response: string;

  @CreateDateColumn()
  created_at: Date;
}

