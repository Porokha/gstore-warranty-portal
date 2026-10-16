import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('trade_in_staff_signature_profiles')
@Index(['user_id', 'title'], { unique: true })
export class TradeInStaffSignatureProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ length: 80 })
  title: string;

  @Column({ type: 'mediumblob', select: false })
  signature: Buffer;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
