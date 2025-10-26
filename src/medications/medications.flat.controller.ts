import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { Medication } from './schemas/medication.schema';

@UseGuards(AuthGuard('jwt'))
@Controller('medications')
export class MedicationsFlatController {
  constructor(@InjectModel(Medication.name) private readonly model: Model<Medication>) {}

  @Get('flat')
  async flat(@Req() req: any) {
    const owner = new Types.ObjectId(req.user.sub);
    return this.model.find({ owner }).sort({ createdAt: -1 }).lean();
  }

  @Get()
  async list(@Req() req: any, @Query('flat') flat?: string) {
    const owner = new Types.ObjectId(req.user.sub);
    const items = await this.model.find({ owner }).sort({ createdAt: -1 }).lean();
    if (flat === '1' || flat === 'true') return items;
    return { value: items, Count: items.length };
  }
}
