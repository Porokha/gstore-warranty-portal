import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TradeInPricingTree } from './trade-in-pricing-tree.entity';

@Entity('trade_in_products')
export class TradeInProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true, unique: true })
  source_id: number | null;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ length: 160, nullable: true })
  brand: string | null;

  @Column({ length: 160, nullable: true })
  category: string | null;

  @Column({ length: 160, nullable: true })
  category2: string | null;

  @Column({ length: 1000, nullable: true })
  image_src: string | null;

  @Column({ type: 'text', nullable: true })
  search_tags: string | null;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @OneToOne(() => TradeInPricingTree, (pricingTree) => pricingTree.product)
  pricing_tree?: TradeInPricingTree;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
