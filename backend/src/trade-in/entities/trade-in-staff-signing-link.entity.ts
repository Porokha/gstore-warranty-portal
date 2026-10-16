import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type StaffSigningPurpose = 'agreement' | 'saved';

@Entity('trade_in_staff_signing_links')
@Index(['user_id', 'purpose', 'quote_id'])
export class TradeInStaffSigningLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'char', length: 64, unique: true })
  token_hash: string;

  @Column({ type: 'varchar', length: 16 })
  purpose: StaffSigningPurpose;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  quote_id: number | null;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'datetime', nullable: true })
  used_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
