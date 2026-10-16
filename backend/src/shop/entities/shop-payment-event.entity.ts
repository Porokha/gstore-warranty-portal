import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('shop_payment_events')
export class ShopPaymentEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attempt_id: number;

  @Column()
  shop_order_id: number;

  @Column()
  event_type: string;

  @Column({ nullable: true })
  status: string | null;

  @Column({ nullable: true })
  detail: string | null;

  @CreateDateColumn()
  created_at: Date;
}
