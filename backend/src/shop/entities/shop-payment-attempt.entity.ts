import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('shop_payment_attempts')
export class ShopPaymentAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shop_order_id: number;

  @Column({ default: 'bog' })
  provider: string;

  @Column({ nullable: true })
  provider_order_id: string | null;

  @Column()
  idempotency_key: string;

  @Column()
  return_token_hash: string;

  @Column({ type: 'text', nullable: true })
  redirect_url: string | null;

  @Column({ default: 'created' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ default: 'GEL' })
  currency: string;

  @Column({ nullable: true })
  last_error: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
