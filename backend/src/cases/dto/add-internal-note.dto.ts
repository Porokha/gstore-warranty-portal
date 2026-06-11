import { IsNotEmpty, IsString } from 'class-validator';

export class AddInternalNoteDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}
