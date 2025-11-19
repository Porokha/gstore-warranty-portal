import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Warranty } from '../../warranties/entities/warranty.entity';
import { CaseStatusHistory } from './case-status-history.entity';
import { CasePayment } from '../../payments/entities/case-payment.entity';
import { CaseFile } from '../../files/entities/case-file.entity';

export enum CaseStatusLevel {
  OPENED = 1,
  INVESTIGATING = 2,
  PENDING = 3,
  COMPLETED = 4,
}

export enum ResultType {
  COVERED = 'covered',
  PAYABLE = 'payable',
  RETURNED = 'returned',
  REPLACEABLE = 'replaceable',
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('service_cases')
export class ServiceCase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  case_number: string; // e.g., SCN-000001

  @Column({ nullable: true })
  warranty_id: number;

  @Column()
  sku: string;

  @Column({ nullable: true })
  imei: string;

  @Column()
  serial_number: string;

  @Column()
  device_type: string;

  @Column()
  product_title: string;

  @Column()
  customer_name: string;

  @Column()
  customer_phone: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column({ nullable: true })
  order_id: number;

  @Column({ nullable: true })
  product_id: number;

  @Column()
  opened_at: Date;

  @Column({ nullable: true })
  closed_at: Date;

  @Column()
  deadline_at: Date;

  @Column({
    type: 'int',
    default: CaseStatusLevel.OPENED,
  })
  status_level: CaseStatusLevel;

  @Column({
    type: 'enum',
    enum: ResultType,
    nullable: true,
  })
  result_type: ResultType;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.NORMAL,
  })
  priority: Priority;

  @Column('json', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  assigned_technician_id: number;

  @Column()
  created_by: number;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Warranty, (warranty) => warranty.service_cases)
  @JoinColumn({ name: 'warranty_id' })
  warranty: Warranty;

  @ManyToOne(() => User, (user) => user.assigned_cases)
  @JoinColumn({ name: 'assigned_technician_id' })
  assigned_technician: User;

  @ManyToOne(() => User, (user) => user.created_cases)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @OneToMany(() => CaseStatusHistory, (history) => history.case_)
  status_history: CaseStatusHistory[];

  @OneToMany(() => CasePayment, (payment) => payment.case_)
  payments: CasePayment[];

  @OneToMany(() => CaseFile, (file) => file.case_)
  files: CaseFile[];
}

