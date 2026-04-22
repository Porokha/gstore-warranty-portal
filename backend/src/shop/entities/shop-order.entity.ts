import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ShopOrderStatus {
  DRAFT = 'draft',
  NEW = 'new',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('shop_orders')
export class ShopOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  order_number: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'new', 'processing', 'completed', 'cancelled'],
    default: 'new',
  })
  status: ShopOrderStatus;

  @Column()
  customer_name: string;

  @Column({ nullable: true })
  customer_last_name: string;

  @Column()
  customer_phone: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column({ nullable: true })
  heard_about: string | null;

  @Column({ default: false })
  has_partner_warranty: boolean;

  @Column({ nullable: true })
  partner_warranty_id: string | null;

  @Column({ type: 'json' })
  items_json: Array<{
    product_id: number;
    title: string;
    mode: 'product' | 'service';
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal_amount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  service_amount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount: string;

  @Column({ default: 'GEL' })
  currency: string;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ type: 'text', nullable: true })
  customer_note: string;

  @Column({ type: 'text', nullable: true })
  admin_note: string;

  @Column({ default: 'prototype_checkout' })
  source: string;

  @Column({ type: 'datetime', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
