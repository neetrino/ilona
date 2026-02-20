import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCenterDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
}


