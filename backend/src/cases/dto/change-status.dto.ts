import { IsBoolean, IsInt, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOfferDto } from '../../payments/dto/create-offer.dto';
import { CaseStatusLevel, ResultType } from '../entities/service-case.entity';

export class ChangeStatusDto {
  @IsInt()
  @IsEnum(CaseStatusLevel)
  new_status_level: CaseStatusLevel;

  @IsOptional()
  @IsBoolean()
  require_pickup_pin?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOfferDto)
  offer?: CreateOfferDto;

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

