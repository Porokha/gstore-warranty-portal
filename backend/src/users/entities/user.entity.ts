import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ServiceCase } from '../../cases/entities/service-case.entity';
import { CaseStatusHistory } from '../../cases/entities/case-status-history.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

export enum UserRole {
  ADMIN = 'admin',
  TECHNICIAN = 'technician',
}

export enum LanguagePreference {
  EN = 'en',
  KA = 'ka',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'technician'],
    default: 'technician',
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ['en', 'ka'],
    default: 'en',
  })
  language_pref: LanguagePreference;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => ServiceCase, (case_) => case_.assigned_technician)
  assigned_cases: ServiceCase[];

  @OneToMany(() => ServiceCase, (case_) => case_.created_by_user)
  created_cases: ServiceCase[];

  @OneToMany(() => CaseStatusHistory, (history) => history.changed_by_user)
  status_changes: CaseStatusHistory[];

  @OneToMany(() => AuditLog, (log) => log.user)
  audit_logs: AuditLog[];
}

