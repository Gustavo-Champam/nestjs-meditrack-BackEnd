import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulesController } from './schedules.controller';
import { Schedule, ScheduleSchema } from './schedule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Schedule.name, schema: ScheduleSchema }]),
  ],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
