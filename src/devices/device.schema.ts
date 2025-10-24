import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Device {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  deviceId!: string; // provisÃ³rio no pair, definitivo no bind

  @Prop({ default: false })
  active!: boolean;

  @Prop({ default: () => new Date() })
  pairTokenIssuedAt!: Date;

  @Prop({ default: () => Math.random().toString(36).slice(2, 10) })
  pairToken!: string;
}
export type DeviceDocument = HydratedDocument<Device>;
export const DeviceSchema = SchemaFactory.createForClass(Device);




