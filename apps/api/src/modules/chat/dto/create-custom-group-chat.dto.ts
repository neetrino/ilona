import { IsString, IsOptional, IsArray, MinLength, MaxLength } from 'class-validator';

export class CreateCustomGroupChatDto {
  @IsString()
  @MinLength(1, { message: 'Group name is required' })
  @MaxLength(200)
  name!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participantIds?: string[];
}
