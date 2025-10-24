import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

@Schema({ timestamps: true, collection: 'password_resets' })
export class PasswordReset {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  codeHash: string;

  @Prop()
  tokenHash?: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: false })
  used: boolean;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });




