import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schedule, ScheduleDocument } from './schemas/schedule.schema';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { FirebaseBridgeService } from '../firebase/firebase-bridge.service';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectModel(Schedule.name)
    private readonly model: Model<ScheduleDocument>,
    private readonly firebaseBridge: FirebaseBridgeService,
  ) {}

  async create(ownerId: string, dto: CreateScheduleDto) {
    this.logger.debug(`create() owner=${ownerId} dto=${JSON.stringify(dto)}`);

    try {
      if (!ownerId)
        throw new BadRequestException('ownerId ausente no token');
      if (!dto?.medicationId)
        throw new BadRequestException('medicationId obrigatório');

      const owner = new Types.ObjectId(ownerId);
      const medicationId = new Types.ObjectId(dto.medicationId);

      const when = new Date(dto.nextAt as any);
      if (isNaN(when.getTime())) {
        throw new BadRequestException(`nextAt inválido: ${dto.nextAt}`);
      }

      const doc = await this.model.create({
        owner,
        medicationId,
        dose: (dto as any).dose,
        nextAt: when,
        enabled: true,
        repeatHours: (dto as any).repeatHours ?? null,
      });

      await this.firebaseBridge.syncOwner(ownerId);

      this.logger.log(
        `✅ Schedule criado: ${doc._id} (owner=${ownerId}, med=${dto.medicationId}, nextAt=${when.toISOString()})`,
      );
      return doc.toObject();
    } catch (err: any) {
      this.logger.error(
        `❌ Erro ao criar schedule: ${err?.message}`,
        err?.stack,
      );
      if (err?.status) throw err;
      throw new InternalServerErrorException(
        err?.message || 'create failed',
      );
    }
  }

  async listByOwner(ownerId: string) {
    return this.model
      .find({ owner: new Types.ObjectId(ownerId) })
      .sort({ nextAt: 1 })
      .lean()
      .exec();
  }
}
