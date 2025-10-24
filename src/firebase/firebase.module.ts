import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const json = cfg.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
        if (json) {
          const cred = JSON.parse(json);
          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert(cred),
              databaseURL: cfg.get<string>('FIREBASE_DB_URL') || undefined,
            });
          }
        } else if (!admin.apps.length) {
          admin.initializeApp();
        }
        return admin;
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}




