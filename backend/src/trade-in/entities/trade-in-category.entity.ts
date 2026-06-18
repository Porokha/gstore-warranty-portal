import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('trade_in_categories')
export class TradeInCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120, unique: true })
  slug: string;

  @Column()
  label: string;

  @Column({ type: 'mediumtext', nullable: true })
  icon_svg: string | null;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'boolean', default: false })
  coming_soon: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
