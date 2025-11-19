import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceCase } from '../../cases/entities/service-case.entity';
import { User } from '../../users/entities/user.entity';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  OTHER = 'other',
}

@Entity('case_files')
export class CaseFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  case_id: number;

  @Column()
  file_url: string;

  @Column({
    type: 'enum',
    enum: FileType,
  })
  file_type: FileType;

  @Column()
  uploaded_by: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => ServiceCase, (case_) => case_.files)
  @JoinColumn({ name: 'case_id' })
  case_: ServiceCase;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploaded_by_user: User;
}

