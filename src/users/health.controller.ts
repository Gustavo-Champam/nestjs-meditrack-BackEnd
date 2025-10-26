import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { HealthProfile, HealthProfileDocument } from './schemas/health.schema';
import { UpdateHealthDto } from './dto/health.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('users/me/health')
export class HealthController {
  constructor(@InjectModel(HealthProfile.name) private readonly model: Model<HealthProfileDocument>) {}

  @Get()
  async get(@Req() req: any) {
    const userId = new Types.ObjectId(req.user.sub);
    const doc = await this.model.findOne({ userId }).lean();
    return doc ?? { userId, healthProfile: {}, medTeam: {} };
  }

  @Put()
  async put(@Req() req: any, @Body() dto: UpdateHealthDto) {
    const userId = new Types.ObjectId(req.user.sub);
    const set: any = {};
    if (dto.healthProfile !== undefined) set.healthProfile = dto.healthProfile;
    if (dto.medTeam !== undefined) set.medTeam = dto.medTeam;

    return this.model.findOneAndUpdate(
      { userId }, { $set: set, $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
}