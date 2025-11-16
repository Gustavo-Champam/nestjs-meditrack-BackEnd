import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as admin from 'firebase-admin';

import { Device, DeviceSchema } from '../devices/device.schema';
import {
  Schedule,
  ScheduleSchema,
} from '../schedules/schemas/schedule.schema';
import {
  Medication,
  MedicationSchema,
} from '../medications/schemas/medication.schema';
import { FirebaseBridgeService } from './firebase-bridge.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Medication.name, schema: MedicationSchema },
    ]),
  ],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const json = cfg.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
        const dbUrl = cfg.get<string>('FIREBASE_DB_URL');

        if (!admin.apps.length) {
          if (json) {
            const serviceAccount = JSON.parse(json);
            admin.initializeApp({
              credential: admin.credential.cert(
                serviceAccount as admin.ServiceAccount,
              ),
              databaseURL: dbUrl,
            });
          } else {
            admin.initializeApp({ databaseURL: dbUrl });
          }
        }

        return admin;
      },
    },
    FirebaseBridgeService,
  ],
  exports: ['FIREBASE_ADMIN', FirebaseBridgeService],
})
export class FirebaseModule {}
