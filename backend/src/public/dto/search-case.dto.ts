import { IsString, IsNotEmpty } from 'class-validator';

export class SearchCaseDto {
  @IsString()
  @IsNotEmpty()
  case_number: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

