import { SchedulesQueryController } from './schedules.query.controller';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { Schedule, ScheduleSchema } from './schedule.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Schedule.name, schema: ScheduleSchema }])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}





