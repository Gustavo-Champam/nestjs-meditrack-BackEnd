import { Body, Controller, Param, Patch, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Medication, MedicationDocument } from './schemas/medication.schema';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

class UpdateMedicationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsInt() @Min(0) stock?: number;
}
class RefillDto {
  @IsInt() @Min(1) amount: number;
}

@UseGuards(AuthGuard('jwt'))
@Controller('medications')
export class MedicationsMgmtController {
  constructor(@InjectModel(Medication.name) private readonly medModel: Model<MedicationDocument>) {}

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateMedicationDto) {
    const doc = await this.medModel.findOneAndUpdate({ _id:id, owner:req.user.sub }, { $set: dto }, { new:true });
    if(!doc) throw new NotFoundException();
    return doc;
  }

  @Post(':id/refill')
  async refill(@Req() req: any, @Param('id') id: string, @Body() dto: RefillDto) {
    const doc = await this.medModel.findOneAndUpdate({ _id:id, owner:req.user.sub }, { $inc: { stock: dto.amount } }, { new:true });
    if(!doc) throw new NotFoundException();
    return doc;
  }
}




