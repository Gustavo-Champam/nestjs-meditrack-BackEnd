import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as admin from 'firebase-admin';

import { Device, DeviceDocument } from '../devices/device.schema';
import {
  Schedule,
  ScheduleDocument,
} from '../schedules/schemas/schedule.schema';
import {
  Medication,
  MedicationDocument,
} from '../medications/schemas/medication.schema';

@Injectable()
export class FirebaseBridgeService {
  private readonly logger = new Logger(FirebaseBridgeService.name);

  constructor(
    @Inject('FIREBASE_ADMIN')
    private readonly firebase: typeof admin,

    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,

    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<ScheduleDocument>,

    @InjectModel(Medication.name)
    private readonly medicationModel: Model<MedicationDocument>,
  ) {}

  /**
   * Recria o snapshot de schedules no Firebase
   * para todos os devices ativos de um determinado usuário.
   */
  async syncOwner(ownerId: string): Promise<void> {
    try {
      const owner = new Types.ObjectId(ownerId);

      const [devices, schedules, meds] = await Promise.all([
        this.deviceModel.find({ owner, active: true }).lean().exec(),
        this.scheduleModel.find({ owner }).lean().exec(),
        this.medicationModel.find({ owner }).lean().exec(),
      ]);

      if (!devices.length) {
        this.logger.log(
          `Nenhum device ativo para owner=${ownerId}, nada para sincronizar.`,
        );
        return;
      }

      const medsById = new Map(meds.map((m) => [String(m._id), m]));
      const db = this.firebase.database();
      const nowIso = new Date().toISOString();

      const ops: Promise<unknown>[] = [];

      for (const device of devices) {
        const schedulesPayload: Record<string, unknown> = {};

        for (const s of schedules) {
          const med = medsById.get(String(s.medicationId));
          const nextAt =
            s.nextAt instanceof Date ? s.nextAt : new Date(s.nextAt);

          schedulesPayload[String(s._id)] = {
            scheduleId: String(s._id),
            medicationId: String(s.medicationId),
            medicationName: med?.name ?? null,
            unit: (med as any)?.unit ?? null,
            dose: (s as any).dose,
            nextAt: nextAt.toISOString(),
            repeatHours: (s as any).repeatHours ?? null,
          };
        }

        const ref = db.ref(`devices/${device.deviceId}`);

        ops.push(
          ref.set({
            ownerId,
            deviceId: device.deviceId,
            updatedAt: nowIso,
            schedules: schedulesPayload,
          }),
        );
      }

      await Promise.all(ops);

      this.logger.log(
        `Firebase sincronizado para owner=${ownerId} (devices=${devices
          .map((d) => d.deviceId)
          .join(', ')}, schedules=${schedules.length})`,
      );
    } catch (err: any) {
      this.logger.error(
        `Erro ao sincronizar Firebase para owner=${ownerId}: ${err?.message}`,
        err?.stack,
      );
      // erro no bridge não deve quebrar a API para o app/ESP
    }
  }
}
