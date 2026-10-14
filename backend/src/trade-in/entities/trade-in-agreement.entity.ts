import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('trade_in_agreements')
export class TradeInAgreement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  quote_id: number;

  @Column({ type: 'json' })
  details: Record<string, unknown>;

  @Column({ type: 'mediumblob', nullable: true, select: false })
  customer_signature: Buffer | null;

  @Column({ type: 'mediumblob', nullable: true, select: false })
  representative_signature: Buffer | null;

  @Column({ nullable: true })
  representative_user_id: number | null;

  @Column({ type: 'char', length: 64, nullable: true, select: false })
  signing_token_hash: string | null;

  @Column({ type: 'datetime', nullable: true })
  signing_token_expires_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  customer_signed_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  finalized_at: Date | null;

  @Column({ nullable: true })
  finalized_by_user_id: number | null;

  @Column({ type: 'mediumblob', nullable: true, select: false })
  pdf_data: Buffer | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
