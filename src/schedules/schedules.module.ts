import { Module } from '@nestjs/common';
import { UpcomingController } from './upcoming.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulesController } from './schedules.controller';
import { Schedule, ScheduleSchema } from './schedule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Schedule.name, schema: ScheduleSchema }]),
  ],
  controllers: [SchedulesController, UpcomingController],
})
export class SchedulesModule {}


