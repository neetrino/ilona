import { IsString, IsNotEmpty } from 'class-validator';

export class AddGroupMemberDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
