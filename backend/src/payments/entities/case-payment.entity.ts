import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceCase, ResultType } from '../../cases/entities/service-case.entity';

export enum PaymentMethod {
  ONSITE = 'onsite',
  ONLINE = 'online',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum CodeStatus {
  ACTIVE = 'active',
  USED = 'used',
}

@Entity('case_payments')
export class CasePayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  case_id: number;

  @Column({
    type: 'enum',
    enum: ResultType,
  })
  offer_type: ResultType; // covered, payable, replaceable

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  offer_amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  payment_method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;

  @Column({ nullable: true })
  bog_transaction_id: string;

  @Column({ nullable: true })
  estimated_days_after_payment: number;

  @Column({ nullable: true })
  generated_code: string; // 6-digit code

  @Column({
    type: 'enum',
    enum: CodeStatus,
    nullable: true,
  })
  code_status: CodeStatus;

  @Column({ nullable: true })
  code_generated_at: Date;

  @Column({ nullable: true })
  code_used_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => ServiceCase, (case_) => case_.payments)
  @JoinColumn({ name: 'case_id' })
  case_: ServiceCase;
}

