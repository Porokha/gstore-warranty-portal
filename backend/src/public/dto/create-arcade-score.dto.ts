import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { ArcadeGame } from '../entities/arcade-score.entity';

export class CreateArcadeScoreDto {
  @IsEnum(ArcadeGame)
  game: ArcadeGame;

  @IsString()
  @MaxLength(60)
  player_name: string;

  @IsInt()
  @Min(0)
  @Max(9999999)
  score: number;
}
