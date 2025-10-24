import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MedicationsModule } from './medications/medications.module';
import { SchedulesModule } from './schedules/schedules.module';
import { DevicesModule } from './devices/devices.module';
import { FirebaseModule } from './firebase/firebase.module';
import { WebhookModule } from './webhook/webhook.module';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGODB_URI'),
      }),
    }),
    FirebaseModule,
    AuthModule,
    UsersModule,
    MedicationsModule,
    SchedulesModule,
    DevicesModule,
    WebhookModule],
})
export class AppModule {}







