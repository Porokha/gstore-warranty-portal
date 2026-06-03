import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ShopDeviceCategory {
  SMARTPHONES = 'smartphones',
  LAPTOPS = 'laptops',
  ACCESSORIES = 'accessories',
}

export enum ShopPartCategory {
  BOARD = 'board',
  SCREEN = 'screen',
  SENSOR = 'sensor',
  BATTERY = 'battery',
  CAMERA = 'camera',
  SPEAKER = 'speaker',
  CHARGING = 'charging',
  ACCESSORY = 'accessory',
}

export enum ShopInventorySource {
  OEM = 'oem',
  THIRD_PARTY = 'third-party',
}

export enum ShopProductSupplier {
  MANUAL = 'manual',
  MOBILESENTRIX = 'mobilesentrix',
}

@Entity('shop_products')
export class ShopProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  brand: string | null;

  @Column({
    type: 'enum',
    enum: ['smartphones', 'laptops', 'accessories'],
    default: 'smartphones',
  })
  device_category: ShopDeviceCategory;

  @Column({
    type: 'enum',
    enum: ['board', 'screen', 'sensor', 'battery', 'camera', 'speaker', 'charging', 'accessory'],
    default: 'accessory',
  })
  part_category: ShopPartCategory;

  @Column({
    type: 'enum',
    enum: ['oem', 'third-party'],
    default: 'third-party',
  })
  inventory_source: ShopInventorySource;

  @Column({ nullable: true })
  issue_label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  price: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sale_price: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  service_price: string | null;

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({
    type: 'enum',
    enum: ['manual', 'mobilesentrix'],
    default: 'manual',
  })
  supplier: ShopProductSupplier;

  @Column({ nullable: true })
  supplier_product_id: string | null;

  @Column({ nullable: true })
  supplier_sku: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  supplier_price_usd: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  supplier_exchange_rate: string | null;

  @Column({ type: 'json', nullable: true })
  supplier_payload: Record<string, any> | null;

  @Column({ type: 'datetime', nullable: true })
  supplier_synced_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
