import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'health_profiles', timestamps: true })
export class HealthProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, unique: true })
  userId: Types.ObjectId;

  @Prop([String]) alergias?: string[];
  @Prop([String]) condicoesCronicas?: string[];
  @Prop([String]) intoleranciasMedicamentos?: string[];

  @Prop() alturaCm?: number;
  @Prop() pesoKg?: number;
  @Prop() obs?: string;

  @Prop({
    type: { medico: { nome: {type: String}, crm: {type: String}, contato: {type: String} } },
    _id: false
  })
  medTeam?: { medico?: { nome?: string; crm?: string; contato?: string } };
}
export type HealthProfileDocument = HydratedDocument<HealthProfile>;
export const HealthProfileSchema = SchemaFactory.createForClass(HealthProfile);