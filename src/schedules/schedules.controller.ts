import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import {
  Schedule,
  ScheduleDocument,
} from './schemas/schedule.schema';
import { FirebaseBridgeService } from '../firebase/firebase-bridge.service';

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

  while (t.getTime() < now) {
    t = new Date(t.getTime() + step);
  }
  return t;
}

@UseGuards(AuthGuard('jwt'))
@Controller('schedules')
export class SchedulesController {
  constructor(
    @InjectModel(Schedule.name)
    private readonly model: Model<ScheduleDocument>,
    private readonly fbBridge: FirebaseBridgeService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateDto) {
    const ownerId = String(req.user.sub);

    const doc = await this.model.create({
      owner: new Types.ObjectId(ownerId),
      medicationId: new Types.ObjectId(dto.medicationId),
      dose: dto.dose,
      nextAt: new Date(dto.nextAt),
      repeatHours: dto.repeatHours,
    });

    // 🔥 dispara a sincronização para os devices do usuário
    await this.fbBridge.syncOwner(ownerId);

    const nextAtEffective = computeEffectiveNextAt(
      doc.nextAt,
      (doc as any).repeatHours,
    );
    const out = doc.toObject();

    return { ...out, nextAtEffective };
  }

  @Get()
  async list(@Req() req: any, @Query('day') day?: string) {
    const ownerId = String(req.user.sub);
    const owner = new Types.ObjectId(ownerId);

    const q: any = { owner };

    if (day) {
      const start = new Date(`${day}T00:00:00.000Z`);
      const end = new Date(`${day}T23:59:59.999Z`);
      q.nextAt = { $gte: start, $lte: end };
    }

    const rows = await this.model.find(q).sort({ nextAt: 1 }).lean();
    const now = Date.now();

    return rows.map((i: any) => {
      const nextAtEffective = computeEffectiveNextAt(
        new Date(i.nextAt),
        i.repeatHours,
      );
      const countdownMs = nextAtEffective.getTime() - now;
      return { ...i, nextAtEffective, countdownMs };
    });
  }

  @Get('_whoami')
  whoami(@Req() req: any) {
    return { sub: req.user?.sub };
  }
}
