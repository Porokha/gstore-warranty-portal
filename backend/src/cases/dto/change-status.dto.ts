import { IsInt, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { CaseStatusLevel, ResultType } from '../entities/service-case.entity';

export class ChangeStatusDto {
  @IsInt()
  @IsEnum(CaseStatusLevel)
  new_status_level: CaseStatusLevel;

  @IsOptional()
  @IsEnum(ResultType)
  result_type?: ResultType;

  @IsOptional()
  @IsString()
  note_public?: string;

  @IsOptional()
  @IsString()
  note_private?: string;
}

