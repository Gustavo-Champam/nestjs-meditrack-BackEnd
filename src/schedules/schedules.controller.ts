import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { Schedule, ScheduleDocument } from './schedule.schema';

type CreateDto = {
  medicationId: string;
  dose: number;
  nextAt: string | Date;
  repeatHours?: number;
};

function computeEffectiveNextAt(nextAt: Date, repeatHours?: number): Date {
  if (!repeatHours || repeatHours <= 0) return nextAt;
  const now = Date.now();
  let t = new Date(nextAt);
  const step = repeatHours * 3600 * 1000;
  // avança em passos de repeatHours até ficar no futuro
  while (t.getTime() < now) t = new Date(t.getTime() + step);
  return t;
}

@UseGuards(AuthGuard('jwt'))
@Controller('schedules')
export class SchedulesController {
  constructor(
    @InjectModel(Schedule.name) private readonly model: Model<ScheduleDocument>,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateDto) {
    const doc = await this.model.create({
      owner: new Types.ObjectId(req.user.sub),
      medicationId: new Types.ObjectId(dto.medicationId),
      dose: dto.dose,
      nextAt: new Date(dto.nextAt),
      repeatHours: dto.repeatHours,
    });

    const nextAtEffective = computeEffectiveNextAt(doc.nextAt, doc.repeatHours);
    const out = doc.toObject();
    return { ...out, nextAtEffective };
  }

  @Get()
  async list(@Req() req: any, @Query('day') day?: string) {
    const owner = new Types.ObjectId(req.user.sub);
    const q: any = { owner };

    if (day) {
      // filtro simples por dia (UTC)
      const start = new Date(`${day}T00:00:00.000Z`);
      const end = new Date(`${day}T23:59:59.999Z`);
      q.nextAt = { $gte: start, $lte: end };
    }

    const rows = await this.model.find(q).sort({ nextAt: 1 }).lean();
    const now = Date.now();
    return rows.map((i: any) => {
      const nextAtEffective = computeEffectiveNextAt(new Date(i.nextAt), i.repeatHours);
      const countdownMs = nextAtEffective.getTime() - now;
      return { ...i, nextAtEffective, countdownMs };
    });
  }

  // mantém o utilitário existente do app
  @Get('_whoami')
  whoami(@Req() req: any) {
    return { sub: req.user?.sub };
  }
}
