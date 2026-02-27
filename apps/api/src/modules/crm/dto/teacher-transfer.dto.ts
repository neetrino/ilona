import { IsString, MinLength, MaxLength } from 'class-validator';

export class TeacherTransferDto {
  @IsString()
  @MinLength(10, { message: 'Comment must include where to transfer and why (at least 10 characters)' })
  @MaxLength(2000)
  comment!: string; // must include where to transfer + why
}
