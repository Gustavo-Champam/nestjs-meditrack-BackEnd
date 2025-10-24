import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('schedules')
export class SchedulesWhoamiController {
  @Get('_whoami')
  @UseGuards(AuthGuard('jwt'))
  whoami(@Req() req: any) {
    const u = req.user || {};
    return { ok: true, sub: u.sub, userId: u.userId ?? u.sub, email: u.email };
  }
}

