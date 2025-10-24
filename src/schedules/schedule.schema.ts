import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleDocument = HydratedDocument<Schedule>;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) owner: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Medication', required: true }) medicationId: Types.ObjectId;
  @Prop({ required: true }) dose: number;
  @Prop({ default: true }) enabled: boolean;
  @Prop() cron?: string;
  @Prop({ required: true }) nextAt: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
ScheduleSchema.index({ owner: 1, nextAt: 1 });




