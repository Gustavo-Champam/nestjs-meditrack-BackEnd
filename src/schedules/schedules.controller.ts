import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateScheduleDto) {
    const userId = (req as any)?.user?.sub as string;
    return this.schedulesService.create(userId, dto);
  }

  @Get()
  list(@Req() req: Request) {
    const userId = (req as any)?.user?.sub as string;
    return this.schedulesService.listByOwner(userId);
  }

  @Get('_whoami')
  who(@Req() req: Request) {
    return (req as any).user;
  }
}




