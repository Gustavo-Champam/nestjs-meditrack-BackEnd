import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { UserPreferences, UserPreferencesDocument } from './schemas/preferences.schema';
import { UpdatePreferencesDto } from './dto/preferences.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('users/me/preferences')
export class PreferencesController {
  constructor(
    @InjectModel(UserPreferences.name) private readonly model: Model<UserPreferencesDocument>,
  ) {}

  @Get()
  async get(@Req() req: any) {
    const userId = new Types.ObjectId(req.user.sub);
    const doc = await this.model.findOne({ userId }).lean();
    return doc ?? { userId, timezone: 'America/Sao_Paulo', timeFormat: '24h', units: 'metric', accessibility: [], notificationSettings: [] };
  }

  @Put()
  async put(@Req() req: any, @Body() dto: UpdatePreferencesDto) {
    const userId = new Types.ObjectId(req.user.sub);
    const doc = await this.model.findOneAndUpdate(
      { userId },
      { $set: dto, $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return doc;
  }
}
