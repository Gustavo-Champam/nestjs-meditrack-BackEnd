import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MedicationDocument = HydratedDocument<Medication>;

@Schema({ timestamps: true })
export class Medication {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) owner: Types.ObjectId;
  @Prop({ required: true }) name: string;
  @Prop() description?: string;
  @Prop() unit?: string;
  @Prop({ default: 0 }) stock: number;
}

export const MedicationSchema = SchemaFactory.createForClass(Medication);




