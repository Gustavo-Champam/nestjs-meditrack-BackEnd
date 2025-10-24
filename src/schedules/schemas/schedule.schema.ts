import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, required: true })
  owner: Types.ObjectId;

  // >>> chave correta que o seu modelo está exigindo
  @Prop({ type: Types.ObjectId, ref: 'Medication', index: true, required: true })
  medicationId: Types.ObjectId;

  @Prop({ type: Number, min: 0, required: true })
  dose: number;

  @Prop({ type: Date, index: true, required: true })
  nextAt: Date;

  @Prop({ type: Boolean, default: true })
  enabled: boolean;
}

export type ScheduleDocument = HydratedDocument<Schedule>;
export const ScheduleSchema = SchemaFactory.createForClass(Schedule);




