import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('trade_in_settings')
export class TradeInSetting {
  @PrimaryColumn({ name: 'setting_key', length: 160 })
  key: string;

  @Column({ name: 'setting_value', type: 'text' })
  value: string;

  @UpdateDateColumn()
  updated_at: Date;
}
