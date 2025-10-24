import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMedDto {
  @IsString()
  name!: string;

  @IsString()
  @IsIn(['mg','mcg','g','ml','un'])
  unit!: string;

  @IsInt()
  @Min(0)
  stock!: number;
}




