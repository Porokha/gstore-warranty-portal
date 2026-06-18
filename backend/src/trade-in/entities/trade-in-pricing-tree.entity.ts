import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TradeInProduct } from './trade-in-product.entity';

@Entity('trade_in_pricing_trees')
export class TradeInPricingTree {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  product_id: number;

  @OneToOne(() => TradeInProduct, (product) => product.pricing_tree, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: TradeInProduct;

  @Column({ type: 'json' })
  tree_json: any[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  max_price: string;

  @Column({ type: 'datetime', nullable: true })
  source_updated_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
