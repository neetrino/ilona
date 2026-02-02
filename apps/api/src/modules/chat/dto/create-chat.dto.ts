import { IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds!: string[];
}


