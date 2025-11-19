import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceCase, CaseStatusLevel, ResultType } from './service-case.entity';
import { User } from '../../users/entities/user.entity';

@Entity('case_status_history')
export class CaseStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  case_id: number;

  @Column()
  changed_by: number;

  @Column({ type: 'int', nullable: true })
  previous_status_level: CaseStatusLevel;

  @Column({ type: 'int' })
  new_status_level: CaseStatusLevel;

  @Column({
    type: 'enum',
    enum: ResultType,
    nullable: true,
  })
  previous_result: ResultType;

  @Column({
    type: 'enum',
    enum: ResultType,
    nullable: true,
  })
  new_result: ResultType;

  @Column('text', { nullable: true })
  note_public: string;

  @Column('text', { nullable: true })
  note_private: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => ServiceCase, (case_) => case_.status_history)
  @JoinColumn({ name: 'case_id' })
  case_: ServiceCase;

  @ManyToOne(() => User, (user) => user.status_changes)
  @JoinColumn({ name: 'changed_by' })
  changed_by_user: User;
}

