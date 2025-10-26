import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { Schedule } from './schedule.schema';

@UseGuards(AuthGuard('jwt'))
@Controller('schedules')
export class UpcomingController {
  constructor(@InjectModel(Schedule.name) private readonly model: Model<Schedule>) {}

  @Get('upcoming')
  async upcoming(@Req() req: any, @Query('horizonHours') horizon = '168') {
    const owner = new Types.ObjectId(req.user.sub);

    let h = parseInt(String(horizon), 10);
    if (Number.isNaN(h)) { h = 168; }
    if (h < 1) h = 1;
    if (h > 720) h = 720;

    const base = await this.model.find({ owner }).lean();
    const now = Date.now();
    const end = now + h * 3600 * 1000;

    const out: any[] = [];
    for (const s of base as any[]) {
      const step = (s.repeatHours && s.repeatHours > 0) ? s.repeatHours * 3600 * 1000 : 0;
      let t = new Date(s.nextAt).getTime();
      if (Number.isNaN(t)) continue;

      while (t <= end) {
        if (t >= now) {
          out.push({
            scheduleId: s._id,
            medicationId: s.medicationId,
            dose: s.dose,
            occurrenceAt: new Date(t).toISOString(),
          });
        }
        if (!step) break;
        t += step;
      }
    }
    out.sort((a, b) => (a.occurrenceAt < b.occurrenceAt ? -1 : 1));
    return { value: out, Count: out.length };
  }
}
