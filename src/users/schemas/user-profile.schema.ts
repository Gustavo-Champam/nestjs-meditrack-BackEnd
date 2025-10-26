import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'user_profiles', timestamps: true })
export class UserProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, unique: true })
  userId: Types.ObjectId;

  @Prop() phone?: string;

  @Prop({
    type: {
      logradouro: { type: String },
      numero: { type: String },
      bairro: { type: String },
      cidade: { type: String },
      uf: { type: String },
      cep: { type: String },
      pais: { type: String }
    },
    _id: false
  })
  address?: {
    logradouro?: string; numero?: string; bairro?: string;
    cidade?: string; uf?: string; cep?: string; pais?: string;
  };

  @Prop() birthDate?: Date;
}
export type UserProfileDocument = HydratedDocument<UserProfile>;
export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);