import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TradeInProduct } from './trade-in-product.entity';

export enum TradeInQuoteStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('trade_in_quotes')
export class TradeInQuote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 40, unique: true })
  quote_number: string;

  @Column({ nullable: true })
  product_id: number | null;

  @ManyToOne(() => TradeInProduct, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: TradeInProduct | null;

  @Column()
  product_name: string;

  @Column({ type: 'json', nullable: true })
  pricing_path: any[] | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  final_price: string;

  @Column()
  customer_name: string;

  @Column({ nullable: true })
  customer_email: string | null;

  @Column({ length: 60 })
  customer_phone: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'contacted', 'accepted', 'completed', 'cancelled'],
    default: TradeInQuoteStatus.PENDING,
  })
  status: TradeInQuoteStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
