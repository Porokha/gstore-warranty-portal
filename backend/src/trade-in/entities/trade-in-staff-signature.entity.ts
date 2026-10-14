import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('trade_in_staff_signatures')
export class TradeInStaffSignature {
  @PrimaryColumn()
  user_id: number;

  @Column({ type: 'mediumblob', select: false })
  signature: Buffer;

  @UpdateDateColumn()
  updated_at: Date;
}
