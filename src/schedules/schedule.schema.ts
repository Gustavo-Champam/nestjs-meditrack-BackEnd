import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'schedules', timestamps: true })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  owner: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Medication', required: true })
  medicationId: Types.ObjectId;

  @Prop({ required: true })
  dose: number;

  @Prop({ type: Date, required: true })
  nextAt: Date;

  // NOVO: frequência opcional em horas
  @Prop({ type: Number, required: false })
  repeatHours?: number;
}
export type ScheduleDocument = HydratedDocument<Schedule>;
export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
