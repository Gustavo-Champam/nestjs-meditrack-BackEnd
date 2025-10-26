import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { HealthController } from './health.controller';
import { PreferencesController } from './preferences.controller';

import { User, UserSchema } from './schemas/user.schema';
import { UserProfile, UserProfileSchema } from './schemas/user-profile.schema';
import { HealthProfile, HealthProfileSchema } from './schemas/health.schema';
import { UserPreferences, UserPreferencesSchema } from './schemas/preferences.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: HealthProfile.name, schema: HealthProfileSchema },
      { name: UserPreferences.name, schema: UserPreferencesSchema },
    ]),
  ],
  controllers: [UsersController, HealthController, PreferencesController],
})
export class UsersModule {}
