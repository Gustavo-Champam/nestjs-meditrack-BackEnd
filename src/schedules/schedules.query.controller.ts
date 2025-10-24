import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule, ScheduleDocument } from './schemas/schedule.schema';

@UseGuards(AuthGuard('jwt'))
@Controller('schedules')
export class SchedulesQueryController {
  constructor(@InjectModel(Schedule.name) private readonly schedModel: Model<ScheduleDocument>) {}

  @Get('day')
  async byDay(@Req() req: any, @Query('day') day: string) {
    if(!day) return { value: [], Count: 0 };
    const start = new Date(day + 'T00:00:00.000Z');
    const end   = new Date(day + 'T23:59:59.999Z');
    const list = await this.schedModel
      .find({ owner: req.user.sub, nextAt: { $gte: start, $lte: end } })
      .sort({ nextAt: 1 });
    return { value: list, Count: list.length };
  }

  @Get('upcoming')
  async upcoming(@Req() req: any, @Query('limit') limit = '1') {
    const lim = Math.max(1, parseInt(String(limit), 10) || 1);
    const list = await this.schedModel
      .find({ owner: req.user.sub, enabled: true, nextAt: { $gte: new Date() } })
      .sort({ nextAt: 1 })
      .limit(lim);
    return { value: list, Count: list.length };
  }
}




