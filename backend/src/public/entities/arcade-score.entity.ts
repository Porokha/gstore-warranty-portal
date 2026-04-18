import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ArcadeGame {
  TETRIS = 'tetris',
  SNAKE = 'snake',
  INVADERS = 'invaders',
}

@Entity('arcade_scores')
export class ArcadeScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['tetris', 'snake', 'invaders'],
  })
  game: ArcadeGame;

  @Column({ length: 60 })
  player_name: string;

  @Column({ type: 'int', unsigned: true })
  score: number;

  @CreateDateColumn()
  created_at: Date;
}
