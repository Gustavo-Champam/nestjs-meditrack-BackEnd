import { IsMongoId, IsNumber, Min, IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @IsMongoId()
  medicationId: string;

  @IsNumber()
  @Min(0)
  dose: number;

  @IsDateString()
  nextAt: string;
}




