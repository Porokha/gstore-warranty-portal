import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('case_pickups')
export class CasePickup {
  @PrimaryColumn({ type: 'int' })
  case_id: number;

  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  pin_hash: string | null;

  @Column({ type: 'datetime', nullable: true })
  issued_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'int', default: 0 })
  failed_attempts: number;

  @Column({ type: 'datetime', nullable: true })
  locked_until: Date | null;

  @Column({ type: 'datetime', nullable: true })
  collected_at: Date | null;

  @Column({ type: 'int', nullable: true })
  collected_by_user_id: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'collected_by_user_id' })
  collected_by_user: User | null;
}
