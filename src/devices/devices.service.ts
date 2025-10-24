import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device } from './device.schema';

@Injectable()
export class DevicesService {
  private static readonly PAIR_TOKEN_TTL_MINUTES = 10;
  private readonly logger = new Logger(DevicesService.name);

  constructor(@InjectModel(Device.name) private model: Model<Device>) {}

  async createPairToken(ownerId: string) {
    try {
      const placeholderId = String(new Types.ObjectId());
      const doc = await this.model.create({
        owner: new Types.ObjectId(ownerId),
        deviceId: placeholderId,
        active: false,
        // pairToken / pairTokenIssuedAt via defaults
      });
      return {
        pairToken: doc.pairToken,
        deviceId: doc.deviceId,
        expiresInMinutes: DevicesService.PAIR_TOKEN_TTL_MINUTES,
      };
    } catch (e: any) {
      this.logger.error(`Falha ao criar pair token: ${e?.message || e}`);
      throw new BadRequestException('NÃ£o foi possÃ­vel gerar o token de pareamento.');
    }
  }

  async bind(ownerId: string, { pairToken, deviceId }: { pairToken: string; deviceId: string }) {
    const doc = await this.model.findOne({ pairToken, owner: new Types.ObjectId(ownerId) });
    if (!doc) throw new NotFoundException('Token invÃ¡lido');

    const baseTs = new Date(doc.pairTokenIssuedAt || (doc as any).createdAt || Date.now()).getTime();
    const ageMs = Date.now() - baseTs;
    if (ageMs > DevicesService.PAIR_TOKEN_TTL_MINUTES * 60_000) {
      throw new NotFoundException('Token expirado, gere outro.');
    }

    try {
      doc.deviceId = deviceId;
      doc.active = true;
      (doc as any).pairToken = Math.random().toString(36).slice(2, 10); // invalida token
      await doc.save();
      return { ok: true };
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new BadRequestException('Este deviceId jÃ¡ estÃ¡ vinculado a outro usuÃ¡rio.');
      }
      throw e;
    }
  }
}




