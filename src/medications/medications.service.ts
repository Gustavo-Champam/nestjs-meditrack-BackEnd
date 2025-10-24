import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Medication, MedicationDocument } from './schemas/medication.schema';

@Injectable()
export class MedicationsService {
  constructor(
    @InjectModel(Medication.name)
    private readonly medicationModel: Model<MedicationDocument>,
  ) {}

  async create(ownerId: string, dto: any) {
    const doc = new this.medicationModel({
      owner: new Types.ObjectId(ownerId),
      name: dto?.name,
      unit: dto?.unit,
      stock: dto?.stock ?? 0,
      ...dto,
    });
    return await doc.save();
  }

  async findAll(ownerId: string) {
    return this.medicationModel
      .find({ owner: new Types.ObjectId(ownerId) })
      .lean();
  }

  async update(id: string, ownerId: string, dto: any) {
    const _id = new Types.ObjectId(id);
    const owner = new Types.ObjectId(ownerId);
    const updated = await this.medicationModel
      .findOneAndUpdate({ _id, owner }, { $set: dto }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('Medicação não encontrada');
    return updated;
  }

  async refill(id: string, ownerId: string, diff: number) {
    const amount = Number(diff);
    if (!Number.isFinite(amount) || amount === 0) {
      throw new BadRequestException('Quantidade inválida');
    }
    const _id = new Types.ObjectId(id);
    const owner = new Types.ObjectId(ownerId);
    const updated = await this.medicationModel
      .findOneAndUpdate({ _id, owner }, { $inc: { stock: amount } }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('Medicação não encontrada');
    return updated;
  }
}
