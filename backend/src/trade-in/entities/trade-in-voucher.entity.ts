import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('trade_in_vouchers')
export class TradeInVoucher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  quote_id: number;

  @Column({ type: 'char', length: 8, unique: true })
  code: string;

  @Column({ type: 'char', length: 43, unique: true })
  public_token: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'datetime', nullable: true })
  redeemed_at: Date | null;

  @Column({ nullable: true })
  redeemed_by_user_id: number | null;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  sms_status: string;

  @Column({ type: 'int', default: 0 })
  sms_attempt_count: number;

  @Column({ type: 'datetime', nullable: true })
  sms_last_attempt_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
