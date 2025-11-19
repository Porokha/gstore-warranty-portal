import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ServiceCase } from '../../cases/entities/service-case.entity';

export enum CreatedSource {
  AUTO_WOO = 'auto_woo',
  MANUAL = 'manual',
}

@Entity('warranties')
export class Warranty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  warranty_id: string; // e.g., WP-1234-4321, MN-SKU123

  @Column({ nullable: true })
  order_id: number;

  @Column({ nullable: true })
  product_id: number;

  @Column({ nullable: true })
  order_line_index: number;

  @Column()
  sku: string;

  @Column({ nullable: true })
  imei: string;

  @Column()
  serial_number: string;

  @Column({ default: 'Laptop' })
  device_type: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  customer_name: string;

  @Column()
  customer_last_name: string;

  @Column()
  customer_phone: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column()
  purchase_date: Date;

  @Column()
  warranty_start: Date;

  @Column()
  warranty_end: Date;

  @Column({ default: 0 })
  extended_days: number;

  @Column({
    type: 'enum',
    enum: CreatedSource,
    default: CreatedSource.MANUAL,
  })
  created_source: CreatedSource;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => ServiceCase, (case_) => case_.warranty)
  service_cases: ServiceCase[];
}

