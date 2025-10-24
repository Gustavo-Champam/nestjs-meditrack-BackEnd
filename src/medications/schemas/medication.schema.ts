import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'medications' })
export class Medication {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  unit!: string;

  @Prop({ default: 0 })
  stock!: number;
}

export type MedicationDocument = HydratedDocument<Medication>;
export const MedicationSchema = SchemaFactory.createForClass(Medication);

// Evita duplicidade do mesmo nome por usuário
MedicationSchema.index({ owner: 1, name: 1 }, { unique: true });




