import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'user_preferences', timestamps: true })
export class UserPreferences {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, unique: true })
  userId: Types.ObjectId;

  @Prop() timezone?: string;
  @Prop() locale?: string;
  @Prop() timeFormat?: string; // "24h" | "12h"
  @Prop() units?: string;      // "metric" | "imperial"

  @Prop({ type: Array, default: [] }) accessibility?: any[];
  @Prop({ type: Array, default: [] }) notificationSettings?: any[];
}
export type UserPreferencesDocument = HydratedDocument<UserPreferences>;
export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);